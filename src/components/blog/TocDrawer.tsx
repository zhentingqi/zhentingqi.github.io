'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { TableOfContents, X } from 'lucide-react';
import { scrollToSection } from '@/components/blog/TocLink';

interface TocItem {
    id: string;
    text: string;
    level: 2 | 3 | 4;
    number?: string;
}

/** From this width up the open panel sits in the free left margin and can stay open while reading. */
const PINNED_QUERY = '(min-width: 1440px)';

/**
 * A button fixed at the left edge that opens the table of contents as a side panel.
 * The section being read is marked. On narrow screens the panel overlays the page and
 * closes after a jump; on very wide screens it stays open beside the text while the reader
 * jumps between sections. A click anywhere outside the panel closes it at any width.
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

    // Escape closes the panel, and so does a click anywhere outside it. Opening it moves focus inside.
    useEffect(() => {
        if (!open) return;
        const onKey = (event: KeyboardEvent) => {
            if (event.key === 'Escape') close();
        };
        const onPointerDown = (event: PointerEvent) => {
            const target = event.target as Node | null;
            if (!target || panel.current?.contains(target) || button.current?.contains(target)) return;
            close(false);
        };
        window.addEventListener('keydown', onKey);
        document.addEventListener('pointerdown', onPointerDown);
        // Bring the section being read into view inside the panel, then put focus on it.
        const current =
            panel.current?.querySelector<HTMLElement>('a[aria-current]') ?? panel.current?.querySelector<HTMLElement>('a');
        current?.scrollIntoView({ block: 'center' });
        // The panel only becomes focusable once it is shown, which is a frame after this runs.
        const frame = requestAnimationFrame(() => current?.focus({ preventScroll: true }));
        return () => {
            cancelAnimationFrame(frame);
            window.removeEventListener('keydown', onKey);
            document.removeEventListener('pointerdown', onPointerDown);
        };
    }, [open, close]);

    // Jumping to a section scrolls there smoothly. On narrow screens the panel gets out of the way first.
    const onJump = (event: React.MouseEvent<HTMLAnchorElement>, id: string) => {
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        if (!window.matchMedia(PINNED_QUERY).matches) close(false);
        scrollToSection(event, id);
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
                        <li key={item.id} className={`lv-${item.level}`}>
                            <a href={`#${item.id}`} aria-current={item.id === active ? 'location' : undefined} onClick={(event) => onJump(event, item.id)}>
                                <span className="b-toc-num">{item.number}</span>
                                {item.text}
                            </a>
                        </li>
                    ))}
                </ol>
                <a href="#top" className="b-toc-top" onClick={(event) => onJump(event, 'top')}>
                    Back to top
                </a>
            </nav>
        </>
    );
}
