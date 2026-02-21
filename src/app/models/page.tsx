"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckCircle2, XCircle, Clock, Activity, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface Model {
    id: string;
    name: string;
    status: "available" | "unavailable" | "unknown";
    last_checked: string;
    response_time_ms: number;
    error_message?: string;
    model_identifier: string;
}

export default function ModelsStatusPage() {
    const [models, setModels] = useState<Model[]>([]);

    useEffect(() => {
        const fetchModels = async () => {
            const { data, error } = await supabase
                .from("models")
                .select("*")
                .order("name");
            if (data) setModels(data);
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
        <div className="p-8 max-w-7xl mx-auto">
            <div className="flex flex-col mb-8">
                <h1 className="text-3xl font-bold tracking-tight">Models Status</h1>
                <p className="text-muted-foreground">Monitor the availability and performance of all registered AI models.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <Card className="bg-card/50 backdrop-blur-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium uppercase tracking-wider opacity-60">Total Models</CardTitle>
                        <Activity className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{models.length}</div>
                    </CardContent>
                </Card>
                <Card className="bg-card/50 backdrop-blur-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium uppercase tracking-wider opacity-60">Available</CardTitle>
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-500">
                            {models.filter(m => m.status === 'available').length}
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-card/50 backdrop-blur-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium uppercase tracking-wider opacity-60">Unavailable</CardTitle>
                        <XCircle className="h-4 w-4 text-destructive" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-destructive">
                            {models.filter(m => m.status === 'unavailable').length}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card className="border-muted bg-card/30">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Model Name</TableHead>
                                <TableHead>Identifier</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Latency</TableHead>
                                <TableHead>Last Checked</TableHead>
                                <TableHead>Error Message</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {models.map((model) => (
                                <TableRow key={model.id} className="hover:bg-muted/30">
                                    <TableCell className="font-semibold">{model.name}</TableCell>
                                    <TableCell className="font-mono text-xs opacity-60">{model.model_identifier}</TableCell>
                                    <TableCell>
                                        <Badge variant={model.status === 'available' ? 'default' : 'destructive'}
                                            className={cn(
                                                "capitalize",
                                                model.status === 'available' ? 'bg-green-500/20 text-green-500 hover:bg-green-500/30' :
                                                    model.status === 'unavailable' ? 'bg-red-500/20 text-red-500 hover:bg-red-500/30' :
                                                        'bg-yellow-500/20 text-yellow-500 hove:bg-yellow-500/30'
                                            )}>
                                            {model.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Clock size={14} className="opacity-40" />
                                            {model.response_time_ms}ms
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-sm opacity-60">
                                        {model.last_checked ? new Date(model.last_checked).toLocaleString() : 'Never'}
                                    </TableCell>
                                    <TableCell className="max-w-[200px] truncate text-xs text-destructive">
                                        {model.error_message || '-'}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </Card>
        </div>
    );
}
