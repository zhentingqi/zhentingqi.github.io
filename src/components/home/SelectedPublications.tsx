'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Publication } from '@/types/publication';

interface SelectedPublicationsProps {
    publications: Publication[];
    title?: string;
    enableOnePageMode?: boolean;
}

export default function SelectedPublications({ publications, title = 'Selected Publications', enableOnePageMode = false }: SelectedPublicationsProps) {
    return (
        <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
        >
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-serif font-bold text-primary">{title}</h2>
                <Link
                    href={enableOnePageMode ? "/#publications" : "/publications"}
                    prefetch={true}
                    className="text-accent hover:text-accent-dark text-sm font-medium transition-all duration-200 rounded hover:bg-accent/10 hover:shadow-sm"
                >
                    View All →
                </Link>
            </div>
            <div className="space-y-4">
                {publications.map((pub, index) => (
                    <motion.div
                        key={pub.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.1 * index }}
                        className="bg-neutral-50 dark:bg-neutral-800 p-4 rounded-lg shadow-sm border border-neutral-200 dark:border-[rgba(148,163,184,0.24)] hover:shadow-lg transition-all duration-200 hover:scale-[1.02]"
                    >
                        <div className="flex items-start justify-between gap-2 mb-2">
                            <h3 className="font-semibold text-primary leading-tight flex-1">
                                {pub.title}
                            </h3>
                            {pub.awards && pub.awards.length > 0 && (
                                <div className="flex flex-wrap gap-1 flex-shrink-0">
                                    {pub.awards.map((award, idx) => (
                                        <span
                                            key={idx}
                                            className="inline-block px-2 py-1 rounded border-2 border-accent bg-accent/10 text-accent text-xs font-semibold whitespace-nowrap"
                                        >
                                            🏆 {award}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                        <p className="text-sm text-neutral-600 dark:text-neutral-500 mb-1">
                            {pub.authors.map((author, idx) => (
                                <span key={idx}>
                                    <span className={author.isHighlighted ? 'font-semibold text-accent underline' : ''}>
                                        {author.name}
                                    </span>
                                    {author.isCorresponding && (
                                        <sup className={`ml-0 ${author.isHighlighted ? 'text-accent' : 'text-neutral-600 dark:text-neutral-500'}`}>†</sup>
                                    )}
                                    {idx < pub.authors.length - 1 && ', '}
                                </span>
                            ))}
                        </p>
                        <p className="text-sm text-neutral-600 dark:text-neutral-500 mb-2">
                            {pub.journal || pub.conference} {pub.year}
                        </p>
                        {pub.description && (
                            <p className="text-sm text-neutral-500 dark:text-neutral-500 line-clamp-2 mb-3">
                                {pub.description}
                            </p>
                        )}
                        <div className="flex flex-wrap gap-2 mt-2">
                            {(pub.arxivId || (pub.url && pub.url.includes('arxiv.org'))) && (
                                <a
                                    href={pub.url && pub.url.includes('arxiv.org') ? pub.url : `https://arxiv.org/abs/${pub.arxivId}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center px-3 py-1 rounded-md text-xs font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-accent hover:text-white transition-colors"
                                >
                                    arXiv
                                </a>
                            )}
                            {(pub.pdfUrl || (pub.url && pub.url.includes('arxiv.org'))) && (
                                <a
                                    href={pub.pdfUrl || (pub.url ? convertArxivToPdf(pub.url) : undefined) || `https://arxiv.org/pdf/${pub.arxivId}.pdf`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center px-3 py-1 rounded-md text-xs font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-accent hover:text-white transition-colors"
                                >
                                    PDF
                                </a>
                            )}
                        </div>
                    </motion.div>
                ))}
            </div>
        </motion.section>
    );
}

function convertArxivToPdf(url: string): string | undefined {
    if (!url) return undefined;
    if (url.includes('/pdf/')) return url;
    const match = url.match(/\/abs\/(\d{4}\.\d{4,5})/);
    if (match) return `https://arxiv.org/pdf/${match[1]}.pdf`;
    return undefined;
}
