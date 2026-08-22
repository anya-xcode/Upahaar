/**
 * A tiny in-process TTL cache.
 *
 * Scope is deliberately small: slow-changing lookups that sit on the hot path,
 * such as a pincode's serviceability or which sellers cover it. Those are read
 * on nearly every catalogue request and change a few times a day.
 *
 * It is per-process, so behind multiple instances each keeps its own copy —
 * fine at these TTLs. When that stops being true, swap the three methods below
 * for Redis; nothing else in the codebase needs to know.
 */

const store = new Map();

/** In-flight promises, so a cold key under load resolves once, not N times. */
const inflight = new Map();

function isFresh(entry) {
  return entry && entry.expires > Date.now();
}

export function get(key) {
  const entry = store.get(key);
  if (!isFresh(entry)) {
    store.delete(key);
    return undefined;
  }
  return entry.value;
}

export function set(key, value, ttlMs) {
  store.set(key, { value, expires: Date.now() + ttlMs });
  return value;
}

/**
 * Read-through cache. Concurrent misses on the same key share one lookup
 * rather than stampeding the database.
 */
export async function wrap(key, ttlMs, loader) {
  const hit = get(key);
  if (hit !== undefined) return hit;

  const pending = inflight.get(key);
  if (pending) return pending;

  const promise = (async () => {
    try {
      const value = await loader();
      set(key, value, ttlMs);
      return value;
    } finally {
      inflight.delete(key);
    }
  })();

  inflight.set(key, promise);
  return promise;
}

/** Drop keys by exact match or prefix — used when ops changes serviceability. */
export function invalidate(prefix) {
  for (const key of store.keys()) {
    if (key === prefix || key.startsWith(prefix)) store.delete(key);
  }
}

export function clear() {
  store.clear();
  inflight.clear();
}

export function stats() {
  return { keys: store.size, inflight: inflight.size };
}

export default { get, set, wrap, invalidate, clear, stats };
