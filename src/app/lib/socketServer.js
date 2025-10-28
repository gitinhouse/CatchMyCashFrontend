import { WebSocketServer } from "ws";

let wss = null;

export function getOrCreateWSServer(server) {
  if (wss) return wss; // Reuse if already initialized

  // Attach to existing server if available (Next dev mode)
  if (server && !server.wss) {
    wss = new WebSocketServer({ noServer: true });
    server.on("upgrade", (req, socket, head) => {
      if (req.url === "/api/socket") {
        wss.handleUpgrade(req, socket, head, (ws) => {
          wss.emit("connection", ws, req);
        });
      } else {
        socket.destroy();
      }
    });
    server.wss = wss;
  }

  // If running in production (e.g. Vercel Edge has no `server` object)
  if (!server) {
    const port = process.env.WS_PORT || 8080;
    if (!global._wss) {
      global._wss = new WebSocketServer({ port });
      console.log(`✅ WebSocket server started on port ${port}`);
    }
    wss = global._wss;
  }

  // Basic message broadcast logic
  wss.on("connection", (ws) => {
    console.log("🔗 WebSocket connected");
    ws.on("message", (msg) => {
      try {
        const data = JSON.parse(msg.toString());
        console.log("📩 Received:", data);
        wss.clients.forEach((client) => {
          if (client.readyState === 1) client.send(JSON.stringify(data));
        });
      } catch (err) {
        console.error("❌ Invalid WS message:", err);
      }
    });
    ws.on("close", () => console.log("❎ WebSocket disconnected"));
  });

  return wss;
}
