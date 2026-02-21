"use client";

import React, { createContext, useContext, useState } from "react";

interface ChatStateContextType {
    isActiveChat: boolean;
    setIsActiveChat: (active: boolean) => void;
}

const ChatStateContext = createContext<ChatStateContextType>({
    isActiveChat: false,
    setIsActiveChat: () => {},
});

export function ChatStateProvider({ children }: { children: React.ReactNode }) {
    const [isActiveChat, setIsActiveChat] = useState(false);
    return (
        <ChatStateContext.Provider value={{ isActiveChat, setIsActiveChat }}>
            {children}
        </ChatStateContext.Provider>
    );
}

export function useChatState() {
    return useContext(ChatStateContext);
}
