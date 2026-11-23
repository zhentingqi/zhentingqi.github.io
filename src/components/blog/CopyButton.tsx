'use client';

import { useState } from 'react';

export default function CopyButton() {
    const [copied, setCopied] = useState(false);

    const copy = async (event: React.MouseEvent<HTMLButtonElement>) => {
        const pre = event.currentTarget.closest('.code')?.querySelector('pre');
        if (!pre) return;
        try {
            await navigator.clipboard.writeText(pre.innerText);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        } catch {
            // Clipboard access can be denied; the code is still selectable.
        }
    };

    return (
        <button type="button" className="code-copy" onClick={copy}>
            {copied ? 'Copied' : 'Copy'}
        </button>
    );
}
