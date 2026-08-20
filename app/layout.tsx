import type { Metadata, Viewport } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";

const manrope = Manrope({ subsets: ["latin"], weight: ["500", "700", "800"], variable: "--font-manrope" });

export const metadata: Metadata = {
  title: "Ritmo",
  description: "Your running, planned and explained.",
  manifest: "/manifest.webmanifest",
};
export const viewport: Viewport = { themeColor: "#16223d", width: "device-width", initialScale: 1 };

/** App-wide HTML shell: loads the Manrope font and global styles for every route. */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={manrope.variable}>
      <body className="font-sans antialiased min-h-dvh">{children}</body>
    </html>
  );
}
