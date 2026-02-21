"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Settings as SettingsIcon, ShieldCheck, Zap } from "lucide-react";

export default function SettingsPage() {
    const [autoCheck, setAutoCheck] = useState<boolean>(true);
    const [loading, setLoading] = useState(true);

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

    return (
        <div className="p-8 max-w-2xl mx-auto">
            <div className="flex items-center gap-3 mb-8">
                <div className="p-2 rounded-xl bg-primary/10 text-primary">
                    <SettingsIcon size={24} />
                </div>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
                    <p className="text-muted-foreground">Manage your application preferences and system behavior.</p>
                </div>
            </div>

            <div className="space-y-6">
                <Card className="border-muted bg-card/30 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <ShieldCheck className="text-primary" size={20} />
                            System Monitoring
                        </CardTitle>
                        <CardDescription>
                            Configure how the system handles background model health checks.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center justify-between p-4 rounded-lg border border-muted bg-background/50">
                            <div className="space-y-1">
                                <Label htmlFor="auto-check" className="text-base font-semibold">Automatic Health Checks</Label>
                                <p className="text-sm text-muted-foreground pr-8">
                                    Continuously monitor models for availability. If disabled, the status will remain static until manually refreshed.
                                </p>
                            </div>
                            <Switch
                                id="auto-check"
                                checked={autoCheck}
                                onCheckedChange={handleToggle}
                                disabled={loading}
                            />
                        </div>

                        <div className="flex items-start gap-3 p-4 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-400">
                            <Zap size={18} className="mt-0.5 shrink-0" />
                            <p className="text-xs leading-relaxed">
                                Note: Frequent health checks may impact rate limits of certain providers (like the "Thinking" models).
                                Enabling this will trigger a check every 60 minutes as per current schedule.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
