'use client';

import { useRef, type CSSProperties } from 'react';
import { X } from 'lucide-react';

interface ZoomImageProps {
    src: string;
    alt: string;
    width?: number;
    height?: number;
    style?: CSSProperties;
}

/**
 * An image that opens enlarged in a dialog when clicked. The dialog fills the screen, shows the
 * image as large as fits, and closes on a click anywhere, on the close button, or with Escape.
 */
export default function ZoomImage({ src, alt, width, height, style }: ZoomImageProps) {
    const dialog = useRef<HTMLDialogElement>(null);

    const open = () => {
        dialog.current?.showModal();
        document.documentElement.classList.add('is-lightbox-open');
    };

    return (
        <>
            <button type="button" className="fig-zoom" onClick={open} aria-label={alt ? `Enlarge image: ${alt}` : 'Enlarge image'}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt={alt} width={width} height={height} loading="lazy" decoding="async" style={style} />
            </button>
            <dialog
                ref={dialog}
                className="fig-lightbox"
                aria-label={alt || 'Enlarged image'}
                onClick={() => dialog.current?.close()}
                onClose={() => document.documentElement.classList.remove('is-lightbox-open')}
            >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt={alt} loading="lazy" decoding="async" />
                <button type="button" className="fig-lightbox-close" aria-label="Close">
                    <X size={20} strokeWidth={1.75} />
                </button>
            </dialog>
        </>
    );
}
