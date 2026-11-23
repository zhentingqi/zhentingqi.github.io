import type { ReactNode } from 'react';

/**
 * A labelled block set apart from the text. Every callout looks the same; the label says what
 * kind it is. `tone` is kept so posts can still mark a callout as a key point or an aside, but
 * it no longer changes the styling.
 */
export default function Callout({ label, tone = 'key', children }: { label?: string; tone?: 'key' | 'aside'; children: ReactNode }) {
    return (
        <aside className={`callout callout-${tone}`}>
            {label && <p className="callout-label">{label}</p>}
            {children}
        </aside>
    );
}
