import Link from 'next/link';
import type { ReactNode } from 'react';
import type { PostAuthor } from '@/lib/blog-shared';

function initials(name: string): string {
    const parts = name.trim().split(/\s+/);
    const last = parts.length > 1 ? parts[parts.length - 1] : '';
    return ((parts[0]?.[0] ?? '') + (last[0] ?? '')).toUpperCase();
}

/** The photo and the name are one link to the author's homepage; a path on this site stays in the tab. */
function AuthorLink({ url, children }: { url?: string; children: ReactNode }) {
    if (!url) return <span className="b-author">{children}</span>;
    if (url.startsWith('/')) {
        return (
            <Link className="b-author" href={url}>
                {children}
            </Link>
        );
    }
    return (
        <a className="b-author" href={url} target="_blank" rel="noopener noreferrer">
            {children}
        </a>
    );
}

/**
 * The authors of a post under its title: a small round photo and the name for each, then the
 * affiliations, which the names point at by number. Someone without a photo gets their initials.
 */
export default function Byline({ authors }: { authors: PostAuthor[] }) {
    if (authors.length === 0) return null;

    // Affiliations in order of first appearance.
    const affiliations = [...new Set(authors.map((author) => author.affiliation).filter((a): a is string => !!a))];

    return (
        <div className="b-authors">
            <ul>
                {authors.map((author) => (
                    <li key={author.name}>
                        <AuthorLink url={author.url}>
                            {author.avatar ? (
                                // The name is right beside the photo, so the photo itself is decorative.
                                // eslint-disable-next-line @next/next/no-img-element
                                <img className="b-avatar" src={author.avatar} alt="" width={52} height={52} decoding="async" />
                            ) : (
                                <span className="b-avatar" aria-hidden="true">
                                    {initials(author.name)}
                                </span>
                            )}
                            <span>
                                <span className="b-author-name">{author.name}</span>
                                {author.affiliation && affiliations.length > 1 && <sup>{affiliations.indexOf(author.affiliation) + 1}</sup>}
                            </span>
                        </AuthorLink>
                    </li>
                ))}
            </ul>
            {affiliations.length > 0 && (
                <p className="b-affiliations">
                    {affiliations.map((name, i) => (
                        <span key={name}>
                            {affiliations.length > 1 && <sup>{i + 1}</sup>}
                            {name}
                        </span>
                    ))}
                </p>
            )}
        </div>
    );
}
