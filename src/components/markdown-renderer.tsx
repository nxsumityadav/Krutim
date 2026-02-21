"use client";

import React, { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneLight, oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { cn } from "@/lib/utils";
import mermaid from "mermaid";

mermaid.initialize({
    startOnLoad: false,
    securityLevel: "loose",
    fontFamily: "inherit",
});

function MermaidDiagram({ chart, isDark }: { chart: string; isDark: boolean }) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [svg, setSvg] = useState<string>("");
    const [error, setError] = useState<string>("");

    useEffect(() => {
        const renderDiagram = async () => {
            try {
                mermaid.initialize({
                    startOnLoad: false,
                    theme: isDark ? "dark" : "neutral",
                    securityLevel: "loose",
                    fontFamily: "inherit",
                });
                const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
                const { svg } = await mermaid.render(id, chart);
                setSvg(svg);
            } catch (e: any) {
                setError(e.message || "Failed to render diagram");
            }
        };
        if (chart.trim()) {
            renderDiagram();
        }
    }, [chart, isDark]);

    if (error) {
        return (
            <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-500">
                <p className="font-medium mb-1">Diagram error</p>
                <pre className="text-xs opacity-70 whitespace-pre-wrap">{error}</pre>
            </div>
        );
    }

    if (!svg) {
        return (
            <div className="rounded-xl bg-muted p-4 text-center text-sm text-muted-foreground animate-pulse">
                Rendering diagram...
            </div>
        );
    }

    return (
        <div
            ref={containerRef}
            className="my-3 flex justify-center overflow-x-auto rounded-xl bg-white dark:bg-[#1a1a1a] p-4 border border-black/5 dark:border-white/10"
            dangerouslySetInnerHTML={{ __html: svg }}
        />
    );
}

function CodeBlock({ className, children, isDark, ...props }: any) {
    const [copied, setCopied] = useState(false);
    const match = /language-(\w+)/.exec(className || "");
    const lang = match ? match[1] : "";
    const code = String(children).replace(/\n$/, "");

    if (lang === "mermaid") {
        return <MermaidDiagram chart={code} isDark={isDark} />;
    }

    const handleCopy = async () => {
        await navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (!match) {
        return (
            <code
                className={cn(
                    "px-1.5 py-0.5 rounded-md text-[13px] font-mono",
                    "bg-black/5 dark:bg-white/10 text-[var(--chat-text)] dark:text-foreground"
                )}
                {...props}
            >
                {children}
            </code>
        );
    }

    return (
        <div className="relative group my-3 rounded-xl overflow-hidden border border-black/5 dark:border-white/10">
            <div className="flex items-center justify-between px-4 py-2 bg-black/5 dark:bg-white/5 text-xs text-muted-foreground">
                <span className="font-mono uppercase tracking-wider">{lang}</span>
                <button
                    onClick={handleCopy}
                    className="flex items-center gap-1 text-xs hover:text-foreground transition-colors"
                >
                    <span className="material-symbols-rounded text-[14px]">
                        {copied ? "check" : "content_copy"}
                    </span>
                    {copied ? "Copied" : "Copy"}
                </button>
            </div>
            <SyntaxHighlighter
                style={isDark ? oneDark : oneLight}
                language={lang}
                PreTag="div"
                customStyle={{
                    margin: 0,
                    padding: "1rem",
                    fontSize: "13px",
                    lineHeight: "1.6",
                    background: isDark ? "#1a1a1a" : "#FAFAFA",
                    borderRadius: 0,
                }}
                codeTagProps={{
                    style: { fontFamily: "var(--font-mono, ui-monospace, monospace)" },
                }}
            >
                {code}
            </SyntaxHighlighter>
        </div>
    );
}

interface MarkdownRendererProps {
    content: string;
    className?: string;
    isDark?: boolean;
}

// Tool call patterns to detect and beautify
const TOOL_CALL_PATTERNS = [
    // [WebSearch] or [ToolName] followed by optional JSON on same or next line
    /^\[(\w+)\]\s*$/,
    // {"query":"..."} standalone JSON object
    /^\{[^}]*"query"\s*:\s*"[^"]*"[^}]*\}$/,
    // tool_name {"key":"value"} pattern
    /^(\w+)\s+(\{[^}]*\})$/,
    // [ToolName] {"key":"value"} on same line
    /^\[(\w+)\]\s*(\{[^}]*\})$/,
];

function getToolIcon(toolName: string): string {
    const name = toolName.toLowerCase();
    if (name.includes("search") || name.includes("web")) return "travel_explore";
    if (name.includes("code") || name.includes("exec")) return "code";
    if (name.includes("file") || name.includes("read")) return "description";
    if (name.includes("image") || name.includes("vision")) return "image";
    if (name.includes("calc") || name.includes("math")) return "calculate";
    if (name.includes("browse") || name.includes("url")) return "language";
    return "build";
}

function parseToolQuery(text: string): string | null {
    try {
        const jsonMatch = text.match(/\{[^}]*\}/);
        if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            return parsed.query || parsed.input || parsed.q || parsed.search || Object.values(parsed)[0] as string;
        }
    } catch {
        // not valid JSON
    }
    return null;
}

function ToolCallBlock({ lines, isDark }: { lines: string[]; isDark: boolean }) {
    const combined = lines.join(" ").trim();

    // Extract tool name
    let toolName = "Tool";
    const bracketMatch = combined.match(/^\[(\w+)\]/);
    const prefixMatch = combined.match(/^(\w[\w_]+)\s+\{/);
    if (bracketMatch) toolName = bracketMatch[1];
    else if (prefixMatch) toolName = prefixMatch[1];

    // Extract query/parameter
    const query = parseToolQuery(combined);

    // Humanize tool name: web_search_with_snippets -> Web Search With Snippets
    const displayName = toolName
        .replace(/_/g, " ")
        .replace(/([a-z])([A-Z])/g, "$1 $2")
        .replace(/\b\w/g, c => c.toUpperCase());

    const icon = getToolIcon(toolName);

    return (
        <div className={cn(
            "flex items-center gap-3 my-2 px-4 py-3 rounded-2xl text-[13px]",
            isDark
                ? "bg-white/5 border border-white/8"
                : "bg-black/[0.03] border border-black/5"
        )}>
            <div className={cn(
                "flex items-center justify-center w-8 h-8 rounded-full shrink-0",
                isDark ? "bg-blue-500/15 text-blue-400" : "bg-blue-500/10 text-blue-600"
            )}>
                <span className="material-symbols-rounded text-[18px]">{icon}</span>
            </div>
            <div className="min-w-0 flex-1">
                <span className={cn(
                    "font-medium text-[13px]",
                    isDark ? "text-foreground/70" : "text-[var(--chat-text)]/80"
                )}>
                    {displayName}
                </span>
                {query && (
                    <p className={cn(
                        "text-[12px] mt-0.5 truncate",
                        isDark ? "text-foreground/40" : "text-muted-foreground"
                    )}>
                        {query}
                    </p>
                )}
            </div>
            <div className={cn(
                "shrink-0",
                isDark ? "text-foreground/20" : "text-muted-foreground/40"
            )}>
                <span className="material-symbols-rounded text-[16px] animate-spin" style={{ animationDuration: "2s" }}>progress_activity</span>
            </div>
        </div>
    );
}

function isToolCallLine(line: string): boolean {
    const trimmed = line.trim();
    if (!trimmed) return false;
    return TOOL_CALL_PATTERNS.some(p => p.test(trimmed));
}

// Pre-process content to separate tool call blocks from regular markdown
function splitContentBlocks(content: string): Array<{ type: "markdown" | "tool"; text: string }> {
    const lines = content.split("\n");
    const blocks: Array<{ type: "markdown" | "tool"; text: string }> = [];
    let currentMarkdown: string[] = [];

    const flushMarkdown = () => {
        if (currentMarkdown.length > 0) {
            blocks.push({ type: "markdown", text: currentMarkdown.join("\n") });
            currentMarkdown = [];
        }
    };

    let i = 0;
    while (i < lines.length) {
        const line = lines[i];
        const trimmed = line.trim();

        if (isToolCallLine(trimmed)) {
            // Check if next line is a continuation (JSON after [ToolName])
            const toolLines = [trimmed];
            if (/^\[\w+\]\s*$/.test(trimmed) && i + 1 < lines.length) {
                const nextTrimmed = lines[i + 1].trim();
                // Next line is JSON or tool_name JSON
                if (/^\{.*\}$/.test(nextTrimmed) || /^\w+\s+\{.*\}$/.test(nextTrimmed)) {
                    toolLines.push(nextTrimmed);
                    i++;
                }
            }
            flushMarkdown();
            blocks.push({ type: "tool", text: toolLines.join("\n") });
        } else {
            currentMarkdown.push(line);
        }
        i++;
    }
    flushMarkdown();

    return blocks;
}

export function MarkdownRenderer({ content, className, isDark = false }: MarkdownRendererProps) {
    const blocks = splitContentBlocks(content);

    return (
        <div className={cn("markdown-body text-[15px] leading-relaxed break-words", className)}>
            {blocks.map((block, idx) => {
                if (block.type === "tool") {
                    return (
                        <ToolCallBlock
                            key={idx}
                            lines={block.text.split("\n")}
                            isDark={isDark}
                        />
                    );
                }
                return (
                    <ReactMarkdown
                        key={idx}
                        remarkPlugins={[remarkGfm, remarkMath]}
                        rehypePlugins={[rehypeKatex]}
                        components={{
                            code({ className, children, ...props }: any) {
                                const match = /language-(\w+)/.exec(className || "");
                                const isInline = !match && !String(children).includes("\n");

                                if (isInline) {
                                    return (
                                        <code
                                            className={cn(
                                                "px-1.5 py-0.5 rounded-md text-[13px] font-mono",
                                                "bg-black/5 dark:bg-white/10"
                                            )}
                                            {...props}
                                        >
                                            {children}
                                        </code>
                                    );
                                }

                                return (
                                    <CodeBlock className={className} isDark={isDark} {...props}>
                                        {children}
                                    </CodeBlock>
                                );
                            },
                            pre({ children }: any) {
                                return <>{children}</>;
                            },
                            p({ children }: any) {
                                return <p className="mb-3 last:mb-0">{children}</p>;
                            },
                            h1({ children }: any) {
                                return <h1 className="text-2xl font-bold mt-6 mb-3 first:mt-0">{children}</h1>;
                            },
                            h2({ children }: any) {
                                return <h2 className="text-xl font-bold mt-5 mb-2 first:mt-0">{children}</h2>;
                            },
                            h3({ children }: any) {
                                return <h3 className="text-lg font-semibold mt-4 mb-2 first:mt-0">{children}</h3>;
                            },
                            h4({ children }: any) {
                                return <h4 className="text-base font-semibold mt-3 mb-1 first:mt-0">{children}</h4>;
                            },
                            ul({ children }: any) {
                                return <ul className="list-disc pl-6 mb-3 space-y-1">{children}</ul>;
                            },
                            ol({ children }: any) {
                                return <ol className="list-decimal pl-6 mb-3 space-y-1">{children}</ol>;
                            },
                            li({ children }: any) {
                                return <li className="leading-relaxed">{children}</li>;
                            },
                            blockquote({ children }: any) {
                                return (
                                    <blockquote className="border-l-3 border-primary/40 pl-4 my-3 text-muted-foreground italic">
                                        {children}
                                    </blockquote>
                                );
                            },
                            a({ href, children }: any) {
                                return (
                                    <a
                                        href={href}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-primary underline underline-offset-2 hover:text-primary/80 transition-colors"
                                    >
                                        {children}
                                    </a>
                                );
                            },
                            table({ children }: any) {
                                return (
                                    <div className="overflow-x-auto my-3 rounded-xl border border-black/5 dark:border-white/10">
                                        <table className="w-full text-sm">{children}</table>
                                    </div>
                                );
                            },
                            thead({ children }: any) {
                                return <thead className="bg-black/5 dark:bg-white/5">{children}</thead>;
                            },
                            th({ children }: any) {
                                return <th className="px-4 py-2 text-left font-semibold border-b border-black/10 dark:border-white/10">{children}</th>;
                            },
                            td({ children }: any) {
                                return <td className="px-4 py-2 border-b border-black/5 dark:border-white/5">{children}</td>;
                            },
                            hr() {
                                return <hr className="my-4 border-black/10 dark:border-white/10" />;
                            },
                            strong({ children }: any) {
                                return <strong className="font-semibold">{children}</strong>;
                            },
                            em({ children }: any) {
                                return <em className="italic">{children}</em>;
                            },
                            img({ src, alt }: any) {
                                return (
                                    <img
                                        src={src}
                                        alt={alt || ""}
                                        className="max-w-full rounded-xl my-3 border border-black/5 dark:border-white/10"
                                        loading="lazy"
                                    />
                                );
                            },
                        }}
                    >
                        {block.text}
                    </ReactMarkdown>
                );
            })}
        </div>
    );
}
