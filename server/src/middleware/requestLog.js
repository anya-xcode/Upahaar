import { randomUUID } from 'node:crypto';
import logger from '../utils/logger.js';

/**
 * One line per request, and an id that ties it to anything logged while it ran.
 *
 * The id is echoed back as `X-Request-Id`, so a customer reporting "checkout
 * failed" can hand over a value that finds the exact request in the logs. An id
 * supplied by an upstream proxy is honoured, which keeps a single trace intact
 * across hops.
 *
 * Logging happens on `finish`, not on the way in, so the line carries the
 * status and duration — an entry written before the work is done can't tell you
 * whether the work succeeded.
 */

/** Paths that would otherwise bury the interesting lines. */
const QUIET = new Set(['/api/health', '/api/ready']);

export function requestLog(req, res, next) {
  const requestId = req.get('x-request-id') || randomUUID();
  req.id = requestId;
  req.log = logger.child({ requestId });
  res.setHeader('X-Request-Id', requestId);

  const startedAt = process.hrtime.bigint();
  // Read now, not on `finish`: Express rewrites `req.url` while dispatching into
  // a mounted router, so `req.path` cannot be trusted by the time this fires.
  const path = req.originalUrl.split('?')[0];

  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1e6;
    // A slow health check is still worth seeing; a fast one is not.
    if (QUIET.has(path) && res.statusCode < 400 && durationMs < 1000) return;

    const level = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info';

    req.log[level](`${req.method} ${req.originalUrl} ${res.statusCode}`, {
      method: req.method,
      path,
      status: res.statusCode,
      durationMs: Number(durationMs.toFixed(1)),
      // Who, not what — never the body, which carries passwords and addresses.
      userId: req.user?._id ? String(req.user._id) : undefined,
      role: req.user?.role,
      ip: req.ip,
    });
  });

  next();
}

export default requestLog;
