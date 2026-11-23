// Types and pure helpers shared by server code and client components (no fs access here).

export type PostType = 'note' | 'paper' | 'essay' | 'project';

export const POST_TYPES: PostType[] = ['note', 'paper', 'essay', 'project'];

/** Label used as the kicker on a post. */
export const TYPE_LABEL: Record<PostType, string> = {
    note: 'Research note',
    paper: 'Paper walkthrough',
    essay: 'Essay',
    project: 'Project log',
};

/** Short label used in lists. */
export const TYPE_SHORT: Record<PostType, string> = {
    note: 'Note',
    paper: 'Paper',
    essay: 'Essay',
    project: 'Project',
};

/** Plural label used in the type filter. */
export const TYPE_PLURAL: Record<PostType, string> = {
    note: 'Research notes',
    paper: 'Papers',
    essay: 'Essays',
    project: 'Projects',
};

export interface PostAuthor {
    name: string;
    affiliation?: string;
}

export interface PostMeta {
    slug: string;
    title: string;
    description: string;
    /** ISO date, YYYY-MM-DD */
    date: string;
    type: PostType;
    tags: string[];
    cover?: string;
    thumb?: string;
    /** Listed under the title, with affiliations when given. */
    authors: PostAuthor[];
    readingMinutes: number;
    /** Opening paragraph as plain text, shown when the post leads the home page. */
    lede: string;
}

/* ---------- Tags ---------- */

export function tagSlug(tag: string): string {
    return tag
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
}

/* ---------- Dates ---------- */

const fullDate = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
const shortDate = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });

export function formatDate(iso: string, style: 'full' | 'short' = 'full'): string {
    const date = new Date(`${iso}T00:00:00Z`);
    if (Number.isNaN(date.getTime())) return iso;
    return (style === 'full' ? fullDate : shortDate).format(date);
}
