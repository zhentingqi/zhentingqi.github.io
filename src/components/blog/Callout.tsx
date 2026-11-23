import type { ReactNode } from 'react';

/**
 * A labelled aside set off by a rule at the left. `tone="key"` (a definition or takeaway)
 * uses the crimson rule; `tone="aside"` (a comment) uses a hairline and is a little quieter.
 */
export default function Callout({ label, tone = 'key', children }: { label?: string; tone?: 'key' | 'aside'; children: ReactNode }) {
    return (
        <aside className={`callout callout-${tone}`}>
            {label && <p className="callout-label">{label}</p>}
            {children}
        </aside>
    );
}
