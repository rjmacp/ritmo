import Link from "next/link";

/** Page header: kicker + large title on the left, an optional avatar and an optional right-hand slot. */
export function Header({
  kicker,
  title,
  right,
  initials,
}: {
  kicker: string;
  title: string;
  right?: React.ReactNode;
  initials?: string;
}) {
  return (
    <header className="flex items-center justify-between px-5 pt-[22px] pb-[14px]">
      <div className="flex items-center gap-3">
        {initials && (
          <Link
            href="/account"
            className="w-[34px] h-[34px] rounded-full bg-ink text-white grid place-items-center text-xs font-extrabold"
          >
            {initials}
          </Link>
        )}
        <div className="flex flex-col gap-[2px]">
          <span className="k">{kicker}</span>
          <span className="num text-[26px]">{title}</span>
        </div>
      </div>
      {right}
    </header>
  );
}
