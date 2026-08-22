/**
 * Logging.
 *
 * Two audiences, one call site. In development a human is reading a terminal,
 * so lines are short and coloured. Anywhere else a log shipper is reading, so
 * every line is a single JSON object — greppable by request id, filterable by
 * level, and never split across lines by a stack trace.
 *
 * `child()` binds context (a request id, a user) once so individual call sites
 * don't have to remember to pass it. That is the whole point: a 500 and the
 * request that caused it carry the same id, so one is findable from the other.
 *
 * Deliberately dependency-free — this is a hundred lines, and swapping in pino
 * later means reimplementing `write` and nothing else.
 */

const LEVELS = { debug: 10, info: 20, warn: 30, error: 40, silent: 99 };

const isProduction = process.env.NODE_ENV === 'production';
const isTest = process.env.NODE_ENV === 'test';

const configured = (process.env.LOG_LEVEL || (isTest ? 'silent' : isProduction ? 'info' : 'debug')).toLowerCase();
const threshold = LEVELS[configured] ?? LEVELS.info;

/** Pretty output only when a person is watching. */
const pretty = !isProduction && process.env.LOG_FORMAT !== 'json';

const COLOURS = {
  debug: '\x1b[90m',
  info: '\x1b[36m',
  warn: '\x1b[33m',
  error: '\x1b[31m',
  dim: '\x1b[2m',
  reset: '\x1b[0m',
};

/**
 * Errors do not survive JSON.stringify — an Error serialises to `{}` — so they
 * are unpacked into fields a log viewer can actually show.
 */
function expand(fields) {
  const out = {};
  for (const [key, value] of Object.entries(fields || {})) {
    if (value instanceof Error) {
      out[key] = { name: value.name, message: value.message, stack: value.stack, ...(value.statusCode ? { statusCode: value.statusCode } : {}) };
    } else if (value !== undefined) {
      out[key] = value;
    }
  }
  return out;
}

function writePretty(level, message, fields) {
  const { requestId, err, ...rest } = fields;
  const tag = `${COLOURS[level]}${level.toUpperCase().padEnd(5)}${COLOURS.reset}`;
  const id = requestId ? `${COLOURS.dim}${String(requestId).slice(0, 8)}${COLOURS.reset} ` : '';
  const extra = Object.keys(rest).length
    ? ` ${COLOURS.dim}${Object.entries(rest).map(([k, v]) => `${k}=${typeof v === 'object' ? JSON.stringify(v) : v}`).join(' ')}${COLOURS.reset}`
    : '';

  console.log(`${tag} ${id}${message}${extra}`);
  if (err?.stack) console.error(COLOURS.dim + err.stack + COLOURS.reset);
}

function write(level, message, fields) {
  if (LEVELS[level] < threshold) return;

  const payload = expand(fields);
  if (pretty) return writePretty(level, message, payload);

  const line = JSON.stringify({
    level,
    time: new Date().toISOString(),
    service: 'upahaar-api',
    message,
    ...payload,
  });
  if (level === 'error') console.error(line);
  else console.log(line);
}

function build(bindings = {}) {
  const log = (level) => (message, fields = {}) => write(level, message, { ...bindings, ...fields });

  return {
    debug: log('debug'),
    info: log('info'),
    warn: log('warn'),
    error: log('error'),
    /** Returns a logger that stamps `bindings` onto every line it writes. */
    child: (extra) => build({ ...bindings, ...extra }),
  };
}

export const logger = build();
export default logger;
