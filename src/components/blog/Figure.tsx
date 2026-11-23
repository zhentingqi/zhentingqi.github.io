import path from 'path';
import type { ReactNode } from 'react';
import sizeOf from 'image-size';
import FigureTabsClient from '@/components/blog/FigureTabsClient';
import ZoomImage from '@/components/blog/ZoomImage';

/** Intrinsic size of an image under /public, read at build time so pages never shift. */
export function imageSize(src: string): { width?: number; height?: number } {
    if (!src.startsWith('/')) return {};
    try {
        const { width, height } = sizeOf(path.join(process.cwd(), 'public', src));
        return { width, height };
    } catch {
        return {};
    }
}

interface FigureProps {
    src: string;
    alt?: string;
    caption?: ReactNode;
    /** Span the text and margin columns. */
    wide?: boolean;
    /** Cap the rendered width in px, for small plots that should not fill the column. */
    maxWidth?: number;
    /** Photographs keep their own background instead of blending into the paper. */
    photo?: boolean;
    /** Set to false when the caption already carries its own "Figure N". */
    numbered?: boolean;
    children?: ReactNode;
}

/** An image with a numbered caption, enlarged on click. The caption may be the `caption` prop or the children. */
export function Figure({ src, alt = '', caption, wide, maxWidth, photo, numbered = true, children }: FigureProps) {
    const { width, height } = imageSize(src);
    const text = caption ?? children;
    return (
        <figure className={`fig${wide ? ' fig-wide' : ''}${photo ? ' fig-photo' : ''}${numbered ? '' : ' fig-unnumbered'}`}>
            <ZoomImage src={src} alt={alt} width={width} height={height} style={maxWidth ? { maxWidth, marginInline: 'auto' } : undefined} />
            {text && <figcaption>{text}</figcaption>}
        </figure>
    );
}

/** Markdown images (`![alt](src "caption")`) render as figures too. */
export function MarkdownImage({ src, alt, title }: { src?: string; alt?: string; title?: string }) {
    if (!src) return null;
    return <Figure src={src} alt={alt} caption={title} />;
}

interface TabItem {
    label: string;
    src: string;
    alt?: string;
}

/** Several images in one numbered figure, switched by tabs. */
export function FigureTabs({ items, caption, wide }: { items: TabItem[]; caption?: ReactNode; wide?: boolean }) {
    const sized = items.map((item) => ({ ...item, ...imageSize(item.src) }));
    return (
        <figure className={`fig fig-interactive${wide ? ' fig-wide' : ''}`}>
            <FigureTabsClient items={sized} />
            {caption && <figcaption>{caption}</figcaption>}
        </figure>
    );
}
