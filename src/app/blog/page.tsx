'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// The list of posts is the Blogs view of the home page. This address only forwards there,
// so links to /blog/ (for example from the RSS feed) keep working.
export default function BlogIndexRedirect() {
    const router = useRouter();

    useEffect(() => {
        router.replace('/#blogs');
    }, [router]);

    return (
        <p className="b-empty">
            <Link href="/#blogs">Go to Blogs</Link>
        </p>
    );
}
