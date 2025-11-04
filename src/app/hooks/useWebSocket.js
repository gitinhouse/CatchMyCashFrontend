// src/hooks/useWebSocket.js
import { useState, useEffect, useRef } from "react";

export function useWebSocket(wsUrl, shouldConnect = true) {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [message, setMessage] = useState(null);
  const socketRef = useRef(null);

  useEffect(() => {
    if (!shouldConnect) return;

    // ✅ Auto-pick WS URL from env or fallback
    const url =
      wsUrl ||
      process.env.NEXT_PUBLIC_WS_URL ||
      (process.env.NODE_ENV === "production"
        ? "wss://stack.brstdev.com:6045"
        : "ws://localhost:6045");

    console.log("🔌 Connecting to WebSocket:", url);

    const ws = new WebSocket(url);
    socketRef.current = ws;
    setSocket(ws);

    ws.onopen = () => setIsConnected(true);
    ws.onmessage = (event) => {
      try {
        setMessage(JSON.parse(event.data));
      } catch {
        console.warn("Non-JSON message received");
      }
    };
    ws.onclose = () => setIsConnected(false);
    ws.onerror = (err) => console.error("WebSocket error:", err);

    return () => ws.close(1000, "component unmounted");
  }, [wsUrl, shouldConnect]);

  const sendMessage = (data) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(data));
    } else {
      console.warn("Cannot send — socket not open");
    }
  };

  return { socket, isConnected, message, sendMessage };
}
