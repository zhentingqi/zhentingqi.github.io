import type { ComponentType, ReactNode } from 'react';
import { evaluate } from '@mdx-js/mdx';
import * as runtime from 'react/jsx-runtime';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeSlug from 'rehype-slug';
import rehypeShiki from '@shikijs/rehype';
import { createCssVariablesTheme } from 'shiki';

// Token colors come from CSS variables (see blog.css), so one render serves light and dark.
const codeTheme = createCssVariablesTheme({
    name: 'reading-room',
    variablePrefix: '--code-',
    variableDefaults: {},
    fontStyle: true,
});

const CODE_LANGS = [
    'python', 'bash', 'shell', 'javascript', 'typescript', 'tsx', 'jsx', 'json', 'yaml', 'toml',
    'latex', 'bibtex', 'diff', 'c', 'cpp', 'rust', 'go', 'sql', 'markdown', 'html', 'css',
];

type MdNode = { type: string; children?: MdNode[] };

/** A paragraph holding only an image becomes the image itself, so it can render as a <figure>. */
function remarkUnwrapImages() {
    return (tree: MdNode) => {
        tree.children = tree.children?.map((node) =>
            node.type === 'paragraph' && node.children?.length === 1 && node.children[0].type === 'image' ? node.children[0] : node,
        );
    };
}

export type MdxComponents = Record<string, ComponentType<never>>;

export async function renderMdx(source: string, components: MdxComponents): Promise<ReactNode> {
    const { default: Content } = await evaluate(source, {
        ...runtime,
        remarkPlugins: [remarkGfm, remarkMath, remarkUnwrapImages],
        rehypePlugins: [
            rehypeSlug,
            [rehypeKatex, { strict: false }],
            [
                rehypeShiki,
                {
                    theme: codeTheme,
                    langs: CODE_LANGS,
                    defaultLanguage: 'text',
                    fallbackLanguage: 'text',
                    parseMetaString: (meta: string) => {
                        const title = /title="([^"]+)"/.exec(meta ?? '');
                        return title ? { 'data-title': title[1] } : {};
                    },
                },
            ],
        ],
    });
    return <Content components={components as never} />;
}
