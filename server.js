// server.js
import { WebSocketServer } from "ws";
import { createServer } from "http";
import startCronJobs from "./src/app/lib/cron.js";
import next from "next";

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

const PORT = process.env.PORT || 6045;

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    handle(req, res);
  });

  // ✅ Attach WebSocket server to same HTTP server
  const wss = new WebSocketServer({ server: httpServer });
  console.log(`✅ WebSocket attached to same port as HTTP (${PORT})`);

  wss.on("connection", (ws) => {
    console.log("🔗 New WebSocket client connected");
    ws.send(JSON.stringify({ type: "welcome", message: "Connected to WebSocket" }));

    ws.on("message", (message) => {
      console.log("📨 Received from client:", message.toString());
      // Broadcast to all clients
      wss.clients.forEach((client) => {
        if (client.readyState === ws.OPEN) {
          client.send(message.toString());
        }
      });
    });

    ws.on("close", () => console.log("❌ Client disconnected"));
  });

  // ✅ Start server
  httpServer.listen(PORT, () => {
    console.log(`🚀 Next.js + WebSocket server running at http://stack.brstdev.com:${PORT}`);
  });

  // ✅ Start cron jobs
  startCronJobs();
});
