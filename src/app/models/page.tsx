"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/components/theme-provider";
import { cn } from "@/lib/utils";

interface Model {
    id: string;
    name: string;
    base_url: string;
    api_key?: string;
    status: "available" | "unavailable" | "unknown";
    last_checked: string;
    response_time_ms: number;
    error_message?: string;
    model_identifier: string;
    created_at?: string;
}

function timeAgo(dateStr: string): string {
    if (!dateStr) return "—";
    const now = Date.now();
    const then = new Date(dateStr).getTime();
    const diffSec = Math.floor((now - then) / 1000);
    if (diffSec < 60) return `${diffSec}s ago`;
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    const diffDay = Math.floor(diffHr / 24);
    return `${diffDay}d ago`;
}

export default function ModelsStatusPage() {
    const [models, setModels] = useState<Model[]>([]);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [mounted, setMounted] = useState(false);
    const { resolvedTheme } = useTheme();

    useEffect(() => {
        setMounted(true);
    }, []);

    const isDark = mounted ? resolvedTheme === "dark" : false;

    const available = models.filter(m => m.status === "available").length;
    const unavailable = models.filter(m => m.status === "unavailable").length;
    const unknown = models.filter(m => m.status !== "available" && m.status !== "unavailable").length;
    const total = models.length;
    const pct = total > 0 ? (available / total) * 100 : 0;

    useEffect(() => {
        const fetchModels = async () => {
            const { data } = await supabase
                .from("models")
                .select("*");
            if (data) {
                const sorted = [...data].sort((a, b) => {
                    if (a.status === "available" && b.status !== "available") return -1;
                    if (a.status !== "available" && b.status === "available") return 1;
                    return (a.name || a.model_identifier || "").localeCompare(b.name || b.model_identifier || "");
                });
                setModels(sorted);
            }
        };

        fetchModels();

        const channel = supabase
            .channel("model-dashboard-updates")
            .on(
                "postgres_changes",
                { event: "UPDATE", schema: "public", table: "models" },
                (payload) => {
                    setModels((current) =>
                        current.map((m) =>
                            m.id === payload.new.id ? (payload.new as Model) : m
                        )
                    );
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    return (
        <div className={cn(
            "min-h-[100svh] p-4 md:p-8 pb-24 md:pb-8",
            "bg-white text-[#171717] dark:bg-[#1A1A1A] dark:text-[#EAEAEA]"
        )}>
            <div className="max-w-2xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-bold tracking-tight">Models Status</h1>
                </div>

                {/* Availability Card */}
                <div className={cn(
                    "rounded-2xl p-5 space-y-4",
                    "bg-[#FAFAFA] border border-[#E5E5E5] dark:bg-[#242424] dark:border dark:border-[#333]"
                )}>
                    <h2 className={cn(
                        "text-[15px] font-medium",
                        "text-[#737373] dark:text-[#EAEAEA]/60"
                    )}>Availability</h2>

                    <div className="flex items-center justify-between">
                        <span className={cn(
                            "text-[15px]",
                            "text-[#737373] dark:text-[#EAEAEA]/60"
                        )}>Active Models</span>
                        <span className="text-xl font-bold">{available}/{total}</span>
                    </div>

                    {/* Progress bar */}
                    <div className={cn(
                        "w-full h-2 rounded-full overflow-hidden",
                        "bg-[#E5E5E5] dark:bg-[#333]"
                    )}>
                        <div
                            className={cn(
                                "h-full rounded-full transition-all duration-500 ease-out",
                                "bg-[#171717] dark:bg-[#EAEAEA]"
                            )}
                            style={{ width: `${pct}%` }}
                        />
                    </div>

                    {/* Legend pills */}
                    <div className="flex gap-2 flex-wrap">
                        <Badge variant="outline" className={cn(
                            "text-[11px] py-0.5 px-2.5 rounded-full font-medium",
                            "bg-green-500/10 border-green-500/20",
                            "text-green-600 dark:text-green-400"
                        )}>
                            Ready {available}
                        </Badge>
                        <Badge variant="outline" className={cn(
                            "text-[11px] py-0.5 px-2.5 rounded-full font-medium",
                            "bg-red-500/10 border-red-500/20",
                            "text-red-500 dark:text-red-400"
                        )}>
                            Offline {unavailable}
                        </Badge>
                        {unknown > 0 && (
                            <Badge variant="outline" className={cn(
                                "text-[11px] py-0.5 px-2.5 rounded-full font-medium",
                                "bg-yellow-500/10 border-yellow-500/20",
                                "text-yellow-600 dark:text-yellow-400"
                            )}>
                                Unknown {unknown}
                            </Badge>
                        )}
                    </div>
                </div>

                {/* Model list */}
                <div className="space-y-2">
                    {models.map((model) => {
                        const isExpanded = expandedId === model.id;
                        return (
                            <div
                                key={model.id}
                                className={cn(
                                    "rounded-2xl transition-colors overflow-hidden",
                                    "bg-[#FAFAFA] border border-[#E5E5E5] dark:bg-[#242424] dark:border dark:border-[#333]"
                                )}
                            >
                                {/* Main row — clickable to expand */}
                                <button
                                    onClick={() => setExpandedId(isExpanded ? null : model.id)}
                                    className="flex items-center justify-between px-4 py-3.5 w-full text-left cursor-pointer"
                                >
                                    <div className="flex items-center gap-3 min-w-0 flex-1">
                                        <div className={cn(
                                            "w-2.5 h-2.5 rounded-full shrink-0",
                                            model.status === "available" ? "bg-green-500" :
                                                model.status === "unavailable" ? "bg-red-500" :
                                                    "bg-yellow-500"
                                        )} />
                                        <div className="min-w-0 flex-1">
                                            <p className={cn(
                                                "text-[15px] font-medium truncate",
                                                model.status !== "available" && "opacity-60"
                                            )}>{model.name || model.model_identifier || model.id}</p>
                                            <p className={cn(
                                                "text-[12px] font-mono truncate",
                                                "text-[#737373]/60 dark:text-[#EAEAEA]/30"
                                            )}>{model.model_identifier || "—"}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 shrink-0 ml-3">
                                        {model.response_time_ms > 0 && (
                                            <span className={cn(
                                                "text-[12px]",
                                                "text-[#737373] dark:text-[#EAEAEA]/40"
                                            )}>{model.response_time_ms}ms</span>
                                        )}
                                        <Badge
                                            className={cn(
                                                "capitalize text-[11px] px-2 py-0.5 rounded-full font-medium border-0",
                                                model.status === "available"
                                                    ? ("bg-green-500/10 text-green-600 dark:bg-green-500/10 dark:text-green-400")
                                                    : model.status === "unavailable"
                                                        ? ("bg-red-500/10 text-red-500 dark:bg-red-500/10 dark:text-red-400")
                                                        : ("bg-yellow-500/10 text-yellow-600 dark:bg-yellow-500/10 dark:text-yellow-400")
                                            )}
                                        >
                                            {model.status === "available" ? "Ready" : model.status === "unavailable" ? "Offline" : "Unknown"}
                                        </Badge>
                                        <span className={cn(
                                            "material-symbols-rounded text-[18px] transition-transform duration-200",
                                            isExpanded && "rotate-180",
                                            "text-[#737373]/50 dark:text-[#EAEAEA]/30"
                                        )}>expand_more</span>
                                    </div>
                                </button>

                                {/* Expanded details */}
                                {isExpanded && (
                                    <div className={cn(
                                        "px-4 pb-4 pt-1 space-y-2.5",
                                        "border-t border-[#E5E5E5] dark:border-t dark:border-[#333]"
                                    )}>
                                        {/* Detail rows */}
                                        <DetailRow label="Model ID" value={model.model_identifier} isDark={isDark} mono />
                                        <DetailRow label="Response Time" value={model.response_time_ms > 0 ? `${model.response_time_ms}ms` : "—"} isDark={isDark} />
                                        <DetailRow label="Last Checked" value={model.last_checked ? timeAgo(model.last_checked) : "—"} isDark={isDark} />
                                        <DetailRow label="Created" value={model.created_at ? new Date(model.created_at).toLocaleDateString() : "—"} isDark={isDark} />

                                        {/* Error message */}
                                        {model.error_message && (
                                            <div className="pt-1">
                                                <p className={cn(
                                                    "text-[11px] font-medium mb-1.5",
                                                    "text-red-500 dark:text-red-400"
                                                )}>Error</p>
                                                <div className={cn(
                                                    "text-[12px] font-mono leading-relaxed p-3 rounded-xl break-all whitespace-pre-wrap",
                                                    "bg-white text-[#737373] dark:bg-[#1A1A1A] dark:text-[#EAEAEA]/60"
                                                )}>
                                                    {model.error_message}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

function DetailRow({ label, value, isDark, mono }: { label: string; value: string; isDark: boolean; mono?: boolean }) {
    return (
        <div className="flex items-start justify-between gap-4">
            <span className={cn(
                "text-[12px] shrink-0",
                "text-[#737373] dark:text-[#EAEAEA]/40"
            )}>{label}</span>
            <span className={cn(
                "text-[12px] text-right break-all min-w-0",
                mono && "font-mono",
                "text-[#171717]/70 dark:text-[#EAEAEA]/70"
            )}>{value || "—"}</span>
        </div>
    );
}
