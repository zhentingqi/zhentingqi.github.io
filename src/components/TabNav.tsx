'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { TAB_IDS, goToTab, tabHref, useTab, type TabId } from '@/lib/tabs';
import ThemeToggle from '@/components/ThemeToggle';

// The site's one top bar, pinned above every page. On the home page a tab swaps the view in
// place; from a blog post it links back to that view. Items come from content/config.toml,
// where each href is "#about", "#publications" or "#blogs".
export default function TabNav({ items }: { items: { title: string; href: string }[] }) {
    const pathname = usePathname() ?? '/';
    const hashTab = useTab();
    const onHome = pathname === '/';
    const active: TabId = onHome ? hashTab : pathname.startsWith('/blog') ? 'blogs' : 'about';

    const tabs = items
        .map((item) => ({ title: item.title, id: item.href.replace(/^#/, '') as TabId }))
        .filter((item) => (TAB_IDS as readonly string[]).includes(item.id));

    return (
        <nav aria-label="Main" className="sticky top-0 z-20 border-b border-line bg-paper/85 backdrop-blur-md">
            <div className="mx-auto flex max-w-[720px] items-center px-4 sm:px-6">
                {/* Spacer balancing the toggle so the tabs stay centered on wider screens */}
                <span className="hidden w-9 shrink-0 sm:block" />
                <ul className="flex min-w-0 flex-1 justify-center gap-2 sm:gap-4">
                    {tabs.map(({ id, title }) => {
                        const isActive = id === active;
                        return (
                            <li key={id}>
                                <Link
                                    href={tabHref(id)}
                                    scroll={false}
                                    onClick={(event) => {
                                        if (!onHome || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
                                        event.preventDefault();
                                        goToTab(id);
                                    }}
                                    aria-current={isActive ? 'page' : undefined}
                                    className={cn(
                                        'relative block whitespace-nowrap px-2 py-3 text-[0.9rem] transition-colors sm:px-3 sm:text-[0.95rem]',
                                        isActive ? 'font-medium text-ink' : 'text-muted hover:text-ink',
                                    )}
                                >
                                    {title}
                                    {isActive && <span className="absolute inset-x-2 bottom-0 h-[2px] rounded-full bg-crimson sm:inset-x-3" />}
                                </Link>
                            </li>
                        );
                    })}
                </ul>
                <ThemeToggle />
            </div>
        </nav>
    );
}
