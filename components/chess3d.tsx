"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

type Side = "w" | "b";

interface ChessPiece {
  group: THREE.Group;
  type: string;
  color: Side;
  row: number;
  col: number;
}

interface SquareRef {
  r: number;
  c: number;
}

const BOARD_TOP = 0.06;
const LIGHT_SQ = 0xf0d9b5;
const DARK_SQ = 0xb58863;
const VOID = 0x0a0b0d;
const ACID = 0xc6f832;

const squareX = (c: number) => c - 3.5;
const squareZ = (r: number) => r - 3.5;

function easeInOutCubic(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export function Chess3D() {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [turn, setTurn] = useState<Side>("w");
  const [resets, setResets] = useState(0);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true });
    } catch {
      queueMicrotask(() => setFailed(true));
      return;
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    const canvas = renderer.domElement;
    canvas.style.display = "block";
    canvas.style.touchAction = "none";
    container.appendChild(canvas);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(VOID);
    scene.fog = new THREE.Fog(VOID, 24, 58);

    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 200);

    const resize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (!w || !h) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    resize();
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);

    /* ---------- orbit controls ---------- */

    const orbit = { theta: 0, phi: 1.0, radius: 11.5 };
    const orbitTarget = new THREE.Vector3(0, 0.4, 0);

    function updateCamera() {
      const ph = Math.max(0.2, Math.min(1.45, orbit.phi));
      const r = orbit.radius;
      camera.position.set(
        orbitTarget.x + r * Math.sin(ph) * Math.sin(orbit.theta),
        orbitTarget.y + r * Math.cos(ph),
        orbitTarget.z + r * Math.sin(ph) * Math.cos(orbit.theta),
      );
      camera.lookAt(orbitTarget);
    }
    updateCamera();

    /* ---------- lights ---------- */

    scene.add(new THREE.HemisphereLight(0xdfe6f5, 0x3a2e24, 0.6));

    const keyLight = new THREE.DirectionalLight(0xfff3e0, 1.4);
    keyLight.position.set(7, 12, 6);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(2048, 2048);
    keyLight.shadow.camera.left = -8;
    keyLight.shadow.camera.right = 8;
    keyLight.shadow.camera.top = 8;
    keyLight.shadow.camera.bottom = -8;
    keyLight.shadow.camera.near = 1;
    keyLight.shadow.camera.far = 40;
    keyLight.shadow.bias = -0.0005;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xbfd0ff, 0.35);
    fillLight.position.set(-6, 8, -5);
    scene.add(fillLight);

    /* ---------- board ---------- */

    const lightMat = new THREE.MeshStandardMaterial({ color: LIGHT_SQ, roughness: 0.75 });
    const darkSqMat = new THREE.MeshStandardMaterial({ color: DARK_SQ, roughness: 0.75 });
    const frameMat = new THREE.MeshStandardMaterial({
      color: 0x241a12,
      roughness: 0.6,
      metalness: 0.05,
    });

    const frame = new THREE.Mesh(new THREE.BoxGeometry(9.4, 0.35, 9.4), frameMat);
    frame.position.y = -0.125;
    frame.castShadow = true;
    frame.receiveShadow = true;
    scene.add(frame);

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(80, 80),
      new THREE.MeshStandardMaterial({ color: VOID, roughness: 1 }),
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.305;
    ground.receiveShadow = true;
    scene.add(ground);

    const squareMeshes: THREE.Mesh[] = [];
    const squareGeo = new THREE.BoxGeometry(1, 0.06, 1);
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const sq = new THREE.Mesh(squareGeo, (r + c) % 2 === 0 ? lightMat : darkSqMat);
        sq.position.set(squareX(c), 0.03, squareZ(r));
        sq.receiveShadow = true;
        sq.userData = { r, c };
        scene.add(sq);
        squareMeshes.push(sq);
      }
    }

    /* ---------- indicators ---------- */

    const highlight = new THREE.Mesh(
      new THREE.PlaneGeometry(0.96, 0.96),
      new THREE.MeshBasicMaterial({
        color: ACID,
        transparent: true,
        opacity: 0.32,
        depthWrite: false,
      }),
    );
    highlight.rotation.x = -Math.PI / 2;
    highlight.position.y = 0.061;
    highlight.visible = false;
    scene.add(highlight);

    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.36, 0.45, 48),
      new THREE.MeshBasicMaterial({
        color: ACID,
        transparent: true,
        opacity: 0.9,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.063;
    ring.visible = false;
    scene.add(ring);

    /* ---------- piece materials & cached geometry ---------- */

    const whiteMat = new THREE.MeshStandardMaterial({
      color: 0xf3ecdd,
      roughness: 0.42,
      metalness: 0.06,
    });
    const blackMat = new THREE.MeshStandardMaterial({
      color: 0x2e2b29,
      roughness: 0.42,
      metalness: 0.06,
    });
    const detailMat = new THREE.MeshStandardMaterial({ color: 0x141414, roughness: 0.6 });

    const geoCache: Record<string, THREE.BufferGeometry> = {};
    function cachedGeo(key: string, make: () => THREE.BufferGeometry) {
      if (!geoCache[key]) geoCache[key] = make();
      return geoCache[key];
    }
    function addMesh(
      parent: THREE.Object3D,
      key: string,
      make: () => THREE.BufferGeometry,
      mat: THREE.Material,
      x = 0,
      y = 0,
      z = 0,
      rx = 0,
      ry = 0,
      rz = 0,
    ) {
      const m = new THREE.Mesh(cachedGeo(key, make), mat);
      m.position.set(x, y, z);
      if (rx || ry || rz) m.rotation.set(rx, ry, rz);
      m.castShadow = true;
      m.receiveShadow = true;
      parent.add(m);
      return m;
    }

    /* ---------- piece builders (base sits at y = 0) ---------- */

    function buildPawn(mat: THREE.Material) {
      const g = new THREE.Group();
      addMesh(g, "p-base", () => new THREE.CylinderGeometry(0.3, 0.34, 0.1, 32), mat, 0, 0.05, 0);
      addMesh(g, "p-collar", () => new THREE.CylinderGeometry(0.24, 0.28, 0.06, 32), mat, 0, 0.13, 0);
      addMesh(g, "p-stem", () => new THREE.CylinderGeometry(0.13, 0.21, 0.22, 32), mat, 0, 0.27, 0);
      addMesh(g, "p-neck", () => new THREE.CylinderGeometry(0.17, 0.13, 0.05, 32), mat, 0, 0.405, 0);
      addMesh(g, "p-head", () => new THREE.SphereGeometry(0.155, 24, 16), mat, 0, 0.53, 0);
      return g;
    }

    function buildRook(mat: THREE.Material) {
      const g = new THREE.Group();
      addMesh(g, "r-base", () => new THREE.CylinderGeometry(0.32, 0.36, 0.12, 32), mat, 0, 0.06, 0);
      addMesh(g, "r-body", () => new THREE.CylinderGeometry(0.25, 0.3, 0.38, 32), mat, 0, 0.31, 0);
      addMesh(g, "r-neck", () => new THREE.CylinderGeometry(0.29, 0.25, 0.06, 32), mat, 0, 0.53, 0);
      addMesh(g, "r-top", () => new THREE.CylinderGeometry(0.32, 0.32, 0.1, 32), mat, 0, 0.61, 0);
      for (let i = 0; i < 4; i++) {
        const a = (i * Math.PI) / 2;
        addMesh(
          g,
          "r-cren",
          () => new THREE.BoxGeometry(0.14, 0.13, 0.13),
          mat,
          Math.cos(a) * 0.24,
          0.715,
          Math.sin(a) * 0.24,
          0,
          -a,
          0,
        );
      }
      return g;
    }

    function buildKnight(mat: THREE.Material) {
      const g = new THREE.Group();
      addMesh(g, "n-base", () => new THREE.CylinderGeometry(0.32, 0.36, 0.12, 32), mat, 0, 0.06, 0);
      addMesh(g, "n-ped", () => new THREE.CylinderGeometry(0.26, 0.3, 0.08, 32), mat, 0, 0.16, 0);
      addMesh(g, "n-body", () => new THREE.CylinderGeometry(0.17, 0.25, 0.28, 24), mat, 0, 0.34, 0.02);

      const head = new THREE.Group();
      head.position.set(0, 0.46, -0.02);
      g.add(head);
      addMesh(head, "n-neck", () => new THREE.BoxGeometry(0.2, 0.3, 0.26), mat, 0, 0.05, 0.03, -0.3, 0, 0);
      addMesh(head, "n-skull", () => new THREE.BoxGeometry(0.19, 0.2, 0.24), mat, 0, 0.17, -0.06, -0.35, 0, 0);
      addMesh(head, "n-snout", () => new THREE.BoxGeometry(0.15, 0.13, 0.18), mat, 0, 0.11, -0.21, -0.15, 0, 0);
      addMesh(head, "n-ear1", () => new THREE.BoxGeometry(0.05, 0.11, 0.05), mat, -0.06, 0.29, -0.02, -0.2, 0, 0);
      addMesh(head, "n-ear2", () => new THREE.BoxGeometry(0.05, 0.11, 0.05), mat, 0.06, 0.29, -0.02, -0.2, 0, 0);
      addMesh(head, "n-mane", () => new THREE.BoxGeometry(0.06, 0.3, 0.1), mat, 0, 0.07, 0.16, -0.25, 0, 0);
      addMesh(head, "n-eye1", () => new THREE.SphereGeometry(0.028, 10, 8), detailMat, -0.09, 0.21, -0.11);
      addMesh(head, "n-eye2", () => new THREE.SphereGeometry(0.028, 10, 8), detailMat, 0.09, 0.21, -0.11);
      return g;
    }

    function buildBishop(mat: THREE.Material) {
      const g = new THREE.Group();
      addMesh(g, "b-base", () => new THREE.CylinderGeometry(0.3, 0.34, 0.1, 32), mat, 0, 0.05, 0);
      addMesh(g, "b-collar", () => new THREE.CylinderGeometry(0.25, 0.29, 0.06, 32), mat, 0, 0.13, 0);
      addMesh(g, "b-body", () => new THREE.CylinderGeometry(0.12, 0.23, 0.42, 32), mat, 0, 0.37, 0);
      addMesh(g, "b-collar2", () => new THREE.CylinderGeometry(0.16, 0.16, 0.05, 32), mat, 0, 0.605, 0);
      addMesh(g, "b-head", () => new THREE.SphereGeometry(0.135, 24, 16), mat, 0, 0.71, 0);
      addMesh(g, "b-slit", () => new THREE.BoxGeometry(0.3, 0.028, 0.05), detailMat, 0, 0.71, 0, 0, 0, 0.55);
      addMesh(g, "b-finial", () => new THREE.SphereGeometry(0.05, 12, 10), mat, 0, 0.87, 0);
      return g;
    }

    function buildQueen(mat: THREE.Material) {
      const g = new THREE.Group();
      addMesh(g, "q-base", () => new THREE.CylinderGeometry(0.34, 0.38, 0.12, 32), mat, 0, 0.06, 0);
      addMesh(g, "q-collar", () => new THREE.CylinderGeometry(0.27, 0.31, 0.06, 32), mat, 0, 0.15, 0);
      addMesh(g, "q-body", () => new THREE.CylinderGeometry(0.15, 0.26, 0.48, 32), mat, 0, 0.42, 0);
      addMesh(g, "q-collar2", () => new THREE.CylinderGeometry(0.21, 0.17, 0.07, 32), mat, 0, 0.695, 0);
      addMesh(g, "q-crown", () => new THREE.CylinderGeometry(0.24, 0.16, 0.16, 32), mat, 0, 0.81, 0);
      addMesh(
        g,
        "q-ring",
        () => new THREE.TorusGeometry(0.23, 0.028, 12, 40),
        mat,
        0,
        0.885,
        0,
        Math.PI / 2,
        0,
        0,
      );
      for (let i = 0; i < 8; i++) {
        const a = (i * Math.PI) / 4;
        addMesh(
          g,
          "q-pearl",
          () => new THREE.SphereGeometry(0.045, 10, 8),
          mat,
          Math.cos(a) * 0.23,
          0.925,
          Math.sin(a) * 0.23,
        );
      }
      addMesh(g, "q-top", () => new THREE.SphereGeometry(0.09, 16, 12), mat, 0, 0.99, 0);
      return g;
    }

    function buildKing(mat: THREE.Material) {
      const g = new THREE.Group();
      addMesh(g, "k-base", () => new THREE.CylinderGeometry(0.34, 0.38, 0.12, 32), mat, 0, 0.06, 0);
      addMesh(g, "k-collar", () => new THREE.CylinderGeometry(0.27, 0.31, 0.06, 32), mat, 0, 0.15, 0);
      addMesh(g, "k-body", () => new THREE.CylinderGeometry(0.15, 0.26, 0.48, 32), mat, 0, 0.42, 0);
      addMesh(g, "k-collar2", () => new THREE.CylinderGeometry(0.21, 0.17, 0.07, 32), mat, 0, 0.695, 0);
      addMesh(g, "k-crown", () => new THREE.CylinderGeometry(0.22, 0.16, 0.14, 32), mat, 0, 0.8, 0);
      addMesh(g, "k-neck", () => new THREE.CylinderGeometry(0.14, 0.14, 0.06, 32), mat, 0, 0.9, 0);
      addMesh(g, "k-orb", () => new THREE.SphereGeometry(0.07, 16, 12), mat, 0, 0.955, 0);
      addMesh(g, "k-cross-v", () => new THREE.BoxGeometry(0.055, 0.24, 0.055), mat, 0, 1.09, 0);
      addMesh(g, "k-cross-h", () => new THREE.BoxGeometry(0.17, 0.055, 0.055), mat, 0, 1.12, 0);
      return g;
    }

    const builders: Record<string, (mat: THREE.Material) => THREE.Group> = {
      p: buildPawn,
      r: buildRook,
      n: buildKnight,
      b: buildBishop,
      q: buildQueen,
      k: buildKing,
    };

    /* ---------- game state ---------- */

    let pieces: ChessPiece[] = [];
    let board: (ChessPiece | null)[][] = [];
    let turnSide: Side = "w";
    let selected: ChessPiece | null = null;
    let moveAnim: {
      piece: ChessPiece;
      from: THREE.Vector3;
      to: THREE.Vector3;
      t: number;
      dur: number;
    } | null = null;

    function placePiece(type: string, color: Side, r: number, c: number) {
      const group = builders[type](color === "w" ? whiteMat : blackMat);
      group.position.set(squareX(c), BOARD_TOP, squareZ(r));
      if (color === "b") group.rotation.y = Math.PI;
      scene.add(group);
      const piece: ChessPiece = { group, type, color, row: r, col: c };
      group.userData.piece = piece;
      pieces.push(piece);
      board[r][c] = piece;
    }

    function deselect() {
      selected = null;
      ring.visible = false;
      highlight.visible = false;
    }

    function capturePiece(target: ChessPiece) {
      scene.remove(target.group);
      const i = pieces.indexOf(target);
      if (i !== -1) pieces.splice(i, 1);
    }

    function selectPiece(p: ChessPiece) {
      selected = p;
      ring.visible = true;
    }

    function newGame() {
      for (const p of pieces) scene.remove(p.group);
      pieces = [];
      board = Array.from({ length: 8 }, () => Array<ChessPiece | null>(8).fill(null));
      deselect();
      const back = ["r", "n", "b", "q", "k", "b", "n", "r"];
      for (let c = 0; c < 8; c++) {
        placePiece(back[c], "w", 7, c);
        placePiece("p", "w", 6, c);
        placePiece("p", "b", 1, c);
        placePiece(back[c], "b", 0, c);
      }
      turnSide = "w";
      moveAnim = null;
      setTurn("w");
    }

    function attemptMove(sq: SquareRef) {
      if (!selected) return;
      const p = selected;
      if (sq.r === p.row && sq.c === p.col) {
        deselect();
        return;
      }
      const occupant = board[sq.r][sq.c];
      if (occupant && occupant.color === p.color) {
        selectPiece(occupant);
        return;
      }
      if (occupant) capturePiece(occupant);

      board[p.row][p.col] = null;
      p.row = sq.r;
      p.col = sq.c;
      board[sq.r][sq.c] = p;

      moveAnim = {
        piece: p,
        from: p.group.position.clone(),
        to: new THREE.Vector3(squareX(sq.c), BOARD_TOP, squareZ(sq.r)),
        t: 0,
        dur: 0.34,
      };

      deselect();
      turnSide = turnSide === "w" ? "b" : "w";
      setTurn(turnSide);
    }

    /* ---------- pointer input ---------- */

    const raycaster = new THREE.Raycaster();
    const mouseNDC = new THREE.Vector2(0, 0);

    let dragging = false;
    let dragMoved = 0;
    let prevPointer = { x: 0, y: 0 };
    let pinchDist = 0;

    function pieceFromObject(obj: THREE.Object3D | null): ChessPiece | null {
      let o: THREE.Object3D | null = obj;
      while (o) {
        const p = o.userData?.piece as ChessPiece | undefined;
        if (p) return p;
        o = o.parent;
      }
      return null;
    }

    function pick() {
      raycaster.setFromCamera(mouseNDC, camera);
      const pieceHits = raycaster.intersectObjects(
        pieces.map((p) => p.group),
        true,
      );
      const squareHits = raycaster.intersectObjects(squareMeshes, false);
      return {
        piece: pieceHits.length ? pieceFromObject(pieceHits[0].object) : null,
        square: squareHits.length ? (squareHits[0].object.userData as SquareRef) : null,
      };
    }

    function doClick() {
      if (moveAnim) return;
      const { piece, square } = pick();

      if (piece) {
        if (!selected) {
          if (piece.color === turnSide) selectPiece(piece);
        } else if (piece === selected) {
          deselect();
        } else if (piece.color === selected.color) {
          selectPiece(piece);
        } else {
          attemptMove({ r: piece.row, c: piece.col });
        }
      } else if (square) {
        if (selected) attemptMove(square);
        else deselect();
      } else {
        deselect();
      }
    }

    const onMouseDown = (e: MouseEvent) => {
      dragging = true;
      dragMoved = 0;
      prevPointer = { x: e.clientX, y: e.clientY };
    };
    const onMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseNDC.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouseNDC.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      if (dragging) {
        const dx = e.clientX - prevPointer.x;
        const dy = e.clientY - prevPointer.y;
        dragMoved += Math.abs(dx) + Math.abs(dy);
        orbit.theta -= dx * 0.006;
        orbit.phi = Math.max(0.2, Math.min(1.45, orbit.phi - dy * 0.006));
        updateCamera();
        prevPointer = { x: e.clientX, y: e.clientY };
      }
    };
    const onMouseUp = (e: MouseEvent) => {
      if (dragging && dragMoved < 8 && e.target === canvas) doClick();
      dragging = false;
    };
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      orbit.radius = Math.max(6, Math.min(22, orbit.radius + e.deltaY * 0.01));
      updateCamera();
    };

    const onTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      if (e.touches.length === 1) {
        dragging = true;
        dragMoved = 0;
        prevPointer = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        mouseNDC.x = (e.touches[0].clientX / container.clientWidth) * 2 - 1;
        mouseNDC.y = -(e.touches[0].clientY / container.clientHeight) * 2 + 1;
      } else if (e.touches.length === 2) {
        dragging = false;
        pinchDist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY,
        );
      }
    };
    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      if (e.touches.length === 1 && dragging) {
        const dx = e.touches[0].clientX - prevPointer.x;
        const dy = e.touches[0].clientY - prevPointer.y;
        dragMoved += Math.abs(dx) + Math.abs(dy);
        orbit.theta -= dx * 0.006;
        orbit.phi = Math.max(0.2, Math.min(1.45, orbit.phi - dy * 0.006));
        updateCamera();
        prevPointer = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      } else if (e.touches.length === 2) {
        const d = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY,
        );
        orbit.radius = Math.max(6, Math.min(22, orbit.radius - (d - pinchDist) * 0.03));
        pinchDist = d;
        updateCamera();
      }
    };
    const onTouchEnd = (e: TouchEvent) => {
      if (dragging && dragMoved < 10) doClick();
      dragging = false;
      if (e.touches.length === 0) pinchDist = 0;
    };

    canvas.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    canvas.addEventListener("wheel", onWheel, { passive: false });
    canvas.addEventListener("touchstart", onTouchStart, { passive: false });
    canvas.addEventListener("touchmove", onTouchMove, { passive: false });
    canvas.addEventListener("touchend", onTouchEnd);

    /* ---------- animation loop ---------- */

    const clock = new THREE.Clock();
    let rafId = 0;

    function updateHover() {
      if (dragging || moveAnim) {
        highlight.visible = false;
        canvas.style.cursor = "default";
        return;
      }
      const { piece, square } = pick();

      if (selected && square) {
        highlight.position.set(squareX(square.c), 0.061, squareZ(square.r));
        highlight.visible = true;
      } else if (!selected && piece) {
        highlight.position.set(squareX(piece.col), 0.061, squareZ(piece.row));
        highlight.visible = true;
      } else {
        highlight.visible = false;
      }

      const canClick =
        (selected && (square || piece)) ||
        (!selected && piece && piece.color === turnSide);
      canvas.style.cursor = canClick ? "pointer" : "default";
    }

    function animate() {
      rafId = requestAnimationFrame(animate);
      const dt = Math.min(clock.getDelta(), 0.05);

      if (moveAnim) {
        moveAnim.t += dt;
        const t = Math.min(moveAnim.t / moveAnim.dur, 1);
        const e = easeInOutCubic(t);
        const g = moveAnim.piece.group;
        g.position.x = moveAnim.from.x + (moveAnim.to.x - moveAnim.from.x) * e;
        g.position.z = moveAnim.from.z + (moveAnim.to.z - moveAnim.from.z) * e;
        g.position.y = BOARD_TOP + Math.sin(Math.PI * t) * 0.55;
        if (t >= 1) {
          g.position.copy(moveAnim.to);
          moveAnim = null;
        }
      }

      for (const p of pieces) {
        const targetScale = p === selected ? 1.12 : 1;
        const s = p.group.scale.x + (targetScale - p.group.scale.x) * Math.min(1, dt * 14);
        p.group.scale.setScalar(s);
      }

      if (selected && !moveAnim) {
        ring.position.x = selected.group.position.x;
        ring.position.z = selected.group.position.z;
        ring.visible = true;
      }

      updateHover();
      renderer.render(scene, camera);
    }

    newGame();
    animate();

    /* ---------- teardown ---------- */

    return () => {
      cancelAnimationFrame(rafId);
      resizeObserver.disconnect();
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      canvas.removeEventListener("mousedown", onMouseDown);
      canvas.removeEventListener("wheel", onWheel);
      canvas.removeEventListener("touchstart", onTouchStart);
      canvas.removeEventListener("touchmove", onTouchMove);
      canvas.removeEventListener("touchend", onTouchEnd);
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose();
          const m = obj.material;
          if (Array.isArray(m)) m.forEach((x) => x.dispose());
          else m.dispose();
        }
      });
      renderer.dispose();
      if (canvas.parentNode === container) container.removeChild(canvas);
    };
  }, [resets]);

  if (failed) {
    return (
      <div className="panel grid h-[300px] place-items-center">
        <p className="u-label text-ink-mute">WebGL is unavailable in this browser</p>
      </div>
    );
  }

  return (
    <div className="panel flex flex-col overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-void-2 px-4 py-3">
        <span className="u-label flex items-center gap-2.5 text-ink-dim">
          <span
            aria-hidden="true"
            className="h-3 w-3 rounded-full border border-black/60"
            style={{ background: turn === "w" ? "#f3ecdd" : "#2e2b29" }}
          />
          {turn === "w" ? "White" : "Black"} to move
        </span>
        <button
          type="button"
          onClick={() => setResets((n) => n + 1)}
          className="u-label border border-line bg-panel px-3 py-1.5 text-ink-mute transition-colors hover:border-acid/50 hover:text-acid"
        >
          New game
        </button>
      </div>
      <div ref={mountRef} className="h-[62vh] min-h-[400px] w-full bg-void" />
      <p className="u-label border-t border-line px-4 py-3 text-ink-mute">
        Drag to orbit · scroll to zoom · click a piece, then a square to move — free play, no
        rules enforced
      </p>
    </div>
  );
}
