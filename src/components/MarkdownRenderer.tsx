import React, { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import mermaid from 'mermaid';
import 'katex/dist/katex.min.css';

mermaid.initialize({
  startOnLoad: false,
  theme: 'dark',
  securityLevel: 'loose',
});

const Mermaid = ({ chart }: { chart: string }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string>('');

  useEffect(() => {
    let isMounted = true;
    const renderChart = async () => {
      try {
        const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
        const { svg } = await mermaid.render(id, chart);
        if (isMounted) setSvg(svg);
      } catch (error) {
        console.error('Mermaid rendering error:', error);
        if (isMounted) setSvg(`<div class="text-red-500">Error rendering chart</div>`);
      }
    };
    renderChart();
    return () => { isMounted = false; };
  }, [chart]);

  return <div ref={ref} dangerouslySetInnerHTML={{ __html: svg }} className="flex justify-center my-4" />;
};

export const MarkdownRenderer = ({ content }: { content: string }) => {
  return (
    <div className="markdown-body prose prose-invert max-w-none prose-sm">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          code({ node, inline, className, children, ...props }: any) {
            const match = /language-(\w+)/.exec(className || '');
            const language = match ? match[1] : '';
            
            if (!inline && language === 'mermaid') {
              return <Mermaid chart={String(children).replace(/\n$/, '')} />;
            }
            
            return !inline && match ? (
              <SyntaxHighlighter
                {...props}
                children={String(children).replace(/\n$/, '')}
                style={vscDarkPlus}
                language={language}
                PreTag="div"
                className="rounded-md !bg-[#111] border border-[#333]"
              />
            ) : (
              <code {...props} className={`${className} bg-[#222] px-1 py-0.5 rounded text-pink-400 font-mono text-sm`}>
                {children}
              </code>
            );
          }
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};
