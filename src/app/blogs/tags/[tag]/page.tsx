import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import PostList from '@/components/blog/PostList';
import { getAllPosts, getAllTags, tagSlug, toMeta } from '@/lib/blog';

export const dynamicParams = false;

export function generateStaticParams() {
    return getAllTags().map(({ slug }) => ({ tag: slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ tag: string }> }): Promise<Metadata> {
    const { tag } = await params;
    const entry = getAllTags().find(({ slug }) => slug === tag);
    return { title: entry ? `Blogs tagged ${entry.tag}` : 'Tags' };
}

export default async function TagPage({ params }: { params: Promise<{ tag: string }> }) {
    const { tag } = await params;
    const entry = getAllTags().find(({ slug }) => slug === tag);
    if (!entry) notFound();

    const posts = getAllPosts().filter((post) => post.tags.some((t) => tagSlug(t) === tag));
    return (
        <>
            <p className="b-kicker" style={{ marginTop: 52 }}>
                <Link href="/blogs/tags/">Tags</Link>
            </p>
            <h1 className="b-page-title" style={{ marginTop: 8 }}>
                {entry.tag}
            </h1>
            <p className="b-page-intro">
                {posts.length} {posts.length === 1 ? 'post' : 'posts'}.
            </p>
            <PostList posts={posts.map(toMeta)} />
        </>
    );
}
