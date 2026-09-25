import { parse } from 'url';
import { WebSocket, WebSocketServer } from 'ws';

/**
 * The socket that carries a phone's upload back to the desk.
 *
 * A claimant can scan a QR code and upload a document from their phone. That
 * upload never touches the browser they started the claim in, so nothing in
 * that tab has any way of knowing it happened — this is what tells it.
 *
 * `WebSocket` is imported rather than read off the global object. The global
 * only exists from Node 21 onwards, and on anything older reading
 * `WebSocket.OPEN` threw inside the message handler: nothing was forwarded at
 * all, and a phone upload arrived nowhere.
 *
 * A tab says which claim it is watching with
 * `{ type: 'subscribe', caseId }`, and messages carrying a caseId then reach
 * only the tabs watching that claim. A tab that never said stays on the old
 * terms and hears everything, so nothing goes quiet mid-claim during a deploy.
 */

/** Which claims each connection has asked about. */
const watching = new WeakMap();

export function attachDocumentSocket(httpServer, { path = '/api/ws' } = {}) {
  const wss = new WebSocketServer({ noServer: true });

  httpServer.on('upgrade', (request, socket, head) => {
    const { pathname } = parse(request.url);

    // Next.js keeps its own socket for hot reloading; leave it alone.
    if (pathname === '/_next/webpack-hmr') return;

    if (pathname !== path) {
      socket.destroy();
      return;
    }

    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  });

  wss.on('connection', (ws, req) => {
    const clientIp = req?.socket?.remoteAddress;
    console.log(`✅ New WebSocket client connected from ${clientIp}`);

    send(ws, {
      type: 'welcome',
      message: 'Connected to WebSocket',
      environment: process.env.NODE_ENV !== 'production' ? 'development' : 'production',
    });

    ws.on('message', (raw) => {
      const text = raw.toString();
      console.log('📩 Received from client:', text);

      let data = null;
      try {
        data = JSON.parse(text);
      } catch {
        // Not ours to interpret — forwarded below exactly as it arrived.
      }

      if (data?.type === 'subscribe') {
        subscribe(ws, data.caseId);
        return;
      }

      const caseId = data?.caseId ? String(data.caseId) : '';

      for (const client of recipients(wss, ws, caseId)) {
        client.send(text);
      }
    });

    ws.on('close', () => {
      console.log(`❌ Client disconnected from ${clientIp}`);
    });

    ws.on('error', (error) => {
      console.error('⚠️ WebSocket error:', error);
    });
  });

  return wss;
}

function subscribe(ws, rawCaseId) {
  const caseId = rawCaseId ? String(rawCaseId) : '';
  if (!caseId) return;

  const cases = watching.get(ws) || new Set();
  cases.add(caseId);
  watching.set(ws, cases);

  send(ws, { type: 'subscribed', caseId });
}

/** Everyone who should see this message, never the client that sent it. */
function recipients(wss, sender, caseId) {
  const out = [];

  for (const client of wss.clients) {
    if (client === sender) continue;
    if (client.readyState !== WebSocket.OPEN) continue;

    const cases = watching.get(client);
    if (caseId && cases && cases.size > 0 && !cases.has(caseId)) continue;

    out.push(client);
  }

  return out;
}

function send(ws, payload) {
  if (ws.readyState !== WebSocket.OPEN) return;
  ws.send(JSON.stringify(payload));
}

/** Close every connection, for a clean shutdown. */
export function closeDocumentSocket(wss, done) {
  for (const client of wss.clients) {
    client.close(1000, 'Server shutting down');
  }
  wss.close(done);
}
