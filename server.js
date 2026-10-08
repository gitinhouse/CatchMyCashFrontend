// server.js
import { createServer } from 'http';
import startCronJobs from './src/app/lib/cron.js';
import startAgreementReadyCron from './src/app/lib/agreementReadyCron.js';
import {
  attachDocumentSocket,
  closeDocumentSocket,
} from './src/app/lib/documentSocket.js';
//import startRenewWatchCron from './src/app/lib/renewWatch.js';
//import sqsCronJob from './src/app/lib/sqsCronJob.js';

import next from 'next';
import { canonicalRedirectLocation } from './src/app/lib/canonicalRedirect.js';

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

const PORT = process.env.PORT;
const HOSTNAME =
  process.env.HOSTNAME || (dev ? 'localhost' : 'fetchmydollars.com');

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    // http:// and www. variants of the site → 301 to https://catchmycash.com.
    // Checked here, on the headers exactly as the proxy sent them; see
    // canonicalRedirect.js for why it cannot live inside Next.
    let location = null;
    try {
      location = canonicalRedirectLocation(req);
    } catch (error) {
      // A request this cannot read is served as it is, never failed.
      console.error('[canonical-redirect]', error);
    }
    if (location) {
      res.writeHead(301, {
        Location: location,
        // Never stored by a CDN or proxy cache: whether to redirect is decided
        // from request headers, some of them visitor-supplied, and a shared
        // cache would hand one visitor's redirect to everyone. An hour in the
        // visitor's own browser.
        'Cache-Control': 'private, max-age=3600',
      });
      res.end();
      return;
    }
    handle(req, res);
  });

  // Carries a document uploaded from a claimant's phone back to the browser
  // they started the claim in. The wiring lives in its own module so it can be
  // exercised on its own.
  const wss = attachDocumentSocket(httpServer, { path: '/api/ws' });

  // Start the HTTP server
  httpServer.listen(PORT, () => {
    const protocol = 'http';
    const wsProtocol = 'ws';

    console.log(`
╔════════════════════════════════════════════════════════════╗
║  Environment: ${dev ? 'DEVELOPMENT' : 'PRODUCTION'}
║  Next.js:     ${protocol}://${HOSTNAME}:${PORT}
║  WebSocket:   ${wsProtocol}://${HOSTNAME}:${PORT}/api/ws
║  HMR:         ${dev ? 'Enabled at /_next/webpack-hmr' : 'Disabled'}
╚════════════════════════════════════════════════════════════╝
    `);
  });

  //startCronJobs();
  // startRenewWatchCron();
  //sqsCronJob();

  // Agreements are written into the database by the automation server, so this
  // is what notices them and emails the claimant.
  startAgreementReadyCron();
  // Graceful shutdown
  const shutdown = () => {
    console.log('\n🛑 Shutting down gracefully...');

    httpServer.close(() => {
      console.log('✅ HTTP server closed');
    });

    closeDocumentSocket(wss, () => {
      console.log('✅ WebSocket server closed');
      process.exit(0);
    });
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
});
