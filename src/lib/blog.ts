import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import GithubSlugger from 'github-slugger';
import { getConfig } from '@/lib/config';
import { findPerson } from '@/lib/people';
import { POST_TYPES, tagSlug, type PostAuthor, type PostMeta, type PostType } from '@/lib/blog-shared';

export * from '@/lib/blog-shared';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const bibtexParse = require('bibtex-parse-js');

const BLOG_DIR = path.join(process.cwd(), 'content', 'blog');

export interface TocItem {
    id: string;
    text: string;
    /** 2 for a section (##), 3 and 4 for the levels under it. */
    level: 2 | 3 | 4;
    /** "1", "1.1", "1.1.1". Missing for back matter such as References. */
    number?: string;
}

export interface Post extends PostMeta {
    content: string;
    toc: TocItem[];
    /** Citation keys in order of first use. */
    citeKeys: string[];
}

export interface BlogConfig {
    title: string;
    description: string;
    url: string;
    author: string;
}

export function getBlogConfig(): BlogConfig {
    const config = getConfig() as ReturnType<typeof getConfig> & { blog?: Partial<BlogConfig> };
    return {
        title: config.blog?.title ?? 'Notebook',
        description: config.blog?.description ?? '',
        url: (config.blog?.url ?? 'https://zhentingqi.github.io').replace(/\/$/, ''),
        author: config.author.name,
    };
}

/* ---------- Link previews ---------- */

export interface ShareImage {
    url: string;
    width?: number;
    height?: number;
}

/**
 * The picture shown when a post's URL is pasted into X, Slack, iMessage and the like.
 * `public/blogs/<slug>/card.jpg` (drawn by scripts/make_social_card.py, with the title on it)
 * is used when it exists; otherwise the post's cover.
 */
export function getShareImage(post: Pick<PostMeta, 'slug' | 'cover'>): ShareImage | undefined {
    const card = `/blogs/${post.slug}/card.jpg`;
    if (fs.existsSync(path.join(process.cwd(), 'public', card))) return { url: card, width: 1200, height: 630 };
    return post.cover ? { url: post.cover } : undefined;
}

/** The site owner's X handle, read from the profile link in config.toml. */
export function getTwitterHandle(): string | undefined {
    const link = getConfig().social.twitter;
    const handle = typeof link === 'string' ? link.match(/(?:x|twitter)\.com\/@?([A-Za-z0-9_]+)/)?.[1] : undefined;
    return handle ? `@${handle}` : undefined;
}

/* ---------- Posts ---------- */

function toIsoDate(value: unknown): string {
    if (value instanceof Date) return value.toISOString().slice(0, 10);
    return String(value ?? '').slice(0, 10);
}

function stripInline(text: string): string {
    return text
        .replace(/<Cite[^>]*\/>/g, '')
        .replace(/<Sidenote>[\s\S]*?<\/Sidenote>/g, '')
        .replace(/<[^>]+>/g, '')
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
        .replace(/\$([^$]+)\$/g, '$1')
        .replace(/[*_`]/g, '')
        .replace(/\s+/g, ' ')
        .replace(/\s+([.,;:])/g, '$1')
        .trim();
}

/** Blocks of prose, with code fences, display math and JSX blocks removed. */
function proseBlocks(content: string): string[] {
    const withoutFences = content.replace(/```[\s\S]*?```/g, '').replace(/\$\$[\s\S]*?\$\$/g, '');
    return withoutFences
        .split(/\n\s*\n/)
        .map((block) => block.trim())
        .filter((block) => block && !/^(#|<|\||import |export |!\[|>|-{3,})/.test(block));
}

// Back matter keeps its place in the contents but is not numbered.
const BACK_MATTER = /^(acknowledge?ments?|citation|references|bibliography|appendix\b.*)$/i;

/**
 * The headings of a post (## to ####) with their ids and section numbers: 1, 1.1, 1.1.1.
 * Ids are produced the same way rehype-slug does, so they match the rendered headings.
 */
function extractToc(content: string): TocItem[] {
    const slugger = new GithubSlugger();
    const toc: TocItem[] = [];
    const counters = [0, 0, 0];
    let inFence = false;
    let backMatter = false;
    for (const line of content.split('\n')) {
        if (line.startsWith('```')) inFence = !inFence;
        if (inFence) continue;
        const match = /^(#{1,6})\s+(.+?)\s*$/.exec(line);
        if (!match) continue;
        const level = match[1].length;
        const text = stripInline(match[2]);
        const id = slugger.slug(text);
        if (level < 2 || level > 4) continue;

        if (level === 2) backMatter = BACK_MATTER.test(text);
        if (!backMatter) {
            counters[level - 2] += 1;
            for (let deeper = level - 1; deeper < counters.length; deeper++) counters[deeper] = 0;
        }
        toc.push({
            id,
            text,
            level: level as TocItem['level'],
            number: backMatter ? undefined : counters.slice(0, level - 1).join('.'),
        });
    }
    return toc;
}

function extractCiteKeys(content: string): string[] {
    const keys: string[] = [];
    for (const match of content.matchAll(/<Cite\s+k="([^"]+)"/g)) {
        if (!keys.includes(match[1])) keys.push(match[1]);
    }
    return keys;
}

/**
 * Authors are listed by name and filled in from the profile library (`content/people.toml`).
 * An entry may also be `{ name, affiliation, avatar, url }`: for someone who is not in the library,
 * or to print a different affiliation on one post.
 */
function parseAuthors(value: unknown): PostAuthor[] {
    if (!Array.isArray(value)) return [];
    return value
        .map((entry): PostAuthor => {
            const given: Record<string, unknown> = entry && typeof entry === 'object' ? (entry as Record<string, unknown>) : { name: entry };
            const name = String(given.name ?? '').trim();
            const person = findPerson(name);
            return {
                name: person?.name ?? name,
                affiliation: given.affiliation ? String(given.affiliation) : person?.affiliation,
                avatar: given.avatar ? String(given.avatar) : person?.avatar,
                url: given.url ? String(given.url) : person?.url,
            };
        })
        .filter((author) => author.name);
}

function readPost(file: string): Post {
    const slug = file.replace(/\.mdx?$/, '');
    const raw = fs.readFileSync(path.join(BLOG_DIR, file), 'utf-8');
    const { data, content } = matter(raw);

    const type = POST_TYPES.includes(data.type) ? (data.type as PostType) : 'note';
    const blocks = proseBlocks(content);
    // A reference list written out in the body is not counted as reading.
    const words = proseBlocks(content.split(/^## References\s*$/m)[0]).join(' ').split(/\s+/).length;

    return {
        slug,
        title: String(data.title ?? slug),
        description: String(data.description ?? ''),
        date: toIsoDate(data.date),
        type,
        tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
        cover: data.cover ? String(data.cover) : undefined,
        thumb: data.thumb ? String(data.thumb) : undefined,
        authors: parseAuthors(data.authors),
        readingMinutes: Math.max(1, Math.round(words / 230)),
        lede: stripInline(blocks[0] ?? ''),
        content,
        toc: extractToc(content),
        citeKeys: extractCiteKeys(content),
    };
}

let cache: Post[] | null = null;

export function getAllPosts(): Post[] {
    if (cache && process.env.NODE_ENV === 'production') return cache;
    const files = fs.existsSync(BLOG_DIR) ? fs.readdirSync(BLOG_DIR).filter((f) => /\.mdx?$/.test(f)) : [];
    cache = files
        .map(readPost)
        .filter((post) => post.date)
        .sort((a, b) => b.date.localeCompare(a.date) || a.title.localeCompare(b.title));
    return cache;
}

export function getPost(slug: string): Post | undefined {
    return getAllPosts().find((post) => post.slug === slug);
}

/** Strip the heavy fields so a post can be passed to client components and lists. */
export function toMeta(post: Post): PostMeta {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { content, toc, citeKeys, ...meta } = post;
    return meta;
}

/* ---------- Tags ---------- */

export function getAllTags(): { tag: string; slug: string; count: number }[] {
    const counts = new Map<string, { tag: string; count: number }>();
    for (const post of getAllPosts()) {
        for (const tag of post.tags) {
            const slug = tagSlug(tag);
            const entry = counts.get(slug) ?? { tag, count: 0 };
            entry.count += 1;
            counts.set(slug, entry);
        }
    }
    return [...counts.entries()]
        .map(([slug, { tag, count }]) => ({ tag, slug, count }))
        .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
}

/* ---------- References ---------- */

export interface Reference {
    key: string;
    authors: string[];
    /** "Qi et al." */
    shortAuthors: string;
    title: string;
    venue: string;
    year: string;
    url?: string;
}

function cleanBib(value: unknown): string {
    return String(value ?? '')
        .replace(/[{}]/g, '')
        .replace(/\\&/g, '&')
        .replace(/--/g, '–')
        .replace(/\s+/g, ' ')
        .trim();
}

function lastName(author: string): string {
    if (author.includes(',')) return author.split(',')[0].trim();
    const parts = author.trim().split(/\s+/);
    return parts[parts.length - 1];
}

let refCache: Map<string, Reference> | null = null;

export function getReferences(): Map<string, Reference> {
    if (refCache && process.env.NODE_ENV === 'production') return refCache;
    const file = path.join(BLOG_DIR, 'references.bib');
    const map = new Map<string, Reference>();
    if (fs.existsSync(file)) {
        const entries = bibtexParse.toJSON(fs.readFileSync(file, 'utf-8')) as {
            citationKey: string;
            entryTags: Record<string, string>;
        }[];
        for (const entry of entries) {
            const tags = Object.fromEntries(Object.entries(entry.entryTags).map(([k, v]) => [k.toLowerCase(), v]));
            const authors = cleanBib(tags.author)
                .split(/\s+and\s+/)
                .map((a) => a.replace(/\*/g, '').trim())
                .filter(Boolean);
            const last = authors.map(lastName);
            const shortAuthors =
                last.length === 0 ? '' : last.length === 1 ? last[0] : last.length === 2 ? `${last[0]} and ${last[1]}` : `${last[0]} et al.`;
            map.set(entry.citationKey, {
                key: entry.citationKey,
                authors,
                shortAuthors,
                title: cleanBib(tags.title),
                venue: cleanBib(tags.journal ?? tags.booktitle ?? tags.publisher ?? tags.howpublished),
                year: cleanBib(tags.year),
                url: tags.url ? cleanBib(tags.url) : undefined,
            });
        }
    }
    refCache = map;
    return map;
}
