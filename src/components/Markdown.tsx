import ReactMarkdown from 'react-markdown';

const external = (href?: string) => !!href && /^https?:\/\//.test(href);

const components = {
    a: ({ href, children }: { href?: string; children?: React.ReactNode }) => (
        <a href={href} {...(external(href) ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
            {children}
        </a>
    ),
};

export function Markdown({ children }: { children: string }) {
    return (
        <div className="prose-site">
            <ReactMarkdown components={components}>{children}</ReactMarkdown>
        </div>
    );
}

// Single-line markdown without the wrapping <p>
export function InlineMarkdown({ children }: { children: string }) {
    return (
        <span className="inline-md">
            <ReactMarkdown components={{ ...components, p: ({ children }) => <>{children}</> }}>{children}</ReactMarkdown>
        </span>
    );
}
