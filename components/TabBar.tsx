import Link from "next/link";

const TABS = [
  { href: "/", label: "Home", d: "M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z" },
  { href: "/plan", label: "Plan", d: "M3 5h18v16H3zM3 10h18M8 3v4M16 3v4" },
  { href: "/runs", label: "Runs", d: "M4 17l5-5 4 4 7-8M15 8h5v5" },
  { href: "/trends", label: "Trends", d: "M3 20h18M5 16l4-6 4 3 6-8" },
  { href: "/records", label: "Records", d: "M12 4a5 5 0 1 0 0 10 5 5 0 0 0 0-10zM9 13l-2 8 5-3 5 3-2-8" },
];

/** Fixed bottom tab bar linking between the app's five top-level sections. */
export function TabBar({ active }: { active: string }) {
  return (
    <nav className="fixed bottom-0 inset-x-0 h-[60px] bg-white border-t border-line grid grid-cols-5 items-center">
      {TABS.map((t) => (
        <Link
          key={t.href}
          href={t.href}
          className={`flex flex-col items-center gap-[3px] text-[10px] font-bold ${active === t.label ? "text-ink" : "text-muted"}`}
        >
          <svg
            viewBox="0 0 24 24"
            className="w-[22px] h-[22px] fill-none stroke-current stroke-[1.8] [stroke-linecap:round] [stroke-linejoin:round]"
          >
            <path d={t.d} />
          </svg>
          {t.label}
        </Link>
      ))}
    </nav>
  );
}
