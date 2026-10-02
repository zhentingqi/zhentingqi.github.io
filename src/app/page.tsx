import { getBio, getNews, getPublications, getResearch } from '@/lib/content';
import { Markdown } from '@/components/Markdown';
import NewsList from '@/components/NewsList';
import PublicationList from '@/components/PublicationList';
import SectionTitle from '@/components/SectionTitle';

export default function HomePage() {
    const { body: research } = getResearch();

    return (
        <div className="space-y-16">
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

            <section id="publications" className="scroll-mt-20">
                <SectionTitle>Publications</SectionTitle>
                <PublicationList publications={getPublications()} />
            </section>
        </div>
    );
}
