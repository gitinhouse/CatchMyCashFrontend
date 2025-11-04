// server.js
import { WebSocketServer } from "ws";
import { createServer } from "http";
import startCronJobs from "./src/app/lib/cron.js";
import next from "next";

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

const PORT = process.env.PORT || 6045;
const WS_PORT = process.env.WS_PORT || 7071;

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    handle(req, res);
  });

  httpServer.listen(PORT, () => {
    console.log(` Next.js app running at http://stack.brstdev.com:${PORT}`);
  });
  startCronJobs();
  const wss = new WebSocketServer({ port: WS_PORT });
  console.log(`WebSocket server running at ws://stack.brstdev.com:${WS_PORT}`);

  wss.on("connection", (ws) => {
    console.log("New WebSocket client connected");
    ws.send(JSON.stringify({ type: "welcome", message: "Connected to WebSocket" }));

    ws.on("message", (message) => {
      console.log(" Received from client:", message.toString());
      // broadcast message to all connected clients
      wss.clients.forEach((client) => {
        if (client.readyState === ws.OPEN) {
          client.send(message.toString());
        }
      });
    });

    ws.on("close", () => console.log("Client disconnected"));
  });
});
