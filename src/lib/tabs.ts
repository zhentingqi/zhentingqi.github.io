'use client';

import { useLayoutEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

// The home page shows one of three views under the top bar. The active view lives in the
// URL hash (none for About, #publications, #blogs), so views can be linked to and the
// browser's back button moves between them, without ever leaving the page.

export const TAB_IDS = ['about', 'publications', 'blogs'] as const;
export type TabId = (typeof TAB_IDS)[number];

const TAB_EVENT = 'site:tabchange';

export function tabFromHash(hash: string): TabId {
    const id = hash.replace(/^#/, '');
    return (TAB_IDS as readonly string[]).includes(id) ? (id as TabId) : 'about';
}

/** Where a tab lives, as a link from any page of the site. */
export function tabHref(tab: TabId): string {
    return tab === 'about' ? '/' : `/#${tab}`;
}

/** Switch the home page to a tab in place. */
export function goToTab(tab: TabId) {
    const url = tab === 'about' ? window.location.pathname + window.location.search : `#${tab}`;
    window.history.pushState(null, '', url);
    window.dispatchEvent(new Event(TAB_EVENT));
}

/** The tab named by the current URL hash. Renders as About on the server and on first paint. */
export function useTab(): TabId {
    const [tab, setTab] = useState<TabId>('about');
    // Arriving from another page (a blog post linking to /#publications) changes the hash
    // without firing any event, so the hash is read again whenever the path changes.
    const pathname = usePathname();

    // A layout effect, so the view is switched before the browser paints and never flashes About.
    useLayoutEffect(() => {
        const read = () => {
            const next = window.location.pathname === '/' ? tabFromHash(window.location.hash) : 'about';
            document.documentElement.dataset.tab = next;
            setTab(next);
        };
        read();
        window.addEventListener('hashchange', read);
        window.addEventListener('popstate', read);
        window.addEventListener(TAB_EVENT, read);
        return () => {
            window.removeEventListener('hashchange', read);
            window.removeEventListener('popstate', read);
            window.removeEventListener(TAB_EVENT, read);
        };
    }, [pathname]);

    return tab;
}
