import type { ReactNode } from 'react';

/**
 * The shell used by interactive figures: a ruled panel with a numbered caption.
 * Kept free of server-only imports so client components can use it.
 */
export default function FigureShell({ caption, wide, children }: { caption?: ReactNode; wide?: boolean; children: ReactNode }) {
    return (
        <figure className={`fig fig-interactive${wide ? ' fig-wide' : ''}`}>
            <div className="fig-panel">{children}</div>
            {caption && <figcaption>{caption}</figcaption>}
        </figure>
    );
}

/** A labelled range input with its current value shown at the right. */
export function Slider({
    label,
    value,
    min,
    max,
    step = 1,
    onChange,
    format = String,
}: {
    label: string;
    value: number;
    min: number;
    max: number;
    step?: number;
    onChange: (value: number) => void;
    format?: (value: number) => string;
}) {
    return (
        <label className="ctl">
            <span className="ctl-label">{label}</span>
            <input type="range" min={min} max={max} step={step} value={value} onChange={(event) => onChange(Number(event.target.value))} />
            <output className="ctl-value">{format(value)}</output>
        </label>
    );
}
