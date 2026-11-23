import type { Metadata } from 'next';
import RedirectTo from '@/components/RedirectTo';

// Posts used to live under /blog/. These pages forward old links to their new /blogs/ addresses.
export const metadata: Metadata = { robots: { index: false }, alternates: { canonical: '/#blogs' } };

const fallback = 'mx-auto max-w-[790px] px-4 py-16 text-crimson underline underline-offset-4 sm:px-6';

export default function OldBlogIndexRedirect() {
    return <RedirectTo to="/#blogs" label="Go to Blogs" className={fallback} />;
}
