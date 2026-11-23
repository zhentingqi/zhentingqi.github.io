import type { Metadata } from 'next';
import RedirectTo from '@/components/RedirectTo';
import { getAllPosts } from '@/lib/blog';

// Old address of a post (/blog/<slug>/). Forwards to /blogs/<slug>/.
export const dynamicParams = false;

export function generateStaticParams() {
    return getAllPosts().map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    const { slug } = await params;
    return { robots: { index: false }, alternates: { canonical: `/blogs/${slug}/` } };
}

const fallback = 'mx-auto max-w-[790px] px-4 py-16 text-crimson underline underline-offset-4 sm:px-6';

export default async function OldPostRedirect({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    return <RedirectTo to={`/blogs/${slug}/`} label="This post has moved. Open it at its new address." className={fallback} />;
}
