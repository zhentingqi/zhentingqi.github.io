'use client';

import type { MouseEvent, ReactNode } from 'react';
import { smoothScrollTo } from '@/lib/scroll';

/**
 * Scroll to a heading of the post with an eased animation instead of a jump, and record the
 * heading in the address bar so the place can be linked to. `#top` goes back to the very top.
 */
export function scrollToSection(event: MouseEvent<HTMLAnchorElement>, id: string) {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    const url = id === 'top' ? window.location.pathname + window.location.search : `#${id}`;
    window.history.pushState(null, '', url);
    smoothScrollTo(`#${id}`);
}

/** A link to a heading of the post that scrolls there smoothly. */
export default function TocLink({ id, className, children }: { id: string; className?: string; children: ReactNode }) {
    return (
        <a href={`#${id}`} className={className} onClick={(event) => scrollToSection(event, id)}>
            {children}
        </a>
    );
}
