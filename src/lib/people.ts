import fs from 'fs';
import path from 'path';
import { parse } from 'smol-toml';

/** One entry of the profile library in `content/people.toml`. */
export interface Person {
    name: string;
    affiliation?: string;
    /** Site path of a square photo under `public/`. */
    avatar?: string;
    /** Where a click on the person goes: their homepage, or a path on this site. */
    url?: string;
}

const PEOPLE_PATH = path.join(process.cwd(), 'content', 'people.toml');
const PUBLIC_DIR = path.join(process.cwd(), 'public');

let cache: Map<string, Person> | null = null;

const key = (name: string) => name.trim().toLowerCase().replace(/\s+/g, ' ');

function load(): Map<string, Person> {
    const people = new Map<string, Person>();
    if (!fs.existsSync(PEOPLE_PATH)) return people;

    const data = parse(fs.readFileSync(PEOPLE_PATH, 'utf-8')) as { people?: Array<Record<string, unknown>> };
    for (const entry of data.people ?? []) {
        const name = String(entry.name ?? '').trim();
        if (!name) continue;
        let avatar = entry.avatar ? String(entry.avatar) : undefined;
        // A photo that is not on disk would render as a broken image; fall back to initials instead.
        if (avatar && !fs.existsSync(path.join(PUBLIC_DIR, avatar))) {
            console.warn(`people.toml: avatar for ${name} not found at public${avatar}`);
            avatar = undefined;
        }
        people.set(key(name), {
            name,
            affiliation: entry.affiliation ? String(entry.affiliation) : undefined,
            avatar,
            url: entry.url ? String(entry.url) : undefined,
        });
    }
    return people;
}

/** Looks a person up by name, ignoring case and extra spaces. */
export function findPerson(name: string): Person | undefined {
    // Re-read in development so an edit to people.toml shows without a restart.
    if (!cache || process.env.NODE_ENV !== 'production') cache = load();
    return cache.get(key(name));
}
