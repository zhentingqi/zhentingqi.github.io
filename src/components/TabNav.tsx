'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { smoothScrollTo } from '@/lib/scroll';
import ThemeToggle from '@/components/ThemeToggle';

// Highlights the section currently under the sticky bar; links jump to in-page anchors.
export default function TabNav({ items }: { items: { title: string; href: string }[] }) {
    const [active, setActive] = useState(items[0]?.href);

    useEffect(() => {
        const sections = items
            .map((item) => document.getElementById(item.href.slice(1)))
            .filter((el): el is HTMLElement => el !== null);

        const onScroll = () => {
            const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
            let current = sections[0];
            for (const section of sections) {
                if (section.getBoundingClientRect().top <= 120) current = section;
            }
            if (atBottom) current = sections[sections.length - 1];
            if (current) setActive(`#${current.id}`);
        };

        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, [items]);

    return (
        <nav className="sticky top-0 z-20 border-y border-line bg-paper/85 backdrop-blur-md">
            <div className="mx-auto flex max-w-[720px] items-center px-4 sm:px-6">
                {/* Spacer balancing the toggle so the tabs stay centered on wider screens */}
                <span className="hidden w-9 shrink-0 sm:block" />
                <ul className="flex flex-1 justify-center sm:gap-4">
                    {items.map((item) => {
                        const isActive = item.href === active;
                        return (
                            <li key={item.href}>
                                <a
                                    href={item.href}
                                    onClick={(e) => {
                                        e.preventDefault();
                                        smoothScrollTo(item.href);
                                    }}
                                    aria-current={isActive ? 'true' : undefined}
                                    className={cn(
                                        'relative block px-2 py-3 text-[0.9rem] transition-colors sm:px-3 sm:text-[0.95rem]',
                                        isActive ? 'font-medium text-ink' : 'text-muted hover:text-ink'
                                    )}
                                >
                                    {item.title}
                                    {isActive && (
                                        <span className="absolute inset-x-2 -bottom-px h-[2px] rounded-full bg-crimson sm:inset-x-3" />
                                    )}
                                </a>
                            </li>
                        );
                    })}
                </ul>
                <ThemeToggle />
            </div>
        </nav>
    );
}
