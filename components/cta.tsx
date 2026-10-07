import Link from "next/link";
import type { ReactNode } from "react";

type Variant = "primary" | "outline";

const base =
  "inline-flex items-center gap-3 px-6 py-3.5 text-sm font-bold uppercase tracking-widest transition-colors";

const styles: Record<Variant, string> = {
  primary: "bg-acid text-void hover:bg-acid-deep",
  outline:
    "text-ink ring-1 ring-line transition-colors hover:bg-panel hover:ring-ink-mute",
};

export function CTA({
  href,
  variant = "primary",
  children,
}: {
  href: string;
  variant?: Variant;
  children: ReactNode;
}) {
  return (
    <Link href={href} className={`${base} ${styles[variant]}`}>
      {children}
    </Link>
  );
}