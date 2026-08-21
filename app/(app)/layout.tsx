/** Shared shell for the tabbed app sections: centred column with bottom padding for the fixed tab bar. */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <div className="pb-[72px] max-w-[480px] mx-auto">{children}</div>;
}
