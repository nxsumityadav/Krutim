"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "@/components/theme-provider";
import { KrutimLogo } from "@/components/krutim-logo";
import { MessageSquare, Bot, Settings } from "lucide-react";

import {
    Sidebar,
    SidebarContent,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarGroup,
    SidebarGroupContent,
} from "@/components/ui/sidebar";
import { useIsMobile } from "@/hooks/use-mobile";

export function AppSidebar() {
    const pathname = usePathname();

    const isMobile = useIsMobile();
    if (isMobile) return null;

    return (
        <Sidebar variant="inset" collapsible="icon" className="border-r border-border bg-sidebar">
            <SidebarHeader className="p-4">
                <div className="flex items-center gap-3 px-2 py-1">
                    <span className="text-[var(--chat-text)] dark:text-foreground">
                        <KrutimLogo size={24} />
                    </span>
                    <span className="text-xl font-bold tracking-tight">Krutim</span>
                </div>
            </SidebarHeader>

            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            <SidebarMenuItem>
                                <SidebarMenuButton asChild isActive={pathname === "/chat"}>
                                    <Link href="/chat">
                                        <MessageSquare className="w-5 h-5" />
                                        <span>Home</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                            <SidebarMenuItem>
                                <SidebarMenuButton asChild isActive={pathname === "/models"}>
                                    <Link href="/models">
                                        <Bot className="w-5 h-5" />
                                        <span>Model Status</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                            <SidebarMenuItem>
                                <SidebarMenuButton asChild isActive={pathname === "/settings"}>
                                    <Link href="/settings">
                                        <Settings className="w-5 h-5" />
                                        <span>Settings</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
        </Sidebar>
    );
}
