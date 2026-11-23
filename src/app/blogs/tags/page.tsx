import type { Metadata } from 'next';
import Link from 'next/link';
import { getAllTags } from '@/lib/blog';

export const metadata: Metadata = { title: 'Blog tags' };

export default function TagsPage() {
    const tags = getAllTags();
    return (
        <>
            <h1 className="b-page-title">Tags</h1>
            <p className="b-page-intro">
                {tags.length} {tags.length === 1 ? 'topic' : 'topics'}.
            </p>
            <p className="b-tags">
                {tags.map(({ tag, slug, count }) => (
                    <Link key={slug} href={`/blogs/tags/${slug}/`}>
                        {tag}
                        <sup>{count}</sup>
                    </Link>
                ))}
            </p>
        </>
    );
}
