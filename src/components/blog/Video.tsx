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
    /** With `loop`, show no controls at all: the clip just plays on a loop, like a moving picture. */
    ambient?: boolean;
    wide?: boolean;
    /** Footage keeps its own background instead of blending into the paper. */
    photo?: boolean;
    /** Set to false when the caption already carries its own "Figure N". */
    numbered?: boolean;
    /** Width divided by height. Reserves the video's space before it loads, so the page does not shift. */
    aspectRatio?: number;
}

export default function Video({ src, poster, caption, children, loop, controls, ambient, wide, photo, numbered = true, aspectRatio }: VideoProps) {
    const video = useRef<HTMLVideoElement>(null);
    const [playing, setPlaying] = useState(false);
    const [fullscreen, setFullscreen] = useState(false);

    // Track fullscreen, so the styles that blend the video into the page can be switched off there.
    useEffect(() => {
        const update = () => {
            const doc = document as Document & { webkitFullscreenElement?: Element | null };
            const current = document.fullscreenElement ?? doc.webkitFullscreenElement ?? null;
            setFullscreen(!!video.current && current === video.current);
        };
        document.addEventListener('fullscreenchange', update);
        document.addEventListener('webkitfullscreenchange', update);
        return () => {
            document.removeEventListener('fullscreenchange', update);
            document.removeEventListener('webkitfullscreenchange', update);
        };
    }, []);

    // Looping clips start on their own only when in view, and never under reduced motion.
    useEffect(() => {
        const element = video.current;
        if (!loop || !element) return;

        // Browsers only allow playback without a click when the video is muted, and some read
        // that from the element itself, so it is set here as well as in the markup.
        element.muted = true;
        element.defaultMuted = true;
        element.loop = true;
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) element.play().catch(() => {});
                else element.pause();
            },
            { threshold: 0.1 },
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

    const nativeControls = !loop || (!!controls && !ambient);
    const text = caption ?? children;
    const className = ['fig', 'fig-video', wide && 'fig-wide', photo && 'fig-photo', !numbered && 'fig-unnumbered'].filter(Boolean).join(' ');

    return (
        <figure className={className}>
            <div className="fig-video-frame">
                <video
                    ref={video}
                    className={fullscreen ? 'is-fullscreen' : undefined}
                    style={aspectRatio ? { aspectRatio } : undefined}
                    src={src}
                    poster={poster}
                    playsInline
                    preload={poster ? 'none' : 'metadata'}
                    controls={nativeControls}
                    disablePictureInPicture={ambient}
                    loop={loop}
                    muted={loop}
                    onPlay={() => setPlaying(true)}
                    onPause={() => setPlaying(false)}
                    onEnded={(event) => {
                        // Belt and braces for browsers that stop at the end despite `loop`.
                        if (!loop) return;
                        event.currentTarget.currentTime = 0;
                        event.currentTarget.play().catch(() => {});
                    }}
                />
                {loop && !controls && !ambient && (
                    <button type="button" className="fig-video-btn" onClick={toggle} aria-label={playing ? 'Pause' : 'Play'}>
                        {playing ? <Pause size={14} strokeWidth={1.75} /> : <Play size={14} strokeWidth={1.75} />}
                    </button>
                )}
            </div>
            {text && <figcaption>{text}</figcaption>}
        </figure>
    );
}
