'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

/** Forwards to another page of the site as soon as it loads, with a plain link as a fallback. */
export default function RedirectTo({ to, label, className }: { to: string; label: string; className?: string }) {
    const router = useRouter();

    useEffect(() => {
        router.replace(to);
    }, [router, to]);

    return (
        <p className={className}>
            <Link href={to}>{label}</Link>
        </p>
    );
}
