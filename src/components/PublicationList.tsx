import { Publication } from '@/types/publication';
import PublicationItem from '@/components/PublicationItem';

// Publications grouped by year. `show="selected"` keeps only the papers marked selected in the .bib file.
export default function PublicationList({ publications, show = 'all' }: { publications: Publication[]; show?: 'all' | 'selected' }) {
    const list = show === 'selected' ? publications.filter((p) => p.selected) : publications;

    const groups = new Map<number, Publication[]>();
    for (const p of list) groups.set(p.year, [...(groups.get(p.year) ?? []), p]);
    const byYear = [...groups.entries()].sort((a, b) => b[0] - a[0]);

    return (
        <div>
            <p className="text-[0.8rem] text-muted">
                <sup className="text-crimson">*</sup> equal contribution
            </p>

            <div className="mt-6 space-y-10">
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
