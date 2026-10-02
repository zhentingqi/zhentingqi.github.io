import { NewsItem } from '@/lib/content';
import { formatNewsDate } from '@/lib/utils';
import { InlineMarkdown } from '@/components/Markdown';

export default function NewsList({ items, showYear = true }: { items: NewsItem[]; showYear?: boolean }) {
    return (
        <ol className="relative space-y-5 border-l border-line pl-6">
            {items.map((item, i) => (
                <li key={`${item.date}-${i}`} className="relative">
                    <span className="absolute -left-[29px] top-[0.55rem] h-[9px] w-[9px] rounded-full border-2 border-crimson bg-paper" />
                    <time className="block text-[0.75rem] font-semibold uppercase tracking-[0.12em] text-crimson">
                        {showYear ? formatNewsDate(item.date) : formatNewsDate(item.date).split(' ')[0]}
                    </time>
                    <p className="mt-0.5 text-[0.98rem] leading-relaxed text-ink-soft">
                        <InlineMarkdown>{item.content}</InlineMarkdown>
                    </p>
                </li>
            ))}
        </ol>
    );
}
