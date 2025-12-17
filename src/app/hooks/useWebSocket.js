"use client";
// src/hooks/useWebSocket.js
import { useState, useEffect, useRef, useCallback } from "react";

export function useWebSocket(wsUrl, shouldConnect = true) {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const socketRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);

  const MAX_RECONNECT_ATTEMPTS = 10;
  const RECONNECT_DELAY = 8000;

  const getWebSocketUrl = useCallback(() => {
    // If custom URL is provided, use it
    if (wsUrl) return wsUrl;

    // Auto-detect from window.location
    if (typeof window !== "undefined") {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const host = window.location.host;
      return `${protocol}//${host}/api/ws`; // ✅ Use /api/ws path
    }

    // Fallback
    return (
      process.env.NEXT_PUBLIC_WS_URL ||
      (process.env.NODE_ENV === "production"
        ? "wss://fetchmydollars.com/api/ws"
        : "ws://localhost:6045/api/ws")
    );
  }, [wsUrl]);

  const connect = useCallback(() => {
    if (!shouldConnect) return;

    const url = getWebSocketUrl();
    console.log("🔌 Connecting to WebSocket:", url);

    try {
      const ws = new WebSocket(url);
      socketRef.current = ws;
      setSocket(ws);

      ws.onopen = () => {
        console.log("✅ WebSocket connected");
        setIsConnected(true);
        setError(null);
        reconnectAttemptsRef.current = 0;
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          setMessage(data);
        } catch (err) {
          console.warn("Non-JSON message received:", event.data);
          setMessage(event.data);
        }
      };

      ws.onclose = (event) => {
        console.log("🔌 WebSocket disconnected:", event.code, event.reason);
        setIsConnected(false);
        socketRef.current = null;

        // Attempt to reconnect if not a normal closure
        if (
          shouldConnect &&
          event.code !== 1000 &&
          reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS
        ) {
          reconnectAttemptsRef.current += 1;
          console.log(
            `🔄 Reconnecting... Attempt ${reconnectAttemptsRef.current}/${MAX_RECONNECT_ATTEMPTS}`
          );

          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, RECONNECT_DELAY);
        } else if (reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS) {
          console.error("❌ Max reconnection attempts reached");
          setError("Failed to connect after multiple attempts");
        }
      };

      ws.onerror = (err) => {
        console.error("❌ WebSocket error:", err);
        setError("WebSocket connection error");
      };
    } catch (err) {
      console.error("❌ Failed to create WebSocket:", err);
      setError("Failed to create WebSocket connection");
    }
  }, [shouldConnect, getWebSocketUrl]);

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }

      if (socketRef.current) {
        socketRef.current.close(1000, "Component unmounted");
        socketRef.current = null;
      }
    };
  }, [connect]);

  const sendMessage = useCallback((data) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      const payload = typeof data === "string" ? data : JSON.stringify(data);
      socketRef.current.send(payload);
      console.log("📤 Sent:", payload);
    } else {
      console.warn("⚠️ Cannot send — socket not open");
      setError("Cannot send message: Socket not connected");
    }
  }, []);

  const reconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.close();
    }
    reconnectAttemptsRef.current = 0;
    connect();
  }, [connect]);

  return {
    socket,
    isConnected,
    message,
    error,
    sendMessage,
    reconnect,
  };
}