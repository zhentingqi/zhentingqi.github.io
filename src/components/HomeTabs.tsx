'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { goToTab, useTab, type TabId } from '@/lib/tabs';

// Height of the sticky top bar plus a little air, used when aligning a view under it.
const NAV_OFFSET = 64;

/**
 * The three views of the home page. All of them are in the HTML; only the active one is
 * shown, so switching is instant and nothing is fetched.
 */
export default function HomeTabs({ panels }: { panels: Record<TabId, ReactNode> }) {
    const tab = useTab();
    const container = useRef<HTMLDivElement>(null);
    const previous = useRef<TabId>(tab);

    // After a switch, bring the top of the new view under the bar if the reader had scrolled past it.
    useEffect(() => {
        if (previous.current === tab) return;
        previous.current = tab;
        const element = container.current;
        if (!element) return;
        const top = element.getBoundingClientRect().top + window.scrollY - NAV_OFFSET;
        if (window.scrollY > top) window.scrollTo(0, Math.max(0, top));
    }, [tab]);

    return (
        <div ref={container}>
            {(Object.keys(panels) as TabId[]).map((id) => (
                <div key={id} id={`view-${id}`} hidden={id !== tab}>
                    {panels[id]}
                </div>
            ))}
        </div>
    );
}

/** A text link that switches the home page to another view. */
export function TabLink({ to, className, children }: { to: TabId; className?: string; children: ReactNode }) {
    return (
        <a
            href={to === 'about' ? '/' : `#${to}`}
            className={className}
            onClick={(event) => {
                event.preventDefault();
                goToTab(to);
            }}
        >
            {children}
        </a>
    );
}
