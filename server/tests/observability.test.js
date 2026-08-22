import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import requestLog from '../src/middleware/requestLog.js';

/**
 * The logging path only matters when something has gone wrong, which is exactly
 * when nobody is in a position to debug it. These tests pin the two things an
 * on-call engineer depends on: that a request and its error share an id, and
 * that an Error survives serialisation instead of arriving as `{}`.
 */

/** Loads a fresh logger with the given environment, since level is read once. */
async function loadLogger(env) {
  vi.resetModules();
  const previous = { ...process.env };
  Object.assign(process.env, env);
  const { default: logger } = await import('../src/utils/logger.js?' + Math.random());
  process.env = previous;
  return logger;
}

let lines;
let spies;

beforeEach(() => {
  lines = [];
  spies = [
    vi.spyOn(console, 'log').mockImplementation((l) => lines.push(l)),
    vi.spyOn(console, 'error').mockImplementation((l) => lines.push(l)),
  ];
});

afterEach(() => spies.forEach((s) => s.mockRestore()));

describe('the logger', () => {
  it('writes one JSON object per line when nobody is watching a terminal', async () => {
    const logger = await loadLogger({ LOG_FORMAT: 'json', LOG_LEVEL: 'debug', NODE_ENV: 'production' });
    logger.info('Order placed', { orderId: 'GFT1001' });

    expect(lines).toHaveLength(1);
    const entry = JSON.parse(lines[0]);
    expect(entry).toMatchObject({ level: 'info', service: 'upahaar-api', message: 'Order placed', orderId: 'GFT1001' });
    expect(Date.parse(entry.time)).not.toBeNaN();
  });

  it('unpacks an Error, which would otherwise serialise to nothing', async () => {
    const logger = await loadLogger({ LOG_FORMAT: 'json', LOG_LEVEL: 'debug', NODE_ENV: 'production' });
    logger.error('Checkout failed', { err: new TypeError('no such seller') });

    const { err } = JSON.parse(lines[0]);
    expect(JSON.stringify(new TypeError('x'))).toBe('{}'); // the trap this avoids
    expect(err).toMatchObject({ name: 'TypeError', message: 'no such seller' });
    expect(err.stack).toContain('TypeError: no such seller');
  });

  it('stamps bound context onto every line a child writes', async () => {
    const logger = await loadLogger({ LOG_FORMAT: 'json', LOG_LEVEL: 'debug', NODE_ENV: 'production' });
    const child = logger.child({ requestId: 'r-1' });
    child.info('first');
    child.child({ userId: 'u-9' }).warn('second');

    expect(JSON.parse(lines[0]).requestId).toBe('r-1');
    expect(JSON.parse(lines[1])).toMatchObject({ requestId: 'r-1', userId: 'u-9' });
  });

  it('honours LOG_LEVEL so a noisy level can be turned off', async () => {
    const logger = await loadLogger({ LOG_FORMAT: 'json', LOG_LEVEL: 'warn', NODE_ENV: 'production' });
    logger.debug('quiet');
    logger.info('also quiet');
    logger.warn('loud');
    expect(lines).toHaveLength(1);
    expect(JSON.parse(lines[0]).message).toBe('loud');
  });

  it('says nothing at all during tests unless asked', async () => {
    const logger = await loadLogger({ LOG_FORMAT: 'json', LOG_LEVEL: '', NODE_ENV: 'test' });
    logger.error('should not appear');
    expect(lines).toHaveLength(0);
  });
});

/** The smallest req/res pair the middleware actually touches. */
function fakeExchange({ headers = {}, ...over } = {}) {
  const listeners = {};
  const res = {
    statusCode: 200,
    headers: {},
    setHeader(k, v) { this.headers[k] = v; },
    on(event, fn) { listeners[event] = fn; },
    finish() { listeners.finish?.(); },
  };
  const req = {
    method: 'GET',
    originalUrl: '/api/orders?page=2',
    ip: '127.0.0.1',
    get: (k) => headers[k.toLowerCase()],
    ...over,
  };
  return { req, res };
}

describe('the request logger', () => {
  it('gives every request an id and hands it back on the response', () => {
    const { req, res } = fakeExchange();
    requestLog(req, res, () => {});

    expect(req.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(res.headers['X-Request-Id']).toBe(req.id);
  });

  it('keeps an id supplied upstream, so one trace survives the hop', () => {
    const { req, res } = fakeExchange({ headers: { 'x-request-id': 'from-the-proxy' } });
    requestLog(req, res, () => {});

    expect(req.id).toBe('from-the-proxy');
    expect(res.headers['X-Request-Id']).toBe('from-the-proxy');
  });

  it('logs once the response is done, with its status and duration', () => {
    const { req, res } = fakeExchange();
    const written = [];
    requestLog(req, res, () => {});
    req.log = { info: (m, f) => written.push(['info', m, f]), warn: () => {}, error: () => {} };

    res.statusCode = 201;
    res.finish();

    expect(written).toHaveLength(1);
    const [level, message, fields] = written[0];
    expect(level).toBe('info');
    expect(message).toBe('GET /api/orders?page=2 201');
    // The query string is dropped from the field so paths aggregate.
    expect(fields.path).toBe('/api/orders');
    expect(fields.status).toBe(201);
    expect(typeof fields.durationMs).toBe('number');
  });

  it('raises the level with the status, so failures stand out', () => {
    for (const [status, expected] of [[200, 'info'], [404, 'warn'], [401, 'warn'], [500, 'error']]) {
      const { req, res } = fakeExchange();
      const written = [];
      requestLog(req, res, () => {});
      req.log = {
        info: (m, f) => written.push(['info', m, f]),
        warn: (m, f) => written.push(['warn', m, f]),
        error: (m, f) => written.push(['error', m, f]),
      };
      res.statusCode = status;
      res.finish();
      expect(written[0][0], `status ${status}`).toBe(expected);
    }
  });

  it('records who made the request but never what they sent', () => {
    const { req, res } = fakeExchange();
    const written = [];
    requestLog(req, res, () => {});
    req.log = { info: (m, f) => written.push(f), warn: () => {}, error: () => {} };
    req.user = { _id: 'u-1', role: 'CUSTOMER' };
    req.body = { password: 'hunter2', address: 'B-14' };
    res.finish();

    expect(written[0]).toMatchObject({ userId: 'u-1', role: 'CUSTOMER' });
    expect(JSON.stringify(written[0])).not.toContain('hunter2');
  });

  it('stays quiet about healthy probes, which would drown everything else', () => {
    for (const url of ['/api/health', '/api/ready']) {
      const { req, res } = fakeExchange({ originalUrl: url });
      const written = [];
      requestLog(req, res, () => {});
      req.log = { info: (m, f) => written.push(f), warn: () => {}, error: () => {} };
      res.finish();
      expect(written, url).toHaveLength(0);
    }
  });

  it('but does report a probe that fails', () => {
    const { req, res } = fakeExchange({ originalUrl: '/api/ready' });
    const written = [];
    requestLog(req, res, () => {});
    req.log = { info: () => {}, warn: () => {}, error: (m, f) => written.push(f) };
    res.statusCode = 503;
    res.finish();

    expect(written).toHaveLength(1);
    expect(written[0].status).toBe(503);
  });
});
