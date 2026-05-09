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

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#0d6e6e"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col">
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
            <Link href="/" className="flex min-w-0 items-center gap-2">
              <span className={`${righteous.className} text-xl tracking-tight sm:text-2xl`}>
                HappyStay
              </span>
              <span className="ml-1 hidden truncate text-xs text-slate-500 sm:inline">
                Find PGs near MUJ Jaipur
              </span>
            </Link>
            <nav>
              <a
                href={`https://wa.me/${process.env.NEXT_PUBLIC_ADMIN_WHATSAPP ?? ""}?text=${encodeURIComponent(
                  "Hi! I'd like to list my PG on HappyStay."
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-brand hover:text-brand sm:px-4 sm:py-2 sm:text-sm"
                aria-label="List your PG"
              >
                List your PG
              </a>
            </nav>
          </div>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-6 pt-2 sm:px-6 sm:pb-8 sm:pt-3">
          {children}
        </main>
        <footer className="mt-10 border-t border-slate-200 bg-white">
          <div className="mx-auto max-w-6xl px-4 py-5 text-center text-xs text-slate-500 sm:px-6 sm:py-6 sm:text-sm">
            © {new Date().getFullYear()} HappyStay · MUJ Jaipur
          </div>
        </footer>
      </body>
    </html>
  );
}
