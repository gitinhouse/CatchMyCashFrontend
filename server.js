// server.js
import { WebSocketServer } from "ws";
import { createServer } from "http";
import next from "next";
import dotenv from "dotenv";
import startCronJobs from "./src/app/lib/cron.js";

// ✅ Load .env variables
dotenv.config();

const dev = process.env.NODE_ENV !== "production";
const PORT = process.env.PORT || 6045;
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    handle(req, res, req.url);
  });

  // ✅ Attach WebSocket to same server
  const wss = new WebSocketServer({ server: httpServer });
  console.log(`✅ WebSocket attached on port ${PORT}`);

  wss.on("connection", (ws) => {
    console.log("🔗 Client connected");
    ws.send(JSON.stringify({ type: "welcome", message: "Connected to WebSocket" }));

    ws.on("message", (message) => {
      console.log("📨 Received:", message.toString());
      // Broadcast to all clients
      wss.clients.forEach((client) => {
        if (client.readyState === ws.OPEN) {
          client.send(message.toString());
        }
      });
    });

    ws.on("close", () => console.log("❌ Client disconnected"));
  });

  httpServer.listen(PORT, () => {
    console.log(
      `🚀 Next.js + WebSocket server running in ${dev ? "development" : "production"} mode on port ${PORT}`
    );
  });

  startCronJobs();
});

process.on("unhandledRejection", console.error);
process.on("uncaughtException", console.error);
