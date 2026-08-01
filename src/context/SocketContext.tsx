import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { io, Socket } from "socket.io-client";
import { getApiBaseUrl } from "@/utils/api";

interface SocketContextType {
    socket: Socket | null;
    isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({
    socket: null,
    isConnected: false,
});

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }: { children: ReactNode }) => {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        let socketServerOrigin = "";
        try {
            const apiBase = getApiBaseUrl();
            if (apiBase) {
                socketServerOrigin = new URL(apiBase).origin;
            } else {
                socketServerOrigin = window.location.origin;
            }
        } catch (error) {
            console.error("[SocketContext] Failed to parse API base URL, falling back to window origin:", error);
            socketServerOrigin = window.location.origin;
        }

        const socketInstance = io(socketServerOrigin, {
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
            transports: ['websocket', 'polling'], // Force try websocket first
            withCredentials: true
        });

        socketInstance.on("connect", () => {
            setIsConnected(true);
            console.log("[SocketContext] Connected to server:", socketInstance.id);
        });

        socketInstance.on("connect_error", (error) => {
            console.error("[SocketContext] Connection Error:", error.message);
            setIsConnected(false);
        });

        socketInstance.on("disconnect", () => {
            setIsConnected(false);
            console.log("[SocketContext] Disconnected from server.");
        });

        setSocket(socketInstance);

        return () => {
            socketInstance.disconnect();
        };
    }, []);

    return (
        <SocketContext.Provider value={{ socket, isConnected }}>
            {children}
        </SocketContext.Provider>
    );
};
