import Link from "next/link";

export const NAV = [
  { label: "Live", href: "/live" },
  { label: "Schedule", href: "/#schedule" },
  { label: "Bracket", href: "/#bracket" },
  { label: "Standings", href: "/#standings" },
];

export function Mark() {
  return (
    <Link href="/" className="group flex items-center gap-3">
      <span className="grid h-7 w-8 place-items-center bg-acid font-bold text-void transition-transform duration-200 group-hover:-rotate-3">
        <span className="mono text-[13px] leading-none">OT</span>
      </span>
      <span className="flex flex-col leading-none">
        <span className="display text-[17px] tracking-[0.04em]">OVERTIME</span>
        <span className="u-label mt-1 text-ink-mute">Circuit Major · S04</span>
      </span>
    </Link>
  );
}

export function TopBar({ active }: { active: string }) {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-void/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-[1440px] items-center gap-6 px-5 md:px-8">
        <Mark />
        <nav
          aria-label="Primary"
          className="ml-auto hidden items-center gap-1 sm:flex"
        >
          {NAV.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              data-active={active === item.label}
              className={`link-nav u-label px-3 py-2 ${
                active === item.label ? "text-ink" : "text-ink-mute"
              }`}
            >
              {item.label}
              {active === item.label && (
                <span className="absolute inset-x-3 -bottom-[1px] h-[2px] bg-acid" />
              )}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-3 sm:ml-0">
          <span className="hidden items-center gap-2 ring-1 ring-line bg-panel px-3 py-1.5 md:flex">
            <span className="dot-live h-2 w-2 bg-live" aria-hidden="true" />
            <span className="u-label text-ink-dim">2 matches live</span>
          </span>
        </div>
      </div>
    </header>
  );
}

export function Ticker({ items }: { items: string[] }) {
  const row = (ariaHidden: boolean) => (
    <div
      aria-hidden={ariaHidden}
      className="flex w-max shrink-0 items-center"
    >
      {items.map((item) => (
        <span
          key={item}
          className="u-label flex items-center gap-3 whitespace-nowrap px-5 py-2 text-ink-dim"
        >
          <span className="h-1 w-1 bg-acid" aria-hidden="true" />
          {item}
        </span>
      ))}
    </div>
  );

  return (
    <div className="ticker relative overflow-hidden border-b border-line bg-void-2">
      <div className="ticker__track flex w-max">
        {row(false)}
        {row(true)}
      </div>
      <div
        className="pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-gradient-to-r from-void to-transparent"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l from-void-2 to-transparent"
        aria-hidden="true"
      />
    </div>
  );
}

export function Footer() {
  return (
    <footer className="mt-16 border-t border-line bg-void-2">
      <div className="mx-auto flex max-w-[1440px] flex-col gap-3 px-5 py-6 md:flex-row md:items-center md:justify-between md:px-8">
        <p className="u-label text-ink-mute">
          OVERTIME · CIRCUIT MAJOR S04 · LIVE FEED SYNTHETIC
        </p>
        <p className="u-label text-ink-mute">
          GAME DATA REFRESHES · 30 SEC
        </p>
      </div>
    </footer>
  );
}