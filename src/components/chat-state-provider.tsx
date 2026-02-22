"use client";

import React, { createContext, useContext, useState } from "react";

interface ChatStateContextType {
    isActiveChat: boolean;
    setIsActiveChat: (active: boolean) => void;
    currentSessionId: string | null;
    setCurrentSessionId: (id: string | null) => void;
}

const ChatStateContext = createContext<ChatStateContextType>({
    isActiveChat: false,
    setIsActiveChat: () => { },
    currentSessionId: null,
    setCurrentSessionId: () => { },
});

export function ChatStateProvider({ children }: { children: React.ReactNode }) {
    const [isActiveChat, setIsActiveChat] = useState(false);
    const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

    return (
        <ChatStateContext.Provider value={{
            isActiveChat, setIsActiveChat,
            currentSessionId, setCurrentSessionId
        }}>
            {children}
        </ChatStateContext.Provider>
    );
}

export function useChatState() {
    return useContext(ChatStateContext);
}
