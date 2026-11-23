'use client';

import { useState } from 'react';
import Link from 'next/link';
import { POST_TYPES, TYPE_PLURAL, TYPE_SHORT, formatDate, type PostMeta, type PostType } from '@/lib/blog-shared';

function PostRow({ post }: { post: PostMeta }) {
    const href = `/blogs/${post.slug}/`;
    return (
        <li className={`b-row${post.thumb ? ' has-thumb' : ''}`}>
            <div className="b-row-meta">
                <time dateTime={post.date}>{formatDate(post.date, 'short')}</time>
                <span>{TYPE_SHORT[post.type]}</span>
            </div>
            <div className="b-row-main">
                <Link href={href} className="b-row-title">
                    {post.title}
                </Link>
                {post.description && <p className="b-row-desc">{post.description}</p>}
            </div>
            {post.thumb && (
                <Link href={href} className="b-row-thumb" tabIndex={-1} aria-hidden="true">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={post.thumb} alt="" loading="lazy" decoding="async" />
                </Link>
            )}
        </li>
    );
}

/** Posts grouped by year. With `filter`, a row of type tabs sits above the list. */
export default function PostList({ posts, filter = false }: { posts: PostMeta[]; filter?: boolean }) {
    const [type, setType] = useState<PostType | 'all'>('all');

    const available = POST_TYPES.filter((t) => posts.some((post) => post.type === t));
    const visible = type === 'all' ? posts : posts.filter((post) => post.type === type);

    const years: { year: string; posts: PostMeta[] }[] = [];
    for (const post of visible) {
        const year = post.date.slice(0, 4);
        const group = years[years.length - 1];
        if (group?.year === year) group.posts.push(post);
        else years.push({ year, posts: [post] });
    }

    return (
        <div className="b-list">
            {filter && available.length > 1 && (
                <div className="b-filter" role="group" aria-label="Filter by type">
                    <button type="button" aria-pressed={type === 'all'} onClick={() => setType('all')}>
                        All
                    </button>
                    {available.map((t) => (
                        <button key={t} type="button" aria-pressed={type === t} onClick={() => setType(t)}>
                            {TYPE_PLURAL[t]}
                        </button>
                    ))}
                </div>
            )}

            {years.map(({ year, posts: group }) => (
                <section key={year} aria-label={year}>
                    <h2 className="b-year">{year}</h2>
                    <ul>
                        {group.map((post) => (
                            <PostRow key={post.slug} post={post} />
                        ))}
                    </ul>
                </section>
            ))}

            {visible.length === 0 && <p className="b-empty">Nothing here yet.</p>}
        </div>
    );
}
