import { getBio, getNews, getPublications, getResearch } from '@/lib/content';
import { getAllPosts, toMeta } from '@/lib/blog';
import { getConfig } from '@/lib/config';
import { Markdown } from '@/components/Markdown';
import BlogList from '@/components/BlogList';
import HomeTabs, { TabLink } from '@/components/HomeTabs';
import NewsList from '@/components/NewsList';
import PublicationList from '@/components/PublicationList';
import SectionTitle from '@/components/SectionTitle';
import SiteHeader from '@/components/SiteHeader';

const asideLink = 'text-[0.85rem] text-muted transition-colors hover:text-crimson';
// Space between the top bar and the title of a view that has no portrait header.
const viewTop = 'pt-10 sm:pt-12';

// One page, three views, switched by the top bar: About, Publications, Blogs.
export default function HomePage() {
    const { body: research } = getResearch();
    const publications = getPublications();
    const posts = getAllPosts().map(toMeta);

    // Only the About view carries the portrait header; the other two start with their title.
    const about = (
        <>
            <SiteHeader config={getConfig()} />
            <div className="space-y-16 pt-4 sm:pt-6">
                <section id="about" className="scroll-mt-20">
                    <SectionTitle>About</SectionTitle>
                    <Markdown>{getBio()}</Markdown>
                </section>

                <section id="research" className="scroll-mt-20">
                    <SectionTitle>Research</SectionTitle>
                    {research && <Markdown>{research.trim()}</Markdown>}
                </section>

                <section id="news" className="scroll-mt-20">
                    <SectionTitle>News</SectionTitle>
                    <div className="scroll-area max-h-[22rem] overflow-y-auto pl-1.5 pr-4">
                        <NewsList items={getNews()} />
                    </div>
                </section>

                <section id="selected-publications" className="scroll-mt-20">
                    <SectionTitle
                        aside={
                            <TabLink to="publications" className={asideLink}>
                                All {publications.length} publications
                            </TabLink>
                        }
                    >
                        Selected Publications
                    </SectionTitle>
                    <PublicationList publications={publications} show="selected" />
                </section>
            </div>
        </>
    );

    const allPublications = (
        <section className={viewTop}>
            <SectionTitle>Publications</SectionTitle>
            <PublicationList publications={publications} />
        </section>
    );

    const blogs = (
        <section className={viewTop}>
            <SectionTitle
                aside={
                    <a href="/blogs/rss.xml" className={asideLink}>
                        RSS
                    </a>
                }
            >
                Blogs
            </SectionTitle>
            {posts.length > 0 ? <BlogList posts={posts} /> : <p className="text-muted">Nothing here yet.</p>}
        </section>
    );

    return <HomeTabs panels={{ about, publications: allPublications, blogs }} />;
}
