import { TYPE_LABEL, getAllPosts, getBlogConfig } from '@/lib/blog';

export const dynamic = 'force-static';

const escape = (value: string) =>
    value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');

export function GET() {
    const blog = getBlogConfig();
    const posts = getAllPosts();
    const home = `${blog.url}/blog/`;

    const items = posts
        .map((post) => {
            const link = `${blog.url}/blog/${post.slug}/`;
            return `    <item>
      <title>${escape(post.title)}</title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <pubDate>${new Date(`${post.date}T12:00:00Z`).toUTCString()}</pubDate>
      <description>${escape(post.description || post.lede)}</description>
      <category>${escape(TYPE_LABEL[post.type])}</category>
${post.tags.map((tag) => `      <category>${escape(tag)}</category>`).join('\n')}
    </item>`;
        })
        .join('\n');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escape(`${blog.author} · ${blog.title}`)}</title>
    <link>${home}</link>
    <description>${escape(blog.description)}</description>
    <language>en</language>
    <atom:link href="${blog.url}/blog/rss.xml" rel="self" type="application/rss+xml" />
${posts[0] ? `    <lastBuildDate>${new Date(`${posts[0].date}T12:00:00Z`).toUTCString()}</lastBuildDate>\n` : ''}${items}
  </channel>
</rss>
`;

    return new Response(xml, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } });
}
