import Link from 'next/link';
import { TYPE_LABEL, formatDate, type PostMeta } from '@/lib/blog-shared';

// The latest blog posts, shown in the Blogs section of the home page.
export default function BlogList({ posts }: { posts: PostMeta[] }) {
    return (
        <ul className="divide-y divide-line">
            {posts.map((post) => (
                <li key={post.slug} className="py-5 first:pt-0 last:pb-0">
                    <p className="text-[0.75rem] font-semibold uppercase tracking-[0.12em] text-crimson">
                        <time dateTime={post.date}>{formatDate(post.date)}</time>
                        <span className="font-medium text-muted"> · {TYPE_LABEL[post.type]}</span>
                    </p>
                    <h3 className="mt-1.5 font-serif text-[1.15rem] font-semibold leading-snug text-ink">
                        <Link href={`/blogs/${post.slug}/`} className="transition-colors hover:text-crimson">
                            {post.title}
                        </Link>
                    </h3>
                    {post.description && <p className="mt-1.5 text-[0.92rem] leading-relaxed text-muted">{post.description}</p>}
                </li>
            ))}
        </ul>
    );
}
