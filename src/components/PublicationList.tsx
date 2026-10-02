'use client';

import { useMemo, useState } from 'react';
import { Publication } from '@/types/publication';
import { cn } from '@/lib/utils';
import PublicationItem from '@/components/PublicationItem';

export default function PublicationList({ publications }: { publications: Publication[] }) {
    const [filter, setFilter] = useState<'all' | 'selected'>('selected');

    const byYear = useMemo(() => {
        const list = filter === 'selected' ? publications.filter((p) => p.selected) : publications;
        const groups = new Map<number, Publication[]>();
        for (const p of list) groups.set(p.year, [...(groups.get(p.year) ?? []), p]);
        return [...groups.entries()].sort((a, b) => b[0] - a[0]);
    }, [publications, filter]);

    const counts = { all: publications.length, selected: publications.filter((p) => p.selected).length };

    return (
        <div>
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="inline-flex rounded-lg border border-line bg-surface p-0.5" role="tablist">
                    {(['selected', 'all'] as const).map((key) => (
                        <button
                            key={key}
                            type="button"
                            role="tab"
                            aria-selected={filter === key}
                            onClick={() => setFilter(key)}
                            className={cn(
                                'rounded-md px-3 py-1 text-[0.85rem] transition-colors',
                                filter === key ? 'bg-crimson text-white dark:text-paper' : 'text-muted hover:text-ink'
                            )}
                        >
                            {key === 'all' ? 'All' : 'Selected'}
                            <span className="ml-1.5 opacity-70">{counts[key]}</span>
                        </button>
                    ))}
                </div>
                <p className="text-[0.8rem] text-muted">
                    <sup className="text-crimson">*</sup> equal contribution
                </p>
            </div>

            <div className="mt-8 space-y-10">
                {byYear.map(([year, pubs]) => (
                    <section key={year}>
                        <h3 className="mb-4 font-serif text-[1.25rem] font-semibold text-crimson">{year}</h3>
                        <ul className="divide-y divide-line">
                            {pubs.map((pub) => (
                                <li key={pub.id} className="py-5 first:pt-0">
                                    <PublicationItem pub={pub} />
                                </li>
                            ))}
                        </ul>
                    </section>
                ))}
            </div>
        </div>
    );
}
