"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Send, Bot, User, Loader2, AlertCircle, Trash2, Plus, BrainCircuit, Search, Mic, AudioLines, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
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
}

export default function ChatPage() {
    const [models, setModels] = useState<Model[]>([]);
    const [selectedModel, setSelectedModel] = useState<Model | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const savedChat = localStorage.getItem("current_chat_history");
        if (savedChat) {
            setMessages(JSON.parse(savedChat));
        }

        const fetchModels = async () => {
            const { data } = await supabase
                .from("models")
                .select("id, name, status, model_identifier")
                .order("name");
            if (data) {
                setModels(data);
                if (data.length > 0) setSelectedModel(data[0]);
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
    }, []);

    useEffect(() => {
        if (messages.length > 0) {
            localStorage.setItem("current_chat_history", JSON.stringify(messages));
        } else {
            localStorage.removeItem("current_chat_history");
        }
    }, [messages]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isLoading]);

    const handleClearChat = () => {
        setMessages([]);
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || !selectedModel || isLoading) return;

        const newMessage: Message = { role: "user", content: input };
        const updatedMessages = [...messages, newMessage];
        setMessages(updatedMessages);
        setInput("");
        setIsLoading(true);

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/chat`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
                },
                body: JSON.stringify({
                    model_id: selectedModel.id,
                    messages: updatedMessages.map(m => ({ role: m.role, content: m.content })),
                }),
            });

            if (!response.ok) throw new Error("Stream failed");

            const reader = response.body?.getReader();
            if (!reader) throw new Error("No reader");

            const decoder = new TextDecoder();
            let assistantMessage: Message = { role: "assistant", content: "", reasoning: "" };
            setMessages(prev => [...prev, assistantMessage]);

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value);
                const lines = chunk.split("\n");

                for (const line of lines) {
                    if (line.startsWith("data: ")) {
                        const dataStr = line.substring(6).trim();
                        if (dataStr === "[DONE]") break;
                        try {
                            const data = JSON.parse(dataStr);
                            const delta = data.choices[0].delta;
                            if (delta.content) assistantMessage.content += delta.content;
                            if (delta.reasoning_content) assistantMessage.reasoning = (assistantMessage.reasoning || "") + delta.reasoning_content;

                            setMessages(prev => {
                                const newMessages = [...prev];
                                newMessages[newMessages.length - 1] = { ...assistantMessage };
                                return newMessages;
                            });
                        } catch (e) { }
                    }
                }
            }
        } catch (error: any) {
            setMessages(prev => [...prev, { role: "assistant", content: `Error: ${error.message}` }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-screen bg-[#171717] text-[#ececec]">
            {/* Header with Model Selector */}
            <header className="p-4 flex items-center justify-between sticky top-0 z-20">
                <div className="flex items-center gap-1 group cursor-pointer hover:bg-white/5 transition-colors px-3 py-1.5 rounded-xl">
                    <span className="font-semibold text-lg">{selectedModel?.name || "ChatGPT"}</span>
                    <ChevronDown size={14} className="text-muted-foreground mt-0.5" />
                </div>

                <div className="flex items-center gap-3">
                    {messages.length > 0 && (
                        <Button variant="ghost" size="icon" onClick={handleClearChat} className="text-muted-foreground hover:bg-white/5">
                            <Trash2 size={18} />
                        </Button>
                    )}
                    <Select
                        value={selectedModel?.id}
                        onValueChange={(id) => setSelectedModel(models.find(m => m.id === id) || null)}
                    >
                        <SelectTrigger className="bg-transparent border-none focus:ring-0 text-xs w-[200px] h-8 text-muted-foreground hover:text-foreground">
                            <SelectValue placeholder="Switch model" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#212121] border-[#333] text-[#ececec]">
                            {models.map(m => (
                                <SelectItem key={m.id} value={m.id} className="focus:bg-white/5">{m.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </header>

            {/* Main Chat Area */}
            <main className="flex-1 flex flex-col relative overflow-hidden">
                <ScrollArea className="flex-1" ref={scrollRef}>
                    {messages.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center p-4">
                            <h2 className="text-4xl font-semibold mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">What's on the agenda today?</h2>
                        </div>
                    ) : (
                        <div className="max-w-3xl mx-auto w-full px-4 py-8 space-y-12 pb-32">
                            {messages.map((m, i) => (
                                <div key={i} className="flex gap-5 animate-in fade-in duration-500">
                                    <div className={cn("h-8 w-8 rounded-full flex items-center justify-center mt-1 border border-white/10 shadow-sm", m.role === 'user' ? "bg-white/90 text-black" : "bg-[#212121] text-white")}>
                                        {m.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                                    </div>
                                    <div className="flex-1 space-y-3">
                                        {m.reasoning && (
                                            <div className="bg-white/[0.03] rounded-2xl p-4 border border-white/10 text-sm text-[#b4b4b4] italic">
                                                <span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest mb-2 opacity-50 not-italic"><BrainCircuit size={12} /> Thinking...</span>
                                                <div className="whitespace-pre-wrap">{m.reasoning}</div>
                                            </div>
                                        )}
                                        <div className="text-[15.5px] leading-[1.7] whitespace-pre-wrap selection:bg-primary/30">
                                            {m.content || (isLoading && i === messages.length - 1 ? <span className="inline-block w-1.5 h-4 bg-white/40 animate-pulse translate-y-0.5 ml-1" /> : null)}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>

                {/* Floating Input Bar (ChatGPT Style) */}
                <div className="absolute bottom-8 left-0 right-0 px-4 flex justify-center pointer-events-none">
                    <form
                        onSubmit={handleSendMessage}
                        className="w-full max-w-[760px] pointer-events-auto bg-[#2f2f2f] rounded-[28px] border border-white/5 shadow-2xl flex items-center p-2.5 transition-all focus-within:ring-1 focus-within:ring-white/20"
                    >
                        <Button type="button" variant="ghost" size="icon" className="h-10 w-10 text-muted-foreground hover:bg-white/5 rounded-full shrink-0">
                            <Plus size={20} />
                        </Button>

                        <Input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Ask anything"
                            className="bg-transparent border-none focus-visible:ring-0 text-[16px] placeholder:text-muted-foreground/60 h-10 px-2"
                        />

                        <div className="flex items-center gap-1.5 shrink-0 pr-1">
                            <Button type="button" variant="ghost" size="icon" className="h-10 w-10 text-muted-foreground hover:bg-white/5 rounded-full">
                                <Mic size={20} />
                            </Button>
                            {input.trim() ? (
                                <Button type="submit" size="icon" className="h-10 w-10 rounded-full bg-white text-black hover:bg-[#ececec]">
                                    <Send size={18} />
                                </Button>
                            ) : (
                                <div className="h-10 w-10 bg-[#424242] text-[#171717] rounded-full flex items-center justify-center">
                                    <AudioLines size={18} />
                                </div>
                            )}
                        </div>
                    </form>
                </div>
            </main>

            {/* Footer Info */}
            <footer className="p-3 text-center">
                <p className="text-[11px] text-muted-foreground font-medium opacity-50">
                    ChatGPT can make mistakes. Check important info.
                </p>
            </footer>

            {/* Persistent New Chat Button (CTA) */}
            {!isLoading && messages.length > 0 && (
                <div className="fixed bottom-24 right-8 animate-in zoom-in duration-500">
                    <Button variant="outline" className="bg-[#2f2f2f] border-white/10 text-white rounded-full px-6 py-6 h-auto shadow-2xl hover:bg-[#383838] group" onClick={handleClearChat}>
                        <Plus size={18} className="mr-2 group-hover:rotate-90 transition-transform" />
                        New Chat
                    </Button>
                </div>
            )}
        </div>
    );
}
