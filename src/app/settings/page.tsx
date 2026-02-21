"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useTheme } from "@/components/theme-provider";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
    const [autoCheck, setAutoCheck] = useState<boolean>(true);
    const [loading, setLoading] = useState(true);
    const [mounted, setMounted] = useState(false);
    const { theme, setTheme, resolvedTheme } = useTheme();

    useEffect(() => {
        setMounted(true);
    }, []);

    const isDark = mounted ? resolvedTheme === "dark" : false;

    useEffect(() => {
        const fetchConfig = async () => {
            const { data } = await supabase
                .from("app_config")
                .select("value")
                .eq("key", "auto_check_enabled")
                .single();

            if (data) {
                setAutoCheck(data.value === true);
            }
            setLoading(false);
        };

        fetchConfig();
    }, []);

    const handleToggle = async (checked: boolean) => {
        setAutoCheck(checked);
        await supabase
            .from("app_config")
            .update({ value: checked })
            .eq("key", "auto_check_enabled");
    };

    const themeOptions = [
        { value: "light", label: "Light", icon: "light_mode" },
        { value: "dark", label: "Dark", icon: "dark_mode" },
        { value: "auto", label: "Auto", icon: "contrast" },
    ] as const;

    return (
        <div className={cn(
            "min-h-[100svh] p-4 md:p-8 pb-24 md:pb-8",
            isDark ? "bg-background text-foreground" : "bg-[var(--chat-surface)] text-[var(--chat-text)]"
        )}>
            <div className="max-w-2xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center gap-3">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
                        <p className={cn(
                            "text-[14px] mt-1",
                            isDark ? "text-foreground/50" : "text-muted-foreground"
                        )}>Manage your preferences.</p>
                    </div>
                </div>

                {/* Appearance */}
                <div className={cn(
                    "rounded-2xl p-5 space-y-4",
                    isDark ? "bg-[#242424] border border-[#333]" : "bg-white border border-black/5"
                )}>
                    <h2 className="text-[15px] font-semibold">Appearance</h2>
                    <div className="grid grid-cols-3 gap-3">
                        {themeOptions.map((option) => (
                            <button
                                key={option.value}
                                onClick={() => setTheme(option.value)}
                                className={cn(
                                    "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
                                    theme === option.value
                                        ? "border-blue-500 bg-blue-500/5 dark:bg-blue-500/15"
                                        : isDark
                                            ? "border-[#333] bg-transparent hover:border-[#444]"
                                            : "border-black/5 bg-transparent hover:border-black/15"
                                )}
                            >
                                <span className={cn(
                                    "material-symbols-rounded text-[22px]",
                                    theme === option.value
                                        ? "text-blue-500"
                                        : isDark ? "text-foreground/50" : "text-muted-foreground"
                                )}>{option.icon}</span>
                                <span className={cn(
                                    "text-[13px] font-medium",
                                    theme === option.value
                                        ? "text-blue-500"
                                        : isDark ? "text-foreground/60" : "text-muted-foreground"
                                )}>{option.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Monitoring */}
                <div className={cn(
                    "rounded-2xl p-5 space-y-4",
                    isDark ? "bg-[#242424] border border-[#333]" : "bg-white border border-black/5"
                )}>
                    <h2 className="text-[15px] font-semibold">System Monitoring</h2>

                    <div className={cn(
                        "flex items-center justify-between p-4 rounded-xl",
                        isDark ? "bg-[#1a1a1a] border border-[#333]" : "bg-gray-50 border border-black/5"
                    )}>
                        <div className="space-y-0.5 pr-4">
                            <Label htmlFor="auto-check" className="text-[14px] font-medium">
                                Auto Health Checks
                            </Label>
                            <p className={cn(
                                "text-[12px]",
                                isDark ? "text-foreground/40" : "text-muted-foreground"
                            )}>
                                Monitor model availability automatically.
                            </p>
                        </div>
                        <Switch
                            id="auto-check"
                            checked={autoCheck}
                            onCheckedChange={handleToggle}
                            disabled={loading}
                        />
                    </div>

                    <div className={cn(
                        "flex items-start gap-2.5 p-3.5 rounded-xl text-[12px]",
                        isDark ? "bg-white/5 text-foreground/60" : "bg-black/[0.03] text-[var(--chat-text)]/70"
                    )}>
                        <span className="material-symbols-rounded text-[16px] mt-0.5 shrink-0">info</span>
                        <p className="leading-relaxed">
                            Frequent checks may impact rate limits of certain providers.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
