'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Pause, Play } from 'lucide-react';

interface VideoProps {
    src: string;
    poster?: string;
    /** The caption may be the `caption` prop or the children (for captions with links or math). */
    caption?: ReactNode;
    children?: ReactNode;
    /** Play muted on a loop like a GIF, starting when scrolled into view. */
    loop?: boolean;
    /** With `loop`, also show the browser's controls so the reader can scrub. */
    controls?: boolean;
    wide?: boolean;
    /** Footage keeps its own background instead of blending into the paper. */
    photo?: boolean;
    /** Set to false when the caption already carries its own "Figure N". */
    numbered?: boolean;
}

export default function Video({ src, poster, caption, children, loop, controls, wide, photo, numbered = true }: VideoProps) {
    const video = useRef<HTMLVideoElement>(null);
    const [playing, setPlaying] = useState(false);

    // Looping clips start on their own only when in view, and never under reduced motion.
    useEffect(() => {
        const element = video.current;
        if (!loop || !element) return;
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) element.play().catch(() => {});
                else element.pause();
            },
            { threshold: 0.25 },
        );
        observer.observe(element);
        return () => observer.disconnect();
    }, [loop]);

    const toggle = () => {
        const element = video.current;
        if (!element) return;
        if (element.paused) element.play().catch(() => {});
        else element.pause();
    };

    const nativeControls = !loop || !!controls;
    const text = caption ?? children;
    const className = ['fig', 'fig-video', wide && 'fig-wide', photo && 'fig-photo', !numbered && 'fig-unnumbered'].filter(Boolean).join(' ');

    return (
        <figure className={className}>
            <div className="fig-video-frame">
                <video
                    ref={video}
                    src={src}
                    poster={poster}
                    playsInline
                    preload={poster ? 'none' : 'metadata'}
                    controls={nativeControls}
                    loop={loop}
                    muted={loop}
                    onPlay={() => setPlaying(true)}
                    onPause={() => setPlaying(false)}
                />
                {loop && !controls && (
                    <button type="button" className="fig-video-btn" onClick={toggle} aria-label={playing ? 'Pause' : 'Play'}>
                        {playing ? <Pause size={14} strokeWidth={1.75} /> : <Play size={14} strokeWidth={1.75} />}
                    </button>
                )}
            </div>
            {text && <figcaption>{text}</figcaption>}
        </figure>
    );
}
