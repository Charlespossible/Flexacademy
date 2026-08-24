import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

import { cn } from '@/lib/utils';

/**
 * Promote single-line `$$…$$` to a display-math block.
 *
 * remark-math only emits centred display math when the `$$` delimiters sit on
 * their own lines. Claude writes them inline (`$$s = ut + \frac12at^2$$`),
 * which would otherwise render as small in-paragraph math. This rewrites a
 * line that is *entirely* one `$$…$$` expression into the block form.
 *
 * Mid-sentence math ("the formula $$s=ut$$ is key") is deliberately left
 * alone — inline is correct there. Partial expressions arriving mid-stream
 * have no closing `$$` yet, so they simply don't match until complete.
 */
function promoteDisplayMath(markdown: string): string {
  return markdown.replace(
    /^[ \t]*\$\$([^\n]+?)\$\$[ \t]*$/gm,
    (_match, body: string) => `$$\n${body.trim()}\n$$`
  );
}

/**
 * Renders assistant Markdown — headings, lists, tables, code and LaTeX — for
 * chat bubbles and AI-generated panels.
 *
 * Wide content (display math, tables, code) scrolls inside its own container
 * so a long equation can never widen the bubble or push the page sideways.
 */
export function MarkdownMessage({
  content,
  className,
}: {
  content: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        // Vertical rhythm: space children, but never add margin at the very
        // top or bottom — the bubble already supplies its own padding.
        '[&>*]:my-2 [&>*:first-child]:mt-0 [&>*:last-child]:mb-0',
        'text-sm leading-relaxed break-words',
        className
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        // While a reply streams in, LaTeX arrives half-finished (e.g.
        // "$$s = ut + \frac{1}{2}"). Never throw on it — render what parses
        // and let the next chunk complete it.
        rehypePlugins={[[rehypeKatex, { throwOnError: false, strict: false }]]}
        components={{
          // ── Headings — scaled down for a chat bubble ──────────────────
          h1: ({ children }) => (
            <h1 className="font-display text-base font-bold text-text-primary mt-4 mb-2 first:mt-0">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="font-display text-sm font-bold text-text-primary mt-4 mb-1.5 first:mt-0">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="font-display text-sm font-semibold text-text-secondary mt-3 mb-1 first:mt-0">
              {children}
            </h3>
          ),
          h4: ({ children }) => (
            <h4 className="font-display text-xs font-semibold uppercase tracking-wide text-text-muted mt-3 mb-1 first:mt-0">
              {children}
            </h4>
          ),

          // ── Text ──────────────────────────────────────────────────────
          p: ({ children }) => <p className="leading-relaxed">{children}</p>,
          strong: ({ children }) => (
            <strong className="font-semibold text-text-primary">{children}</strong>
          ),
          em: ({ children }) => <em className="italic">{children}</em>,

          // ── Lists ─────────────────────────────────────────────────────
          ul: ({ children }) => (
            <ul className="list-disc pl-5 space-y-1 marker:text-accent/60">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal pl-5 space-y-1 marker:text-accent/60">{children}</ol>
          ),
          li: ({ children }) => <li className="leading-relaxed pl-0.5">{children}</li>,

          // ── Code ──────────────────────────────────────────────────────
          code: ({ className: cls, children, ...props }) => {
            // react-markdown v9+ signals block vs inline via the language class
            const isBlock = /language-/.test(cls ?? '');
            if (!isBlock) {
              return (
                <code
                  className="font-mono text-[0.85em] px-1.5 py-0.5 rounded bg-base/60 border border-border-subtle text-accent"
                  {...props}
                >
                  {children}
                </code>
              );
            }
            return (
              <code className="font-mono text-xs block" {...props}>
                {children}
              </code>
            );
          },
          pre: ({ children }) => (
            <pre className="bg-base/70 border border-border-subtle rounded-xl p-3 overflow-x-auto">
              {children}
            </pre>
          ),

          // ── Tables — scroll rather than overflow the bubble ────────────
          table: ({ children }) => (
            <div className="overflow-x-auto -mx-1 px-1">
              <table className="w-full text-xs border-collapse">{children}</table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="border-b border-border-subtle">{children}</thead>
          ),
          th: ({ children }) => (
            <th className="text-left font-semibold text-text-primary px-2 py-1.5">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-2 py-1.5 border-t border-border-subtle/60">{children}</td>
          ),

          // ── Misc ──────────────────────────────────────────────────────
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-accent/40 pl-3 text-text-secondary italic">
              {children}
            </blockquote>
          ),
          hr: () => <hr className="border-0 border-t border-border-subtle my-3" />,
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent underline underline-offset-2 hover:opacity-80"
            >
              {children}
            </a>
          ),
        }}
      >
        {promoteDisplayMath(content)}
      </ReactMarkdown>
    </div>
  );
}
