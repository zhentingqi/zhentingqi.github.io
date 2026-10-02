'use client';

import { useState } from 'react';
import { Check } from 'lucide-react';
import { Publication } from '@/types/publication';
import { cn, shortVenue } from '@/lib/utils';

const MAX_AUTHORS = 15;
const HEAD_AUTHORS = 8;

function AuthorName({ author }: { author: Publication['authors'][number] }) {
    return (
        <>
            <span className={cn(author.isHighlighted && 'font-semibold text-ink')}>{author.name}</span>
            {author.isCorresponding && <sup className="text-crimson">*</sup>}
        </>
    );
}

// Long author lists show the first few names, plus the site owner if they come later.
function Authors({ pub }: { pub: Publication }) {
    const [expanded, setExpanded] = useState(false);
    const truncated = !expanded && pub.authors.length > MAX_AUTHORS;
    const selfIndex = pub.authors.findIndex((a) => a.isHighlighted);
    const head = truncated ? pub.authors.slice(0, HEAD_AUTHORS) : pub.authors;
    const self = truncated && selfIndex >= HEAD_AUTHORS ? pub.authors[selfIndex] : null;
    const hidden = pub.authors.length - head.length - (self ? 1 : 0);

    return (
        <p className="mt-1.5 text-[0.88rem] leading-relaxed text-muted">
            {head.map((a, i) => (
                <span key={i}>
                    <AuthorName author={a} />
                    {i < head.length - 1 && ', '}
                </span>
            ))}
            {self && (
                <>
                    {', …, '}
                    <AuthorName author={self} />
                </>
            )}
            {truncated && (
                <>
                    {', '}
                    <button
                        type="button"
                        onClick={() => setExpanded(true)}
                        className="text-muted underline decoration-dotted underline-offset-2 hover:text-crimson"
                    >
                        +{hidden} more
                    </button>
                </>
            )}
        </p>
    );
}

function Pill({ children, href, onClick, active }: { children: React.ReactNode; href?: string; onClick?: () => void; active?: boolean }) {
    const className = cn(
        'inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[0.75rem] font-medium transition-colors',
        active
            ? 'border-crimson bg-crimson-wash text-crimson'
            : 'border-line text-muted hover:border-crimson hover:text-crimson'
    );
    return href ? (
        <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
            {children}
        </a>
    ) : (
        <button type="button" onClick={onClick} className={className}>
            {children}
        </button>
    );
}

export default function PublicationItem({ pub }: { pub: Publication }) {
    const [panel, setPanel] = useState<'abstract' | 'bibtex' | null>(null);
    const [copied, setCopied] = useState(false);
    const toggle = (p: 'abstract' | 'bibtex') => setPanel(panel === p ? null : p);
    const isOral = /oral/i.test(pub.note || '');
    const abstract = pub.abstract || pub.description;

    const copyBibtex = async () => {
        if (!pub.bibtex) return;
        await navigator.clipboard.writeText(pub.bibtex);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    };

    return (
        <article>
            <div className="flex flex-wrap items-center gap-1.5">
                <span className="rounded-md bg-crimson px-2 py-0.5 text-[0.72rem] font-semibold tracking-wide text-white dark:text-paper">
                    {shortVenue(pub)}
                </span>
                {pub.note && (
                    <span
                        className={cn(
                            'rounded-md px-2 py-0.5 text-[0.72rem] font-medium',
                            isOral ? 'bg-crimson-wash text-crimson' : 'bg-line-soft text-muted'
                        )}
                    >
                        {pub.note}
                    </span>
                )}
            </div>

            <h3 className="mt-2 font-serif text-[1.15rem] font-semibold leading-snug text-ink">
                {pub.url ? (
                    <a href={pub.url} target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-crimson">
                        {pub.title}
                    </a>
                ) : (
                    pub.title
                )}
            </h3>

            <Authors pub={pub} />

            <div className="mt-3 flex flex-wrap gap-1.5">
                {abstract && (
                    <Pill onClick={() => toggle('abstract')} active={panel === 'abstract'}>
                        Abstract
                    </Pill>
                )}
                {pub.url && <Pill href={pub.url}>{pub.arxivId ? 'arXiv' : 'Paper'}</Pill>}
                {pub.pdfUrl && <Pill href={pub.pdfUrl}>PDF</Pill>}
                {pub.code && <Pill href={pub.code}>Code</Pill>}
                {pub.bibtex && (
                    <Pill onClick={() => toggle('bibtex')} active={panel === 'bibtex'}>
                        BibTeX
                    </Pill>
                )}
            </div>

            {panel === 'abstract' && abstract && (
                <p className="mt-3 rounded-lg border-l-2 border-crimson bg-surface px-4 py-3 text-[0.9rem] leading-relaxed text-ink-soft">
                    {abstract}
                </p>
            )}
            {panel === 'bibtex' && pub.bibtex && (
                <div className="relative mt-3">
                    <pre className="overflow-x-auto rounded-lg border border-line bg-surface px-4 py-3 text-[0.75rem] leading-relaxed text-ink-soft">
                        {pub.bibtex}
                    </pre>
                    <button
                        type="button"
                        onClick={copyBibtex}
                        className="absolute right-2 top-2 rounded-md border border-line bg-paper px-2 py-0.5 text-[0.72rem] text-muted hover:text-crimson"
                    >
                        {copied ? <Check className="inline h-3.5 w-3.5" /> : 'Copy'}
                    </button>
                </div>
            )}
        </article>
    );
}
