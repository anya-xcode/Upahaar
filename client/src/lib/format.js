/** Indian rupee formatting, used everywhere a price appears. */
export function inr(value, { decimals = false } = {}) {
  const n = Number(value || 0);
  return `₹${n.toLocaleString('en-IN', {
    minimumFractionDigits: decimals ? 2 : 0,
    maximumFractionDigits: decimals ? 2 : 0,
  })}`;
}

export function discountPercent(price, mrp) {
  if (!mrp || mrp <= price) return 0;
  return Math.round(((mrp - price) / mrp) * 100);
}

export function formatDate(value, opts = {}) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    ...opts,
  });
}

export function formatTime(value) {
  if (!value) return '—';
  return new Date(value).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });
}

export function formatDateTime(value) {
  if (!value) return '—';
  return `${formatDate(value)}, ${formatTime(value)}`;
}

/** "2 hours ago", "just now" — for notification and order feeds. */
export function timeAgo(value) {
  if (!value) return '';
  const seconds = Math.floor((Date.now() - new Date(value).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const units = [
    ['year', 31536000],
    ['month', 2592000],
    ['week', 604800],
    ['day', 86400],
    ['hour', 3600],
    ['minute', 60],
  ];
  for (const [name, secs] of units) {
    const value2 = Math.floor(seconds / secs);
    if (value2 >= 1) return `${value2} ${name}${value2 > 1 ? 's' : ''} ago`;
  }
  return 'just now';
}

/** Compact number for dashboard tiles: 12400 → 12.4k */
export function compact(n) {
  const num = Number(n || 0);
  if (num >= 10000000) return `${(num / 10000000).toFixed(1)}Cr`;
  if (num >= 100000) return `${(num / 100000).toFixed(1)}L`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
  return String(num);
}

export function initials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

/**
 * A deterministic warm gradient per string — used as the fallback behind
 * product images so an empty or broken gallery still looks intentional.
 */
export function gradientFor(key = '') {
  const palettes = [
    ['#FFE3EA', '#FFF1E6'],
    ['#FFF0F5', '#F6E9FF'],
    ['#FDE8D7', '#FFF7EE'],
    ['#E9F2FF', '#F7F1FF'],
    ['#FFF3DC', '#FFECEF'],
    ['#EAF7F2', '#FFF6EC'],
  ];
  let hash = 0;
  for (let i = 0; i < key.length; i += 1) hash = (hash * 31 + key.charCodeAt(i)) % 997;
  const [from, to] = palettes[hash % palettes.length];
  return `linear-gradient(135deg, ${from}, ${to})`;
}
