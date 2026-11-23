import { useId, type ReactNode } from 'react';
import type { Reference } from '@/lib/blog';

/**
 * A numbered note. From 1020px up it sits in the margin beside its sentence; below that it
 * opens under the paragraph when its number is tapped. Numbering is done with CSS counters.
 * Write it inline, right after the word it belongs to: `...a claim.<Sidenote>Detail.</Sidenote>`
 */
export function Sidenote({ children }: { children: ReactNode }) {
    const id = useId();
    return (
        <span className="sn">
            <label htmlFor={id} className="sn-ref" aria-label="Note" />
            <input type="checkbox" id={id} className="sn-toggle" aria-label="Show note" />
            <span className="sn-body">{children}</span>
        </span>
    );
}

/** A citation rendered as a margin note. `reference` comes from content/blog/references.bib, if that file exists. */
export function CiteNote({ k, reference }: { k: string; reference?: Reference }) {
    if (!reference) {
        return (
            <Sidenote>
                <strong>Missing reference: {k}</strong>
            </Sidenote>
        );
    }
    const { shortAuthors, year, title, venue, url } = reference;
    return (
        <Sidenote>
            {shortAuthors} ({year}).{' '}
            {url ? (
                <a href={url} target="_blank" rel="noopener noreferrer">
                    {title}
                </a>
            ) : (
                title
            )}
            .{venue && <> {venue}.</>}
        </Sidenote>
    );
}

function joinAuthors(authors: string[]): string {
    if (authors.length <= 1) return authors.join('');
    if (authors.length > 8) return `${authors.slice(0, 6).join(', ')}, et al.`;
    return `${authors.slice(0, -1).join(', ')}, and ${authors[authors.length - 1]}`;
}

/** The full reference list at the end of a post, in order of first citation. */
export function References({ references }: { references: Reference[] }) {
    if (references.length === 0) return null;
    return (
        <section className="b-refs" aria-labelledby="references">
            <h2 id="references">References</h2>
            <ol>
                {references.map((ref) => (
                    <li key={ref.key}>
                        {joinAuthors(ref.authors)} ({ref.year}).{' '}
                        {ref.url ? (
                            <a href={ref.url} target="_blank" rel="noopener noreferrer">
                                {ref.title}
                            </a>
                        ) : (
                            ref.title
                        )}
                        .{ref.venue && <em> {ref.venue}.</em>}
                    </li>
                ))}
            </ol>
        </section>
    );
}
