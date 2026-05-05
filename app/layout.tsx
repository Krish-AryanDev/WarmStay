import type { Metadata } from "next";
import Link from "next/link";
import { Righteous } from "next/font/google";
import "./globals.css";

const righteous = Righteous({
  weight: "400",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "HappyStay – Find PGs near MUJ Jaipur",
  description:
    "Verified PG listings near Manipal University Jaipur. Compare prices, photos, and amenities. Inquire on WhatsApp.",
  metadataBase: new URL("https://studentpg.in")
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex max-w-6xl items-center justify-between py-3">
            <Link href="/" className="flex items-center gap-2">
              
              <span className={`${righteous.className} text-2xl  tracking-tight`}>HappyStay</span>
              <span className="ml-2 hidden text-xs text-slate-500 sm:inline">
                Find PGs near MUJ Jaipur
              </span>
            </Link>
            <nav className="text-sm text-slate-600">
              <a
                href="https://wa.me/"
                className="hidden sm:inline hover:text-brand"
                aria-label="List your PG"
              >
                List your PG
              </a>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
        <footer className="mt-12 border-t border-slate-200 bg-white">
          <div className="mx-auto max-w-6xl px-4 py-6 text-sm text-slate-500">
            © {new Date().getFullYear()} StudentPG · MUJ Jaipur
          </div>
        </footer>
      </body>
    </html>
  );
}
