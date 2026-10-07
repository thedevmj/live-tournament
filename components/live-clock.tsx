"use client";

import { useEffect, useSyncExternalStore, useState } from "react";

const reducedMotionQuery =
  typeof window !== "undefined"
    ? window.matchMedia("(prefers-reduced-motion: reduce)")
    : null;

function usePrefersReducedMotion() {
  return useSyncExternalStore(
    (onChange) => {
      reducedMotionQuery?.addEventListener("change", onChange);
      return () => reducedMotionQuery?.removeEventListener("change", onChange);
    },
    () => reducedMotionQuery?.matches ?? false,
    () => false,
  );
}

function fromSeconds(total: number) {
  const m = Math.max(0, Math.floor(total / 60));
  const s = Math.max(0, total % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function LiveClock({
  initial,
  className,
}: {
  initial: string;
  className?: string;
}) {
  const [seconds, setSeconds] = useState(() => {
    const [m, s] = initial.split(":").map(Number);
    return m * 60 + (Number.isFinite(s) ? s : 0);
  });
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    if (reducedMotion) return;
    const id = setInterval(() => {
      setSeconds((current) => Math.max(0, current - 1));
    }, 1000);
    return () => clearInterval(id);
  }, [reducedMotion]);

  return (
    <span className={className} aria-label="Game clock, counting down">
      {fromSeconds(seconds)}
    </span>
  );
}