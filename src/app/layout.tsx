import type { Metadata } from "next";
import { Inter, Source_Serif_4 } from "next/font/google";
import "./globals.css";
import { getConfig } from "@/lib/config";
import ThemeProvider from "@/components/ThemeProvider";
import SiteHeader from "@/components/SiteHeader";
import TabNav from "@/components/TabNav";
import BackToTop from "@/components/BackToTop";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  variable: "--font-source-serif",
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const config = getConfig();
  return {
    title: {
      default: config.site.title,
      template: `%s | ${config.site.title}`,
    },
    description: config.site.description,
    keywords: [config.author.name, "PhD", "Research", config.author.institution],
    authors: [{ name: config.author.name }],
    icons: { icon: config.site.favicon },
    openGraph: {
      type: "website",
      locale: "en_US",
      title: config.site.title,
      description: config.site.description,
      siteName: config.author.name,
    },
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const config = getConfig();
  const year = new Date().getFullYear();

  return (
    <html lang="en" className={`${inter.variable} ${sourceSerif.variable}`} suppressHydrationWarning>
      <body className="min-h-screen">
        <ThemeProvider>
          <div id="top" className="h-1 bg-crimson" />
          <div className="mx-auto max-w-[720px] px-4 sm:px-6">
            <SiteHeader config={config} />
          </div>
          <TabNav items={config.navigation} />
          <main className="mx-auto max-w-[720px] px-4 pt-10 pb-16 sm:px-6 sm:pt-12">{children}</main>
          <footer className="border-t border-line">
            <div className="mx-auto flex max-w-[720px] flex-col items-center gap-1 px-4 py-8 text-center text-[0.8rem] text-muted sm:px-6">
              <p>
                © {year} {config.author.name}
              </p>
              {config.site.last_updated && <p>Last updated {config.site.last_updated}</p>}
              <BackToTop />
            </div>
          </footer>
        </ThemeProvider>
      </body>
    </html>
  );
}
