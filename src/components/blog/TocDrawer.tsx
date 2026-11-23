'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { TableOfContents, X } from 'lucide-react';

interface TocItem {
    id: string;
    text: string;
}

/** From this width up the open panel sits in the free left margin and can stay open while reading. */
const PINNED_QUERY = '(min-width: 1440px)';

/**
 * A button fixed at the left edge that opens the table of contents as a side panel.
 * The section being read is marked. On narrow screens the panel overlays the page and
 * closes after a jump; on very wide screens it stays open beside the text.
 */
export default function TocDrawer({ items }: { items: TocItem[] }) {
    const [open, setOpen] = useState(false);
    const [active, setActive] = useState(items[0]?.id);
    const button = useRef<HTMLButtonElement>(null);
    const panel = useRef<HTMLElement>(null);

    const close = useCallback((returnFocus = true) => {
        setOpen(false);
        if (returnFocus) button.current?.focus();
    }, []);

    // Track which section is under the top of the viewport.
    useEffect(() => {
        const headings = items.map((item) => document.getElementById(item.id)).filter((el): el is HTMLElement => el !== null);
        if (headings.length === 0) return;

        let frame = 0;
        const update = () => {
            frame = 0;
            let current = headings[0];
            for (const heading of headings) {
                if (heading.getBoundingClientRect().top <= 120) current = heading;
            }
            setActive(current.id);
        };
        const onScroll = () => {
            if (!frame) frame = requestAnimationFrame(update);
        };
        update();
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => {
            window.removeEventListener('scroll', onScroll);
            if (frame) cancelAnimationFrame(frame);
        };
    }, [items]);

    // Escape closes the panel; opening it moves focus inside.
    useEffect(() => {
        if (!open) return;
        const onKey = (event: KeyboardEvent) => {
            if (event.key === 'Escape') close();
        };
        window.addEventListener('keydown', onKey);
        panel.current?.querySelector<HTMLElement>('a[aria-current], a')?.focus({ preventScroll: true });
        return () => window.removeEventListener('keydown', onKey);
    }, [open, close]);

    const onJump = () => {
        if (!window.matchMedia(PINNED_QUERY).matches) close(false);
    };

    return (
        <>
            <button
                ref={button}
                type="button"
                className="b-toc-btn"
                aria-expanded={open}
                aria-controls="post-toc"
                onClick={() => setOpen((value) => !value)}
            >
                <TableOfContents size={18} strokeWidth={1.5} aria-hidden="true" />
                <span>Contents</span>
            </button>

            <div className={`b-toc-backdrop${open ? ' is-open' : ''}`} onClick={() => close(false)} aria-hidden="true" />

            <nav ref={panel} id="post-toc" className={`b-toc-panel${open ? ' is-open' : ''}`} aria-label="Table of contents" inert={!open}>
                <div className="b-toc-head">
                    <span>Contents</span>
                    <button type="button" className="b-icon-btn" aria-label="Close contents" onClick={() => close()}>
                        <X size={18} strokeWidth={1.5} />
                    </button>
                </div>
                <ol>
                    {items.map((item) => (
                        <li key={item.id}>
                            <a href={`#${item.id}`} aria-current={item.id === active ? 'location' : undefined} onClick={onJump}>
                                {item.text}
                            </a>
                        </li>
                    ))}
                </ol>
                <a href="#post" className="b-toc-top" onClick={onJump}>
                    Back to top
                </a>
            </nav>
        </>
    );
}
