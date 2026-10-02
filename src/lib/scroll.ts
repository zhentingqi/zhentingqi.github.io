// Smoothly scroll to an in-page anchor ("#id", or "#top" for the page top).
// The URL hash is left untouched: changing it makes the Next.js router jump to the anchor instantly.
// Animated manually with requestAnimationFrame so it is smooth even where native smooth scrolling is disabled.

const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

let frame = 0;

export function smoothScrollTo(hash: string) {
    const target = hash === '#top' ? null : document.getElementById(hash.slice(1));
    const scrollMargin = target ? parseFloat(getComputedStyle(target).scrollMarginTop) || 0 : 0;
    const maxY = document.documentElement.scrollHeight - window.innerHeight;
    const endY = target ? Math.min(maxY, target.getBoundingClientRect().top + window.scrollY - scrollMargin) : 0;

    cancelAnimationFrame(frame);

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        window.scrollTo(0, endY);
        return;
    }

    const startY = window.scrollY;
    const distance = endY - startY;
    const duration = Math.min(900, 350 + Math.abs(distance) * 0.15);
    const start = performance.now();

    const step = (now: number) => {
        const t = Math.min(1, (now - start) / duration);
        window.scrollTo(0, startY + distance * easeInOutCubic(t));
        if (t < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
}
