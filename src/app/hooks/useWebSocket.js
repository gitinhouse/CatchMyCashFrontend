// src/hooks/useWebSocket.js
import { useState, useEffect, useRef } from "react";

export function useWebSocket(wsUrl, shouldConnect = true) {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [message, setMessage] = useState(null);
  const socketRef = useRef(null);

  useEffect(() => {
    if (!shouldConnect) return;
    const url =
      wsUrl ||
      (process.env.NEXT_PUBLIC_WS_URL
        ? process.env.NEXT_PUBLIC_WS_URL
        : "ws://localhost:7071");

    const ws = new WebSocket(url);
    socketRef.current = ws;
    setSocket(ws);

    ws.onopen = () => {
      setIsConnected(true);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setMessage(data);
      } catch (err) {
        console.error(" Failed to parse message:", err);
      }
    };

    ws.onclose = () => {
      console.log(" WebSocket closed");
      setIsConnected(false);
    };

    ws.onerror = (err) => {
      console.error(" WebSocket error:", err);
    };

    return () => {
      ws.close(1000, "component unmounted");
    };
  }, [wsUrl, shouldConnect]);

  const sendMessage = (data) => {
    if (socketRef.current && socketRef.current.readyState === 1) {
      socketRef.current.send(JSON.stringify(data));
    } else {
      console.warn(" Cannot send message — socket not open");
    }
  };

  return { socket, isConnected, message, sendMessage };
}
