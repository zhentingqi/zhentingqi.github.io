'use client';

import { smoothScrollTo } from '@/lib/scroll';

export default function BackToTop() {
    return (
        <a
            href="#top"
            onClick={(e) => {
                e.preventDefault();
                smoothScrollTo('#top');
            }}
            className="mt-3 text-crimson underline-offset-4 hover:underline"
        >
            Back to top ↑
        </a>
    );
}
