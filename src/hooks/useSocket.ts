import { useEffect, useState } from "react";
import { connectSocket, disconnectSocket, getSocket } from "@/sockets/socketClient";
import { useAuth } from "@/hooks/useAuth";

/**
 * Owns the lifecycle of the shared socket: connects when a session exists and
 * tears the connection down on logout.
 */
export function useSocket() {
  const { isAuthenticated } = useAuth();
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      disconnectSocket();
      setIsConnected(false);
      return;
    }

    const socket = connectSocket();
    if (!socket) return;

    setIsConnected(socket.connected);
    const onConnect = () => setIsConnected(true);
    const onDisconnect = () => setIsConnected(false);

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
    };
  }, [isAuthenticated]);

  return { socket: getSocket(), isConnected };
}
