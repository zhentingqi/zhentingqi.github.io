'use client';

import { useEffect, useRef } from 'react';

/** A 2px line at the top of the viewport that fills as the article (#post) is read. */
export default function ReadingProgress() {
    const bar = useRef<HTMLSpanElement>(null);

    useEffect(() => {
        let frame = 0;
        const update = () => {
            frame = 0;
            const article = document.getElementById('post');
            if (!article || !bar.current) return;
            const rect = article.getBoundingClientRect();
            const total = rect.height - window.innerHeight;
            const progress = total > 0 ? Math.min(1, Math.max(0, -rect.top / total)) : 0;
            bar.current.style.transform = `scaleX(${progress.toFixed(4)})`;
        };
        const onScroll = () => {
            if (!frame) frame = requestAnimationFrame(update);
        };
        update();
        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', onScroll);
        return () => {
            window.removeEventListener('scroll', onScroll);
            window.removeEventListener('resize', onScroll);
            if (frame) cancelAnimationFrame(frame);
        };
    }, []);

    return (
        <div className="b-progress" aria-hidden="true">
            <span ref={bar} />
        </div>
    );
}
