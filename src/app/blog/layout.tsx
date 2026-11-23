import type { Metadata } from 'next';
import Link from 'next/link';
import { Instrument_Sans, JetBrains_Mono, Newsreader, STIX_Two_Text } from 'next/font/google';
import 'katex/dist/katex.min.css';
import './blog.css';
import { getBlogConfig } from '@/lib/blog';

const newsreader = Newsreader({
    subsets: ['latin'],
    style: ['normal', 'italic'],
    axes: ['opsz'],
    variable: '--font-newsreader',
    display: 'swap',
});
// Body text. The closest open-source match to the serif Anthropic uses for its blog body,
// which is a proprietary face and cannot be self-hosted.
const stix = STIX_Two_Text({ subsets: ['latin'], style: ['normal', 'italic'], variable: '--font-stix', display: 'swap' });
const instrument = Instrument_Sans({ subsets: ['latin'], variable: '--font-instrument', display: 'swap' });
const jetbrains = JetBrains_Mono({ subsets: ['latin'], variable: '--font-jetbrains', display: 'swap' });

export function generateMetadata(): Metadata {
    const blog = getBlogConfig();
    return {
        metadataBase: new URL(blog.url),
        description: blog.description,
        alternates: {
            types: { 'application/rss+xml': [{ url: '/blog/rss.xml', title: `${blog.author} · ${blog.title}` }] },
        },
    };
}

// Blog posts sit under the site's top bar (rendered by the root layout) and use the
// reading typography from docs/blog-design.md. The list of posts is the Blogs view of the home page.
export default function BlogLayout({ children }: Readonly<{ children: React.ReactNode }>) {
    const blog = getBlogConfig();
    const year = new Date().getFullYear();

    return (
        <div className={`blog ${newsreader.variable} ${stix.variable} ${instrument.variable} ${jetbrains.variable}`}>
            <div className="b-container">
                <main>{children}</main>
                <footer className="b-footer">
                    <span>
                        © {year} {blog.author}
                    </span>
                    <Link href="/#blogs">All posts</Link>
                    <Link href="/blog/tags/">Tags</Link>
                    <a href="/blog/rss.xml">RSS</a>
                </footer>
            </div>
        </div>
    );
}
