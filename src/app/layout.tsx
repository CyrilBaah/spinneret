import type { Metadata } from "next";
import "./globals.css";
import { Nav } from "@/components/Nav";
import { ChatWidget } from "@/components/ChatWidget";

export const metadata: Metadata = {
  title: "Spinneret — the feed that does not go silent",
  description:
    "Self-healing public-procurement radar. Bright Data Scraper Studio. Same collector, nothing downstream sees a gap.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="shell">
          <header className="top">
            <a className="brand" href="/">
              <em>Into the Scrape-Verse</em>
              <strong>Spinneret</strong>
            </a>
            <Nav />
          </header>
          {children}
          <footer className="footer">
            Public UNDP notices only. No personal data. Collector heals in place —
            the silk holds when the web changes.
          </footer>
        </div>
        <ChatWidget />
      </body>
    </html>
  );
}
