import jwt from 'jsonwebtoken';

export function signToken(user) {
  return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

export function slugify(text) {
  return String(text)
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Slug that is guaranteed free in `Model`, by appending -2, -3 … when needed. */
export async function uniqueSlug(Model, text, ignoreId = null) {
  const base = slugify(text) || 'item';
  let slug = base;
  let n = 1;
  // eslint-disable-next-line no-await-in-loop
  while (await Model.exists({ slug, ...(ignoreId ? { _id: { $ne: ignoreId } } : {}) })) {
    n += 1;
    slug = `${base}-${n}`;
  }
  return slug;
}

/** Human-facing order id, e.g. GFT1024. */
export function makeOrderId(sequence) {
  return `GFT${1000 + sequence}`;
}

export function randomReferralCode(name) {
  const prefix = String(name || 'GIFT').replace(/[^A-Za-z]/g, '').slice(0, 4).toUpperCase() || 'GIFT';
  return `${prefix}${Math.floor(1000 + Math.random() * 9000)}`;
}

export function rupees(n) {
  return `₹${Number(n || 0).toLocaleString('en-IN')}`;
}

export function paginate(query) {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(60, Math.max(1, parseInt(query.limit, 10) || 12));
  return { page, limit, skip: (page - 1) * limit };
}

/** Rounds to 2dp without floating-point crumbs leaking into totals. */
export function money(n) {
  return Math.round((Number(n) + Number.EPSILON) * 100) / 100;
}

export function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export function daysAgo(n) {
  const d = startOfToday();
  d.setDate(d.getDate() - n);
  return d;
}
