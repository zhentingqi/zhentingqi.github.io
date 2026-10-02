import fs from 'fs';
import path from 'path';
import { parse } from 'smol-toml';

export interface SiteConfig {
    site: {
        title: string;
        description: string;
        favicon: string;
        last_updated?: string;
    };
    author: {
        name: string;
        title: string;
        institution: string;
        avatar: string;
    };
    social: {
        email?: string;
        location?: string;
        google_scholar?: string;
        orcid?: string;
        github?: string;
        linkedin?: string;
        instagram?: string;
        twitter?: string;
        [key: string]: string | string[] | undefined;
    };
    navigation: Array<{
        title: string;
        href: string;
    }>;
}

const CONFIG_PATH = path.join(process.cwd(), 'content', 'config.toml');

export function getConfig(): SiteConfig {
    try {
        const fileContent = fs.readFileSync(CONFIG_PATH, 'utf-8');
        return parse(fileContent) as unknown as SiteConfig;
    } catch (error) {
        console.error('Error loading config:', error);
        throw new Error('Failed to load content/config.toml');
    }
}
