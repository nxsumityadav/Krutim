"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "@/components/theme-provider";
import { KrutimLogo } from "@/components/krutim-logo";

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

export function AppSidebar() {
    const pathname = usePathname();
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === "dark";

    return (
        <Sidebar variant="inset" collapsible="icon" className="border-r border-border bg-sidebar">
            <SidebarHeader className="p-4">
                <div className="flex items-center gap-3 px-2 py-1">
                    <span className={isDark ? "text-foreground" : "text-[var(--chat-text)]"}>
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
                                        <span className="material-symbols-rounded text-[20px]">chat</span>
                                        <span>Home</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                            <SidebarMenuItem>
                                <SidebarMenuButton asChild isActive={pathname === "/models"}>
                                    <Link href="/models">
                                        <span className="material-symbols-rounded text-[20px]">memory</span>
                                        <span>Model Status</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                            <SidebarMenuItem>
                                <SidebarMenuButton asChild isActive={pathname === "/settings"}>
                                    <Link href="/settings">
                                        <span className="material-symbols-rounded text-[20px]">settings</span>
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
