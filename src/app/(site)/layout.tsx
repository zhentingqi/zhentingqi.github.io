import { getConfig } from "@/lib/config";
import SiteHeader from "@/components/SiteHeader";
import BackToTop from "@/components/BackToTop";

export default function SiteLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const config = getConfig();
  const year = new Date().getFullYear();

  return (
    <>
      <div className="mx-auto max-w-[720px] px-4 sm:px-6">
        <SiteHeader config={config} />
      </div>
      <main className="mx-auto max-w-[720px] px-4 pt-4 pb-16 sm:px-6 sm:pt-6">{children}</main>
      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-[720px] flex-col items-center gap-1 px-4 py-8 text-center text-[0.8rem] text-muted sm:px-6">
          <p>
            © {year} {config.author.name}
          </p>
          {config.site.last_updated && <p>Last updated {config.site.last_updated}</p>}
          <BackToTop />
        </div>
      </footer>
    </>
  );
}
