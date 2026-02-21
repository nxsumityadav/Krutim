"use client";

import * as React from "react";
import { MessageSquare, LayoutDashboard, Settings, Activity, CheckCircle2, XCircle } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarGroup,
    SidebarGroupLabel,
    SidebarGroupContent,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function AppSidebar() {
    const pathname = usePathname();

    return (
        <Sidebar variant="inset" collapsible="icon">
            <SidebarHeader className="p-4">
                <div className="flex items-center gap-2 px-2 py-1">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                        <MessageSquare className="h-5 w-5" />
                    </div>
                    <span className="text-xl font-bold tracking-tight">AI Chat</span>
                </div>
            </SidebarHeader>

            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel>Menu</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            <SidebarMenuItem>
                                <SidebarMenuButton asChild isActive={pathname === "/chat"}>
                                    <Link href="/chat">
                                        <MessageSquare size={18} />
                                        <span>Chat</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                            <SidebarMenuItem>
                                <SidebarMenuButton asChild isActive={pathname === "/models"}>
                                    <Link href="/models">
                                        <LayoutDashboard size={18} />
                                        <span>Models Status</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>

                <SidebarGroup className="mt-6">
                    <SidebarGroupLabel>Availability</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <div className="px-4 py-2">
                            <ModelStatusCounter />
                        </div>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>

            <SidebarFooter className="p-4">
                <Button variant="outline" className="w-full justify-start gap-2 h-10 px-3" asChild>
                    <Link href="/settings">
                        <Settings size={18} />
                        <span>Settings</span>
                    </Link>
                </Button>
            </SidebarFooter>
        </Sidebar>
    );
}

function ModelStatusCounter() {
    const [stats, setStats] = useState({ available: 0, total: 0 });

    useEffect(() => {
        const fetchStats = async () => {
            const { data } = await supabase.from('models').select('status');
            if (data) {
                setStats({
                    available: data.filter(m => m.status === 'available').length,
                    total: data.length
                });
            }
        };

        fetchStats();

        const channel = supabase
            .channel('sidebar-stats')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'models' }, fetchStats)
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, []);

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2 text-muted-foreground">
                    <Activity size={14} className="text-primary" />
                    Active Models
                </span>
                <span className="font-bold">{stats.available}/{stats.total}</span>
            </div>
            <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                <div
                    className="bg-primary h-full transition-all duration-500 ease-in-out"
                    style={{ width: `${(stats.available / stats.total) * 100}%` }}
                />
            </div>
            <div className="flex gap-2">
                <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20 text-[10px] py-0 h-5 px-1.5">
                    <CheckCircle2 size={10} className="mr-1" /> Ready
                </Badge>
                <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20 text-[10px] py-0 h-5 px-1.5">
                    <XCircle size={10} className="mr-1" /> Offline
                </Badge>
            </div>
        </div>
    );
}
