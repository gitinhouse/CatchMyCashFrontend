// server.js
import { WebSocketServer } from "ws";
import { createServer } from "http";
import startCronJobs from "./src/app/lib/cron.js";
import next from "next";
import { parse } from "url";

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

const PORT = process.env.PORT || 6045;
const HOSTNAME = process.env.HOSTNAME || (dev ? "localhost" : "stack.brstdev.com");

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    handle(req, res);
  });

  // Create WebSocket server without attaching to HTTP server yet
  const wss = new WebSocketServer({ noServer: true });

  // Handle upgrade requests manually
  httpServer.on("upgrade", (request, socket, head) => {
    const { pathname } = parse(request.url);

    // ✅ Let Next.js handle its own HMR WebSocket
    if (pathname === "/_next/webpack-hmr") {
      // Do nothing, Next.js will handle this
      return;
    }

    // ✅ Handle custom WebSocket connections on /api/ws
    if (pathname === "/api/ws") {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit("connection", ws, request);
      });
    } else {
      // Close any other upgrade requests
      socket.destroy();
    }
  });

  wss.on("connection", (ws, req) => {
    const clientIp = req.socket.remoteAddress;
    console.log(`✅ New WebSocket client connected from ${clientIp}`);

    ws.send(
      JSON.stringify({
        type: "welcome",
        message: "Connected to WebSocket",
        environment: dev ? "development" : "production",
      })
    );

    ws.on("message", (message) => {
      console.log("📩 Received from client:", message.toString());

      // Broadcast message to all connected clients except sender
      wss.clients.forEach((client) => {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
          client.send(message.toString());
        }
      });
    });

    ws.on("close", () => {
      console.log(`❌ Client disconnected from ${clientIp}`);
    });

    ws.on("error", (error) => {
      console.error("⚠️ WebSocket error:", error);
    });
  });

  // Start the HTTP server
  httpServer.listen(PORT, () => {
    const protocol = "http";
    const wsProtocol = "ws";

    console.log(`
╔════════════════════════════════════════════════════════════╗
║  Environment: ${dev ? "DEVELOPMENT" : "PRODUCTION"}
║  Next.js:     ${protocol}://${HOSTNAME}:${PORT}
║  WebSocket:   ${wsProtocol}://${HOSTNAME}:${PORT}/api/ws
║  HMR:         ${dev ? "Enabled at /_next/webpack-hmr" : "Disabled"}
╚════════════════════════════════════════════════════════════╝
    `);
  });

  startCronJobs();

  // Graceful shutdown
  const shutdown = () => {
    console.log("\n🛑 Shutting down gracefully...");

    httpServer.close(() => {
      console.log("✅ HTTP server closed");
    });

    wss.clients.forEach((client) => {
      client.close(1000, "Server shutting down");
    });

    wss.close(() => {
      console.log("✅ WebSocket server closed");
      process.exit(0);
    });
  };

  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
});