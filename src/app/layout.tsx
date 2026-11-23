import type { Metadata } from "next";
import { Inter, Source_Serif_4 } from "next/font/google";
import "./globals.css";
import { getConfig } from "@/lib/config";
import ThemeProvider from "@/components/ThemeProvider";
import TabNav from "@/components/TabNav";

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

// The root layout sets up the document, fonts and theme, and owns the one top bar that stays
// pinned above every page. What sits under the bar comes from the route layouts:
// `(site)/layout.tsx` for the home page, `blog/layout.tsx` for blog posts.
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const config = getConfig();
  return (
    <html lang="en" className={`${inter.variable} ${sourceSerif.variable}`} suppressHydrationWarning>
      <body className="min-h-screen">
        <ThemeProvider>
          <div id="top" className="h-1 bg-crimson" />
          <TabNav items={config.navigation} />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
