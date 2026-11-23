import type { ComponentProps, ReactNode } from 'react';
import CopyButton from '@/components/blog/CopyButton';

type PreProps = ComponentProps<'pre'> & { 'data-title'?: string };

/** Wraps Shiki's <pre> with an optional title (```py title="file.py") and a copy button. */
export function Pre({ children, 'data-title': title, ...props }: PreProps) {
    return (
        <div className="code">
            <div className="code-bar">
                <span className="code-title">{title}</span>
                <CopyButton />
            </div>
            <pre {...props} tabIndex={0}>
                {children}
            </pre>
        </div>
    );
}

/** Tables scroll inside their own box on narrow screens. */
export function Table({ children }: { children?: ReactNode }) {
    return (
        <div className="table-wrap">
            <table>{children}</table>
        </div>
    );
}

/** External links open in a new tab. */
export function Anchor({ href, children, ...props }: ComponentProps<'a'>) {
    const external = !!href && /^https?:\/\//.test(href);
    return (
        <a href={href} {...props} {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
            {children}
        </a>
    );
}
