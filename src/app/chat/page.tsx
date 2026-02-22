"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { MarkdownRenderer } from "@/components/markdown-renderer";
import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { useTheme } from "@/components/theme-provider";
import { useChatState } from "@/components/chat-state-provider";
import { KrutimLogo } from "@/components/krutim-logo";
import { motion, AnimatePresence } from "framer-motion";
import {
    Sheet,
    SheetClose,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface Model {
    id: string;
    name: string;
    status: "available" | "unavailable" | "unknown";
    model_identifier: string;
}

interface Message {
    role: "user" | "assistant";
    content: string;
    reasoning?: string;
    reasoningDuration?: number;
    model?: string;
    images?: string[]; // base64 data URLs for pasted/dropped images
}

// Parse <think>...</think> tags from content string
// Returns { reasoning, content } with think tags stripped
// Handles: closed tags, unclosed tags (streaming), partial opening tags at end of chunk
function parseThinkTags(raw: string): { reasoning: string; content: string } {
    // First extract all fully closed <think>...</think> blocks
    const thinkRegex = /<think>([\s\S]*?)<\/think>/gi;
    let reasoning = "";
    let match;
    while ((match = thinkRegex.exec(raw)) !== null) {
        reasoning += match[1].trim() + "\n";
    }
    // Remove all closed think blocks from content
    let content = raw.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();

    // Handle unclosed <think> tag (still streaming reasoning)
    // Find the last <think> that has no matching </think> after it
    const lastOpenIdx = content.lastIndexOf("<think>");
    const lastOpenIdxCI = raw.toLowerCase().lastIndexOf("<think>");
    if (lastOpenIdxCI !== -1) {
        const afterLastOpen = raw.substring(lastOpenIdxCI + 7);
        const hasClose = /<\/think>/i.test(afterLastOpen);
        if (!hasClose) {
            // Unclosed think tag — content before it is visible, rest is reasoning
            reasoning += afterLastOpen.trim();
            const contentBefore = raw.substring(0, lastOpenIdxCI).replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
            return { reasoning: reasoning.trim(), content: contentBefore };
        }
    }

    // Handle partial opening tag at very end of chunk (e.g., "<thi" or "<think")
    // This prevents partial tags from appearing in rendered content
    const partialMatch = content.match(/<t(?:h(?:i(?:n(?:k)?)?)?)?$/i);
    if (partialMatch) {
        content = content.substring(0, partialMatch.index).trim();
    }

    return { reasoning: reasoning.trim(), content };
}

function ThinkingBlock({
    reasoning,
    isStreaming,
    duration,
    isDark,
}: {
    reasoning: string;
    isStreaming: boolean;
    duration?: number;
    isDark: boolean;
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [elapsed, setElapsed] = useState(0);
    const startTimeRef = useRef<number>(Date.now());

    useEffect(() => {
        if (!isStreaming) return;
        startTimeRef.current = Date.now();
        const interval = setInterval(() => {
            setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000));
        }, 1000);
        return () => clearInterval(interval);
    }, [isStreaming]);

    const displayDuration = isStreaming ? elapsed : (duration ?? elapsed);

    // While actively thinking (streaming reasoning, no content yet)
    if (isStreaming) {
        return (
            <div className="mb-4">
                {/* Shimmer header */}
                <motion.div
                    className={cn(
                        "flex items-center gap-2 text-[13px] font-medium mb-3",
                        "text-muted-foreground dark:text-foreground/60"
                    )}
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                >
                    <span className="material-symbols-rounded text-[16px]">psychology</span>
                    <span>Thinking{elapsed > 0 ? ` for ${elapsed}s` : "..."}</span>
                </motion.div>

                {/* Visible reasoning while streaming */}
                <div className={cn(
                    "relative pl-5 ml-2 max-h-[300px] overflow-y-auto",
                    "border-l border-black/10 dark:border-l dark:border-white/10"
                )}>
                    <div className={cn(
                        "text-[13px] leading-relaxed",
                        "text-muted-foreground/70 dark:text-foreground/40"
                    )}>
                        <MarkdownRenderer content={reasoning} isDark={isDark} />
                    </div>
                </div>
            </div>
        );
    }

    // Collapsed state after thinking is done
    return (
        <div className="mb-4">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "flex items-center gap-1.5 text-[13px] transition-colors cursor-pointer",
                    "text-muted-foreground/70 hover:text-muted-foreground dark:text-foreground/40 dark:hover:text-foreground/60"
                )}
            >
                <span className="material-symbols-rounded text-[14px]">psychology</span>
                <span>Thought for {displayDuration}s</span>
                <motion.span
                    className="material-symbols-rounded text-[16px]"
                    animate={{ rotate: isOpen ? 90 : 0 }}
                    transition={{ duration: 0.15 }}
                >
                    chevron_right
                </motion.span>
            </button>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                    >
                        <div className={cn(
                            "relative pl-5 ml-2 mt-3 max-h-[400px] overflow-y-auto",
                            "border-l border-black/10 dark:border-l dark:border-white/10"
                        )}>
                            <div className={cn(
                                "text-[13px] leading-relaxed",
                                "text-muted-foreground/70 dark:text-foreground/40"
                            )}>
                                <MarkdownRenderer content={reasoning} isDark={isDark} />
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default function ChatPage() {
    const [models, setModels] = useState<Model[]>([]);
    const [selectedModel, setSelectedModel] = useState<Model | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
    const [mounted, setMounted] = useState(false);
    const [pendingImages, setPendingImages] = useState<string[]>([]);
    const scrollRef = useRef<HTMLDivElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const reasoningStartRef = useRef<number | null>(null);
    const { resolvedTheme } = useTheme();
    const { setIsActiveChat } = useChatState();
    const isDark = resolvedTheme === "dark";

    const getGreeting = () => {
        if (!mounted) return "How can I help you today?";
        const hour = new Date().getHours();
        if (hour < 5) return "How can I help you tonight?";
        if (hour < 12) return "Good morning! How can I help?";
        if (hour < 17) return "Good afternoon! How can I help?";
        if (hour < 21) return "Good evening! How can I help?";
        return "How can I help you tonight?";
    };

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!mounted) return;
        // Local cache loading for chat history is disabled to prevent hydration issues
        /*
        const savedChat = localStorage.getItem("current_chat_history");
        if (savedChat) {
            try {
                const parsed: Message[] = JSON.parse(savedChat);
                const cleaned = parsed.map(m => {
                    if (m.role === "assistant" && m.content && m.content.includes("<think>")) {
                        const { reasoning, content } = parseThinkTags(m.content);
                        return { ...m, content, reasoning: reasoning || m.reasoning || "" };
                    }
                    return m;
                });
                setMessages(cleaned);
            } catch {
                setMessages([]);
            }
        }
        */

        const fetchModels = async () => {
            const { data } = await supabase
                .from("models")
                .select("id, name, status, model_identifier");
            if (data) {
                const sorted = [...data].sort((a: Model, b: Model) => (a.name || "").localeCompare(b.name || ""));
                setModels(sorted);
                if (sorted.length > 0) {
                    const savedModelId = localStorage.getItem("selected_model_id");
                    const savedModel = savedModelId ? sorted.find((m: Model) => m.id === savedModelId) : null;
                    setSelectedModel(savedModel || sorted[0]);
                }
            }
        };

        fetchModels();

        const channel = supabase
            .channel("model-status-updates")
            .on("postgres_changes", { event: "UPDATE", schema: "public", table: "models" }, (payload) => {
                setModels((current) => current.map((m) => m.id === payload.new.id ? { ...m, status: payload.new.status } : m));
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [mounted]);

    // Sync active chat state with bottom nav visibility
    useEffect(() => {
        return () => { setIsActiveChat(false); };
    }, [setIsActiveChat]);

    useEffect(() => {
        if (messages.length > 0) {
            localStorage.setItem("current_chat_history", JSON.stringify(messages));
        } else {
            localStorage.removeItem("current_chat_history");
        }
        setIsActiveChat(messages.length > 0);
    }, [messages, setIsActiveChat]);

    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "auto" });
        } else if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isLoading]);

    const handleClearChat = () => {
        setMessages([]);
    };

    const handleCopy = async (content: string, index: number) => {
        await navigator.clipboard.writeText(content);
        setCopiedIndex(index);
        setTimeout(() => setCopiedIndex(null), 2000);
    };

    const fileToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    };

    const handleImageFiles = async (files: FileList | File[]) => {
        const imageFiles = Array.from(files).filter(f => f.type.startsWith("image/"));
        if (imageFiles.length === 0) return;
        const base64Images = await Promise.all(imageFiles.map(f => fileToBase64(f)));
        setPendingImages(prev => [...prev, ...base64Images]);
    };

    const handlePaste = async (e: React.ClipboardEvent) => {
        const items = e.clipboardData?.items;
        if (!items) return;
        const imageFiles: File[] = [];
        for (let i = 0; i < items.length; i++) {
            if (items[i].type.startsWith("image/")) {
                const file = items[i].getAsFile();
                if (file) imageFiles.push(file);
            }
        }
        if (imageFiles.length > 0) {
            e.preventDefault();
            await handleImageFiles(imageFiles);
        }
    };

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const files = e.dataTransfer?.files;
        if (files) await handleImageFiles(files);
    };

    const removeImage = (index: number) => {
        setPendingImages(prev => prev.filter((_, i) => i !== index));
    };

    const streamResponse = async (modelId: string, chatMessages: Message[], modelName?: string) => {
        const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/chat`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
            },
            body: JSON.stringify({
                model_id: modelId,
                messages: chatMessages.map(m => {
                    // If message has images, send as multimodal content array (OpenAI vision format)
                    if (m.images && m.images.length > 0) {
                        const contentParts: any[] = [];
                        for (const img of m.images) {
                            contentParts.push({ type: "image_url", image_url: { url: img } });
                        }
                        if (m.content) {
                            contentParts.push({ type: "text", text: m.content });
                        }
                        return { role: m.role, content: contentParts };
                    }
                    return { role: m.role, content: m.content };
                }),
            }),
        });

        if (!response.ok) throw new Error("Stream failed");

        const reader = response.body?.getReader();
        if (!reader) throw new Error("No reader");

        const decoder = new TextDecoder();
        const assistantMessage: Message = { role: "assistant", content: "", reasoning: "", model: modelName || "" };
        // Track raw accumulated text to parse <think> tags from content stream
        let rawAccumulated = "";
        let hasReasoningContentField = false;
        reasoningStartRef.current = null;
        setMessages(prev => [...prev, assistantMessage]);

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split("\n");

            for (const line of lines) {
                if (line.startsWith("data: ")) {
                    const dataStr = line.substring(6).trim();
                    if (dataStr === "[DONE]") break;
                    try {
                        const data = JSON.parse(dataStr);
                        const delta = data.choices[0].delta;

                        // Handle models that use reasoning_content field (OpenAI-style)
                        if (delta.reasoning_content) {
                            hasReasoningContentField = true;
                            if (!reasoningStartRef.current) {
                                reasoningStartRef.current = Date.now();
                            }
                            assistantMessage.reasoning = (assistantMessage.reasoning || "") + delta.reasoning_content;
                        }

                        // Handle images array or image_url strings directly in delta
                        if (delta.images && Array.isArray(delta.images)) {
                            assistantMessage.images = [...(assistantMessage.images || []), ...delta.images];
                        }
                        if (delta.image_url && typeof delta.image_url === 'string') {
                            assistantMessage.images = [...(assistantMessage.images || []), delta.image_url];
                        }

                        if (delta.content) {
                            if (hasReasoningContentField) {
                                // Model uses separate reasoning field — content is clean
                                if (reasoningStartRef.current && !assistantMessage.reasoningDuration) {
                                    assistantMessage.reasoningDuration = Math.floor((Date.now() - reasoningStartRef.current) / 1000);
                                }
                                assistantMessage.content += delta.content;
                            } else {
                                // Model might embed <think> tags in content
                                rawAccumulated += delta.content;

                                // Track reasoning timing
                                if (rawAccumulated.includes("<think>") && !reasoningStartRef.current) {
                                    reasoningStartRef.current = Date.now();
                                }

                                // Parse think tags from accumulated content
                                const parsed = parseThinkTags(rawAccumulated);
                                assistantMessage.reasoning = parsed.reasoning;
                                assistantMessage.content = parsed.content;

                                // If we found closing </think> tag, compute duration
                                if (rawAccumulated.includes("</think>") && reasoningStartRef.current && !assistantMessage.reasoningDuration) {
                                    assistantMessage.reasoningDuration = Math.floor((Date.now() - reasoningStartRef.current) / 1000);
                                }
                            }
                        }

                        setMessages(prev => {
                            const newMessages = [...prev];
                            newMessages[newMessages.length - 1] = { ...assistantMessage };
                            return newMessages;
                        });
                    } catch (e) {
                        // Ignore partial JSON chunks during streaming
                    }
                }
            }
        }

        // Finalize reasoning duration if content never came
        if (reasoningStartRef.current && !assistantMessage.reasoningDuration) {
            assistantMessage.reasoningDuration = Math.floor((Date.now() - reasoningStartRef.current) / 1000);
            setMessages(prev => {
                const newMessages = [...prev];
                newMessages[newMessages.length - 1] = { ...assistantMessage };
                return newMessages;
            });
        }
    };

    const handleRegenerate = async (index: number) => {
        if (isLoading) return;

        const userMsgIndex = index - 1;
        if (userMsgIndex < 0 || messages[userMsgIndex].role !== "user") return;

        const updatedMessages = messages.slice(0, userMsgIndex + 1);
        setMessages(updatedMessages);
        setIsLoading(true);

        const availableModels = models.filter(m => m.status === 'available');
        const differentModels = availableModels.filter(m => m.id !== selectedModel?.id);
        let nextModel = selectedModel;
        if (differentModels.length > 0) {
            nextModel = differentModels[Math.floor(Math.random() * differentModels.length)];
            setSelectedModel(nextModel);
            if (nextModel) localStorage.setItem("selected_model_id", nextModel.id);
        }

        try {
            await streamResponse(nextModel?.id || "", updatedMessages, nextModel?.name);
        } catch (error: any) {
            setMessages(prev => [...prev, { role: "assistant", content: `Error: ${error.message}`, model: nextModel?.name }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        const hasContent = input.trim() || pendingImages.length > 0;
        if (!hasContent || !selectedModel || isLoading) return;

        const newMessage: Message = {
            role: "user",
            content: input,
            ...(pendingImages.length > 0 ? { images: [...pendingImages] } : {}),
        };
        const updatedMessages = [...messages, newMessage];
        setMessages(updatedMessages);
        setInput("");
        setPendingImages([]);
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
        }
        setIsLoading(true);

        try {
            await streamResponse(selectedModel.id, updatedMessages, selectedModel.name);
        } catch (error: any) {
            setMessages(prev => [...prev, { role: "assistant", content: `Error: ${error.message}`, model: selectedModel?.name }]);
        } finally {
            setIsLoading(false);
        }
    };

    const isLastAssistantStreaming = (index: number) => {
        return isLoading && index === messages.length - 1;
    };

    const isReasoningStreaming = (m: Message, index: number) => {
        return isLastAssistantStreaming(index) && !!m.reasoning && !m.content;
    };

    return (
        <div className="flex flex-col h-svh font-sans bg-[var(--chat-surface)] text-[var(--chat-text)] overflow-hidden">
            {/* Header */}
            <header className={cn(
                "sticky top-0 z-50 shrink-0 px-4 h-[56px] border-b border-black/5 dark:border-white/5 flex items-center justify-between",
                "bg-[var(--chat-surface)] dark:bg-background/95 backdrop-blur-md"
            )}>
                {mounted ? (
                    <>
                        {/* Placeholder for left side to keep model selector centered */}
                        <div className="w-10 shrink-0" />

                        {/* Centered Model Selector */}
                        <div className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center">
                            {/* Mobile Sheet (md:hidden) */}
                            <div className="md:hidden">
                                <Sheet>
                                    <SheetTrigger className={cn(
                                        "flex items-center gap-1.5 text-[20px] font-semibold focus:outline-none h-10",
                                        "text-[var(--chat-text)] dark:text-foreground"
                                    )}>
                                        {selectedModel?.name || "Select model"}
                                        <span className="material-symbols-rounded text-[24px]">expand_more</span>
                                    </SheetTrigger>
                                    <SheetContent side="bottom" className={cn(
                                        "rounded-t-3xl pb-10 border-t-0 px-4 max-h-[80vh] overflow-y-auto",
                                        "bg-[var(--chat-surface)] dark:bg-[#242424]"
                                    )}>
                                        <SheetHeader className="pb-4 pt-2">
                                            <SheetTitle className={cn(
                                                "text-center text-[22px] font-semibold",
                                                "text-[var(--chat-text)] dark:text-foreground"
                                            )}>Select a model</SheetTitle>
                                        </SheetHeader>
                                        <div className="flex flex-col gap-2">
                                            {[...models].sort((a, b) => (a.status === 'available' ? -1 : 1) - (b.status === 'available' ? -1 : 1)).map(m => (
                                                <SheetClose asChild key={m.id}>
                                                    <button
                                                        onClick={() => {
                                                            setSelectedModel(m);
                                                            localStorage.setItem("selected_model_id", m.id);
                                                        }}
                                                        className={cn(
                                                            "flex items-center justify-between w-full px-4 py-3 rounded-2xl transition-colors cursor-pointer text-left focus:outline-none",
                                                            selectedModel?.id === m.id
                                                                ? ("bg-black/5 dark:bg-[#333]")
                                                                : "bg-transparent hover:bg-black/5 dark:hover:bg-white/5",
                                                            "text-[var(--chat-text)] dark:text-foreground"
                                                        )}
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div className={cn(
                                                                "w-2.5 h-2.5 rounded-full",
                                                                m.status === 'available' ? "bg-green-500" :
                                                                    m.status === 'unavailable' ? "bg-red-500" :
                                                                        "bg-yellow-500"
                                                            )} />
                                                            <span className={cn(
                                                                "text-[17px] font-medium",
                                                                m.status !== 'available' && "opacity-60"
                                                            )}>{m.name}</span>
                                                        </div>
                                                        {selectedModel?.id === m.id && (
                                                            <span className="material-symbols-rounded text-[20px]">check</span>
                                                        )}
                                                    </button>
                                                </SheetClose>
                                            ))}
                                        </div>
                                    </SheetContent>
                                </Sheet>
                            </div>

                            {/* Desktop Selector (hidden md:flex) */}
                            <div className="hidden md:flex items-center">
                                <Select
                                    value={selectedModel?.id ?? ""}
                                    onValueChange={(id) => {
                                        const model = models.find(m => m.id === id) || null;
                                        setSelectedModel(model);
                                        if (model) localStorage.setItem("selected_model_id", model.id);
                                    }}
                                >
                                    <SelectTrigger className={cn(
                                        "w-auto max-w-[320px] h-10 border-transparent bg-transparent shadow-none hover:border-transparent focus:ring-0 text-[18px] font-semibold",
                                        "text-[var(--chat-text)] dark:text-foreground"
                                    )}>
                                        <SelectValue placeholder="Select model" />
                                    </SelectTrigger>
                                    <SelectContent className={cn(
                                        "bg-popover border-border dark:bg-[#242424] dark:border-[#333]"
                                    )}>
                                        {models.map(m => (
                                            <SelectItem key={m.id} value={m.id} className={cn(
                                                "cursor-pointer",
                                                "focus:bg-muted dark:focus:bg-[#2A2A2A]"
                                            )}>
                                                <div className="flex items-center gap-2">
                                                    <span className={cn(
                                                        "w-2 h-2 rounded-full shrink-0",
                                                        m.status === 'available' ? "bg-green-500" :
                                                            m.status === 'unavailable' ? "bg-red-500" :
                                                                "bg-yellow-500"
                                                    )} />
                                                    <span>{m.name}</span>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Right side Actions (Delete) */}
                        <div className="w-10 shrink-0 flex justify-end">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={handleClearChat}
                                className={cn(
                                    "h-10 w-10 rounded-full transition-opacity",
                                    messages.length === 0 ? "opacity-0 pointer-events-none" : "opacity-100",
                                    "bg-black/5 text-[var(--chat-text)] dark:bg-[#2A2A2A] dark:text-foreground"
                                )}
                            >
                                <span className="material-symbols-rounded text-[22px]">delete</span>
                            </Button>
                        </div>
                    </>
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <span className="text-[18px] font-semibold text-[var(--chat-text)] dark:text-foreground opacity-30">
                            Krutim
                        </span>
                    </div>
                )}
            </header>

            {/* Main Chat Area */}
            <main className="flex-1 flex flex-col overflow-hidden relative">
                <div className="flex-1 overflow-y-auto" ref={scrollRef}>
                    {messages.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center px-6 pb-40 text-center">
                            <div className="relative flex flex-col items-center gap-5">
                                <span className={"text-[var(--chat-text)] dark:text-foreground"}>
                                    <KrutimLogo size={48} />
                                </span>
                                <h2 className="text-3xl md:text-4xl font-bold text-[var(--chat-text)]">
                                    {getGreeting()}
                                </h2>
                            </div>
                        </div>
                    ) : (
                        <div className="max-w-3xl mx-auto w-full px-3 py-6 space-y-5 pb-52">
                            {messages.map((m, i) => (
                                <div key={i} className="animate-fade-in">
                                    {m.role === 'user' ? (
                                        /* User message */
                                        <div className="flex justify-end">
                                            <div className={cn(
                                                "inline-block p-3 md:p-4 rounded-2xl w-full space-y-2",
                                                "bg-[#F5F5F5] text-[#171717] dark:bg-[#2a2a2a] dark:text-[#EAEAEA]"
                                            )}>
                                                {/* Images */}
                                                {m.images && m.images.length > 0 && (
                                                    <div className="flex flex-wrap gap-2">
                                                        {m.images.map((img, imgIdx) => (
                                                            <img
                                                                key={imgIdx}
                                                                src={img}
                                                                alt={`Attached ${imgIdx + 1}`}
                                                                className="max-w-[200px] max-h-[200px] rounded-xl object-cover"
                                                            />
                                                        ))}
                                                    </div>
                                                )}
                                                {m.content && (
                                                    <div className="text-[15px] leading-relaxed break-words">
                                                        <MarkdownRenderer content={m.content} isDark={isDark} />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ) : (
                                        /* Assistant message */
                                        <div className="flex gap-3 items-start w-full">
                                            <div className={cn(
                                                "w-8 h-8 rounded-full items-center justify-center mt-1 shrink-0",
                                                "hidden",
                                                "bg-white border border-black/5 dark:bg-[#242424] dark:border dark:border-[#333]"
                                            )}>
                                                <span className={cn(
                                                    "material-symbols-rounded text-[16px]",
                                                    "text-[var(--chat-text)] dark:text-foreground"
                                                )}>smart_toy</span>
                                            </div>

                                            <div className="flex-1 min-w-0 space-y-1">
                                                {/* Thinking block */}
                                                {m.reasoning && (
                                                    <ThinkingBlock
                                                        reasoning={m.reasoning}
                                                        isStreaming={isReasoningStreaming(m, i)}
                                                        duration={m.reasoningDuration}
                                                        isDark={isDark}
                                                    />
                                                )}

                                                {/* Message content */}
                                                <div className="w-full">
                                                    {m.images && m.images.length > 0 && (
                                                        <div className="flex flex-wrap gap-2 mb-3">
                                                            {m.images.map((img, imgIdx) => (
                                                                <img
                                                                    key={imgIdx}
                                                                    src={img}
                                                                    alt={`Generated ${imgIdx + 1}`}
                                                                    className="max-w-[250px] max-h-[250px] rounded-xl object-cover border border-black/5 dark:border-white/10"
                                                                />
                                                            ))}
                                                        </div>
                                                    )}
                                                    {m.content ? (
                                                        <div className={cn(
                                                            "text-[15px] leading-relaxed",
                                                            "text-[var(--chat-text)] dark:text-foreground"
                                                        )}>
                                                            <MarkdownRenderer content={m.content} isDark={isDark} />
                                                        </div>
                                                    ) : (isLoading && i === messages.length - 1 && !m.reasoning ? (
                                                        <span className="inline-flex gap-1 py-2">
                                                            <span className="w-1.5 h-1.5 rounded-full animate-bounce bg-muted-foreground/50" style={{ animationDelay: '0ms' }} />
                                                            <span className="w-1.5 h-1.5 rounded-full animate-bounce bg-muted-foreground/50" style={{ animationDelay: '150ms' }} />
                                                            <span className="w-1.5 h-1.5 rounded-full animate-bounce bg-muted-foreground/50" style={{ animationDelay: '300ms' }} />
                                                        </span>
                                                    ) : null)}
                                                </div>

                                                {/* Action buttons */}
                                                {m.model && !isLastAssistantStreaming(i) && (
                                                    <p className={cn(
                                                        "text-[11px] mt-2 flex items-center gap-1",
                                                        "text-muted-foreground/60 dark:text-foreground/30"
                                                    )}>
                                                        <span className="material-symbols-rounded text-[14px]">smart_toy</span>
                                                        Prepared using {m.model}
                                                    </p>
                                                )}
                                                <div className="flex items-center gap-1 mt-1">
                                                    <button
                                                        onClick={() => handleRegenerate(i)}
                                                        disabled={isLoading}
                                                        className={cn(
                                                            "p-1.5 rounded-md transition-colors flex items-center justify-center",
                                                            isLoading ? "opacity-50 cursor-not-allowed" : ("hover:bg-black/5 text-muted-foreground hover:text-[var(--chat-text)] dark:hover:bg-[#2A2A2A] dark:text-foreground/40 dark:hover:text-foreground")
                                                        )}
                                                        title="Regenerate with a different model"
                                                    >
                                                        <span className="material-symbols-rounded text-[18px]">sync</span>
                                                    </button>
                                                    <button
                                                        onClick={() => handleCopy(m.content, i)}
                                                        className={cn(
                                                            "p-1.5 rounded-md transition-colors flex items-center justify-center",
                                                            "hover:bg-black/5 text-muted-foreground hover:text-[var(--chat-text)] dark:hover:bg-[#2A2A2A] dark:text-foreground/40 dark:hover:text-foreground"
                                                        )}
                                                        title="Copy message"
                                                    >
                                                        <span className="material-symbols-rounded text-[18px]">
                                                            {copiedIndex === i ? "check" : "content_copy"}
                                                        </span>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                            <div ref={messagesEndRef} className="h-4" />
                        </div>
                    )}
                </div>

                {/* Input Area */}
                <div className={cn(
                    "shrink-0 p-4 pb-[max(2rem,env(safe-area-inset-bottom)+1rem)] md:pb-6",
                    "bg-gradient-to-t from-[var(--chat-surface)] via-[var(--chat-surface)] to-transparent"
                )}>
                    <div className="max-w-3xl mx-auto w-full">
                        <form
                            onSubmit={handleSendMessage}
                            onDrop={handleDrop}
                            onDragOver={(e) => e.preventDefault()}
                            className={cn(
                                "flex flex-col rounded-[24px] border transition-all p-3 overflow-hidden",
                                "bg-[#F5F5F5] border-[#E5E5E5] focus-within:border-[#CCCCCC] dark:bg-[#2a2a2a] dark:border-[#333] dark:focus-within:border-[#555]"
                            )}
                        >
                            {/* Image previews */}
                            {pendingImages.length > 0 && (
                                <div className="flex flex-wrap gap-2 px-1 pb-2">
                                    {pendingImages.map((img, idx) => (
                                        <div key={idx} className="relative group">
                                            <img
                                                src={img}
                                                alt={`Preview ${idx + 1}`}
                                                className="w-16 h-16 rounded-xl object-cover"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => removeImage(idx)}
                                                className={cn(
                                                    "absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity",
                                                    "bg-[#333] text-white dark:bg-[#555] dark:text-white"
                                                )}
                                            >
                                                <span className="material-symbols-rounded text-[12px]">close</span>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <textarea
                                ref={textareaRef}
                                value={input}
                                onChange={(e) => {
                                    setInput(e.target.value);
                                    e.target.style.height = 'auto';
                                    e.target.style.height = `${Math.min(e.target.scrollHeight, 200)}px`;
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        const hasContent = input.trim() || pendingImages.length > 0;
                                        if (hasContent && !isLoading) {
                                            handleSendMessage(e as any);
                                        }
                                    }
                                }}
                                onPaste={handlePaste}
                                placeholder="Ask anything..."
                                data-gramm="false"
                                data-gramm_editor="false"
                                data-enable-grammarly="false"
                                className={cn(
                                    "w-full bg-transparent border-none focus-visible:ring-0 text-[16px] placeholder:text-[16px] px-2 py-1 resize-none outline-none min-h-[48px] max-h-[200px] overflow-y-auto",
                                    "placeholder:text-muted-foreground text-[var(--chat-text)] dark:placeholder:text-muted-foreground dark:text-foreground"
                                )}
                                disabled={isLoading}
                                rows={1}
                            />

                            {/* Hidden file input */}
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                multiple
                                className="hidden"
                                onChange={(e) => {
                                    if (e.target.files) handleImageFiles(e.target.files);
                                    e.target.value = "";
                                }}
                            />

                            <div className="flex items-center justify-between mt-1">
                                {/* Attach image button */}
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className={cn(
                                        "p-1.5 rounded-full transition-colors",
                                        "text-[#737373] hover:text-[#171717] dark:text-[#EAEAEA]/40 dark:hover:text-[#EAEAEA]/70"
                                    )}
                                    title="Attach image"
                                >
                                    <span className="material-symbols-rounded text-[20px]">add_photo_alternate</span>
                                </button>

                                <Button
                                    type="submit"
                                    size="icon"
                                    disabled={(!input.trim() && pendingImages.length === 0) || isLoading}
                                    className={cn(
                                        "h-10 w-10 shrink-0 rounded-full transition-all",
                                        (input.trim() || pendingImages.length > 0)
                                            ? ("bg-[#171717] hover:bg-[#333] text-white dark:bg-white dark:hover:bg-white/90 dark:text-black")
                                            : ("bg-[#E5E5E5] text-muted-foreground dark:bg-[#333] dark:text-muted-foreground"),
                                        isLoading && "opacity-50 cursor-not-allowed"
                                    )}
                                >
                                    <span className="material-symbols-rounded text-[20px]">
                                        arrow_upward
                                    </span>
                                </Button>
                            </div>
                        </form>

                        <p className="text-[10px] text-center mt-2 text-muted-foreground">
                            AI can make mistakes. Please check important information.
                        </p>
                    </div>
                </div>
            </main>
        </div>
    );
}
