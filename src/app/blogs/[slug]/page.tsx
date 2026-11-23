import { createElement, type ComponentProps, type ReactNode } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Byline from '@/components/blog/Byline';
import Callout from '@/components/blog/Callout';
import ReadingProgress from '@/components/blog/ReadingProgress';
import TocDrawer from '@/components/blog/TocDrawer';
import TocLink from '@/components/blog/TocLink';
import { Anchor, Pre, Table } from '@/components/blog/CodeBlock';
import { Figure, FigureTabs, MarkdownImage, imageSize } from '@/components/blog/Figure';
import { CiteNote, References, Sidenote } from '@/components/blog/Sidenote';
import Video from '@/components/blog/Video';
import {
    TYPE_LABEL,
    formatDate,
    getAllPosts,
    getBlogConfig,
    getPost,
    getReferences,
    getShareImage,
    getTwitterHandle,
    tagSlug,
    type Reference,
} from '@/lib/blog';
import { renderMdx, type MdxComponents } from '@/lib/mdx';

export const dynamicParams = false;

export function generateStaticParams() {
    return getAllPosts().map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    const { slug } = await params;
    const post = getPost(slug);
    if (!post) return {};

    // What a pasted link shows: title, standfirst and a 1200x630 picture.
    const share = getShareImage(post);
    const images = share ? [{ ...share, alt: post.title }] : undefined;
    return {
        title: post.title,
        description: post.description,
        authors: post.authors.map((author) => ({ name: author.name })),
        openGraph: {
            type: 'article',
            url: `/blogs/${post.slug}/`,
            siteName: getBlogConfig().author,
            title: post.title,
            description: post.description,
            publishedTime: post.date,
            authors: post.authors.map((author) => author.name),
            tags: post.tags,
            images,
        },
        twitter: {
            card: 'summary_large_image',
            title: post.title,
            description: post.description,
            creator: getTwitterHandle(),
            images,
        },
    };
}

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const post = getPost(slug);
    if (!post) notFound();

    const allReferences = getReferences();
    const components = {
        a: Anchor,
        pre: Pre,
        table: Table,
        img: MarkdownImage,
        Figure,
        FigureTabs,
        // The poster's shape is read at build time and reserved for the video before it loads.
        Video: (props: ComponentProps<typeof Video>) => {
            const { width, height } = props.poster ? imageSize(props.poster) : {};
            return <Video {...props} aspectRatio={width && height ? width / height : undefined} />;
        },
        Sidenote,
        Callout,
        Cite: ({ k }: { k: string }) => <CiteNote k={k} reference={allReferences.get(k)} />,
        // Interactive figures: add the component under components/blog/interactive (wrap it in
        // FigureShell for the ruled panel and caption), import it above, and register it here.
    } as unknown as MdxComponents;

    // Section numbers (1, 1.1, 1.1.1) are worked out from the headings and shown in front of them.
    const numbers = new Map(post.toc.map((item) => [item.id, item.number]));
    const heading = (level: 2 | 3 | 4) =>
        function Heading({ id, children }: { id?: string; children?: ReactNode }) {
            const number = id ? numbers.get(id) : undefined;
            return createElement(`h${level}`, { id }, number && <span className="h-num">{number}</span>, children);
        };
    Object.assign(components, { h2: heading(2), h3: heading(3), h4: heading(4) });
    const sections = post.toc.filter((item) => item.level === 2);

    const body = await renderMdx(post.content, components);
    const cited = post.citeKeys.map((key) => allReferences.get(key)).filter((ref): ref is Reference => !!ref);

    // Posts are sorted newest first, so the previous (older) post is the next index.
    const posts = getAllPosts();
    const index = posts.findIndex((p) => p.slug === post.slug);
    const older = posts[index + 1];
    const newer = posts[index - 1];

    // The margin column exists for notes and citations. A post with none of them has nothing to
    // put there, so its text is centered on the page instead of sitting to the left of an empty column.
    const hasMarginNotes = /<(Sidenote|Cite)\b/.test(post.content);

    return (
        <div className={hasMarginNotes ? undefined : 'b-centered'}>
            <ReadingProgress />
            {sections.length > 1 && <TocDrawer items={post.toc} />}
            <article id="post" className="b-post">
                <header className="b-post-head">
                    <p className="b-kicker">{TYPE_LABEL[post.type]}</p>
                    <h1 className="b-post-title">{post.title}</h1>
                    {post.description && <p className="b-standfirst">{post.description}</p>}
                    <Byline authors={post.authors} />
                    <p className="b-meta">
                        <time dateTime={post.date}>{formatDate(post.date)}</time> · {post.readingMinutes} min read
                    </p>
                </header>

                {sections.length > 1 && (
                    <nav className="b-contents" aria-label="Contents">
                        <ol>
                            {sections.map((item) => (
                                <li key={item.id}>
                                    <span className="b-contents-num">{item.number}</span>
                                    <TocLink id={item.id}>{item.text}</TocLink>
                                </li>
                            ))}
                        </ol>
                    </nav>
                )}

                <div className="b-prose">{body}</div>

                <References references={cited} />

                {post.tags.length > 0 && (
                    <p className="b-meta b-post-tags">
                        {post.tags.map((tag) => (
                            <Link key={tag} href={`/blogs/tags/${tagSlug(tag)}/`}>
                                #{tag}
                            </Link>
                        ))}
                    </p>
                )}
            </article>

            {(older || newer) && (
                <nav className="b-pager" aria-label="More posts">
                    {older && (
                        <Link href={`/blogs/${older.slug}/`}>
                            <span className="b-meta">Previous</span>
                            <strong>{older.title}</strong>
                        </Link>
                    )}
                    {newer && (
                        <Link href={`/blogs/${newer.slug}/`} className="is-next">
                            <span className="b-meta">Next</span>
                            <strong>{newer.title}</strong>
                        </Link>
                    )}
                </nav>
            )}
        </div>
    );
}
