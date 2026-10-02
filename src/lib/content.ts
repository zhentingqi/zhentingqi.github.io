import fs from 'fs';
import path from 'path';
import { parse } from 'smol-toml';
import { parseBibTeX } from '@/lib/bibtexParser';
import { Publication } from '@/types/publication';

const CONTENT_DIR = path.join(process.cwd(), 'content');

function readContent(filename: string): string {
    try {
        return fs.readFileSync(path.join(CONTENT_DIR, filename), 'utf-8');
    } catch (error) {
        console.error(`Error loading ${filename}:`, error);
        return '';
    }
}

function readToml<T>(filename: string): T | null {
    const raw = readContent(filename);
    return raw ? (parse(raw) as unknown as T) : null;
}

export interface NewsItem {
    date: string;
    content: string;
}

export interface ResearchContent {
    body?: string;
}

export function getBio(): string {
    return readContent('bio.md');
}

export function getNews(): NewsItem[] {
    const items = readToml<{ news: NewsItem[] }>('news.toml')?.news ?? [];
    return [...items].sort((a, b) => b.date.localeCompare(a.date));
}

export function getResearch(): ResearchContent {
    return readToml<ResearchContent>('research.toml') ?? {};
}

export function getPublications(): Publication[] {
    return parseBibTeX(readContent('publications.bib'));
}
