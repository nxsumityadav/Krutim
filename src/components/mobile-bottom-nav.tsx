"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "@/components/theme-provider";
import { useChatState } from "@/components/chat-state-provider";
import { cn } from "@/lib/utils";

const navItems = [
    { href: "/chat", label: "Home", icon: "home" },
    { href: "/models", label: "Status", icon: "memory" },
    { href: "/settings", label: "Settings", icon: "settings" },
];

export function MobileBottomNav() {
    const pathname = usePathname();
    const { resolvedTheme } = useTheme();
    const { isActiveChat } = useChatState();
    const [mounted, setMounted] = React.useState(false);

    React.useEffect(() => {
        setMounted(true);
    }, []);

    const isDark = mounted ? resolvedTheme === "dark" : false;

    // Hide when user is in an active chat (has messages)
    if (isActiveChat && pathname === "/chat") return null;

    return (
        <nav
            className={cn(
                "fixed bottom-0 left-0 right-0 z-50 md:hidden",
                "flex items-end justify-around",
                "pb-[env(safe-area-inset-bottom)]",
                isDark
                    ? "bg-[#1A1A1A] border-t border-[#2A2A2A]"
                    : "bg-white border-t border-[#E5E5E5]"
            )}
        >
            {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                            "flex flex-col items-center justify-center gap-0.5 py-2.5 px-4 min-w-[72px] transition-colors",
                            isActive
                                ? (isDark ? "text-[#EAEAEA]" : "text-[#171717]")
                                : (isDark ? "text-[#EAEAEA]/40" : "text-[#171717]/40")
                        )}
                    >
                        <span
                            className={cn(
                                "material-symbols-rounded text-[24px]",
                                isActive && "font-variation-settings: 'FILL' 1"
                            )}
                            style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}
                        >
                            {item.icon}
                        </span>
                        <span className="text-[10px] font-medium leading-tight">
                            {item.label}
                        </span>
                    </Link>
                );
            })}
        </nav>
    );
}
