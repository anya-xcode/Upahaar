import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import connectDB from './config/db.js';
import routes, { beginDraining } from './routes/index.js';
import requestLog from './middleware/requestLog.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';
import logger from './utils/logger.js';

const app = express();
const PORT = process.env.PORT || 5000;

app.set('trust proxy', 1);
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(
  cors({
    origin: (process.env.CLIENT_ORIGIN || 'http://localhost:5173').split(','),
    credentials: true,
    // So a browser client can read the id back and quote it in a bug report.
    exposedHeaders: ['X-Request-Id'],
  })
);
app.use(express.json({ limit: '5mb' })); // headroom for base64 personalisation photos
app.use(express.urlencoded({ extended: true }));

// Before the routes, so anything they log carries the request id.
app.use(requestLog);

app.use('/api', rateLimit({ windowMs: 60 * 1000, max: 600, standardHeaders: true, legacyHeaders: false }));
app.use('/api', routes);

app.get('/', (_req, res) =>
  res.json({ success: true, message: "Upahaar API — don't just send a gift. Send a moment." })
);

app.use(notFound);
app.use(errorHandler);

/* ------------------------------- Lifecycle -------------------------------- */

/** How long in-flight requests get to finish before the process is forced out. */
const SHUTDOWN_GRACE_MS = Number(process.env.SHUTDOWN_GRACE_MS || 10_000);

let server = null;
let shuttingDown = false;

/**
 * Stop cleanly: fail readiness first so the load balancer stops sending work,
 * then close the listener so in-flight requests can finish, then hang up on
 * MongoDB. A hard deadline sits behind all of it — a shutdown that hangs is
 * worse than one that is abrupt, because the orchestrator kills it anyway and
 * you lose the logs that would have explained why.
 */
async function shutdown(signal, code = 0) {
  if (shuttingDown) return;
  shuttingDown = true;

  logger.warn('Shutting down', { signal, graceMs: SHUTDOWN_GRACE_MS });
  beginDraining();

  const deadline = setTimeout(() => {
    logger.error('Shutdown timed out — forcing exit', { signal });
    process.exit(code || 1);
  }, SHUTDOWN_GRACE_MS);
  deadline.unref();

  try {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
      logger.info('Stopped accepting requests');
    }
    await mongoose.connection.close(false);
    logger.info('MongoDB connection closed');
  } catch (err) {
    logger.error('Error while shutting down', { err });
    code = code || 1;
  }

  clearTimeout(deadline);
  process.exit(code);
}

async function start() {
  try {
    const conn = await connectDB(process.env.MONGO_URI);
    logger.info('MongoDB connected', { database: conn.name });

    server = app.listen(PORT, () => logger.info('Upahaar API ready', { url: `http://localhost:${PORT}` }));
    // Don't let a slow client hold a socket open through a shutdown.
    server.keepAliveTimeout = 65_000;
    server.headersTimeout = 66_000;
  } catch (err) {
    logger.error('Could not start the API', {
      err,
      hint: 'Is MongoDB running, and is MONGO_URI correct in server/.env?',
    });
    process.exit(1);
  }
}

// SIGTERM is what a container runtime sends; SIGINT is Ctrl-C.
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// A process in an unknown state should not keep serving customers. Log the
// cause first — an exit with no explanation is the hardest kind to diagnose.
process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled promise rejection', { err: reason instanceof Error ? reason : new Error(String(reason)) });
  shutdown('unhandledRejection', 1);
});
process.on('uncaughtException', (err) => {
  logger.error('Uncaught exception', { err });
  shutdown('uncaughtException', 1);
});

start();

export default app;
