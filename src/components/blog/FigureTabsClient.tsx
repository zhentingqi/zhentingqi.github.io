'use client';

import { useId, useState } from 'react';

interface Item {
    label: string;
    src: string;
    alt?: string;
    width?: number;
    height?: number;
}

export default function FigureTabsClient({ items }: { items: Item[] }) {
    const [active, setActive] = useState(0);
    const id = useId();
    const item = items[active];

    return (
        <div className="fig-panel">
            <div className="fig-tabs" role="tablist">
                {items.map((entry, index) => (
                    <button
                        key={entry.src}
                        type="button"
                        role="tab"
                        id={`${id}-tab-${index}`}
                        aria-selected={index === active}
                        aria-controls={`${id}-panel`}
                        onClick={() => setActive(index)}
                    >
                        {entry.label}
                    </button>
                ))}
            </div>
            <div role="tabpanel" id={`${id}-panel`} aria-labelledby={`${id}-tab-${active}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.src} alt={item.alt ?? item.label} width={item.width} height={item.height} decoding="async" />
            </div>
        </div>
    );
}
