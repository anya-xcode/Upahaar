import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../lib/api.js';
import { SectionHeader, Skeleton } from '../../components/common/ui.jsx';
import { ChevronRight } from '../../components/common/Icons.jsx';
import { CategoryGlyph, OccasionGlyph } from '../../lib/glyphs.jsx';

/** Days until the next occurrence of a month/day, ignoring the year. */
function daysUntil(month, day) {
  if (!month || !day) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let next = new Date(today.getFullYear(), month - 1, day);
  if (next < today) next = new Date(today.getFullYear() + 1, month - 1, day);
  return Math.round((next - today) / 86400000);
}

export default function Occasions() {
  const [occasions, setOccasions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get('/catalog/occasions'), api.get('/catalog/categories')])
      .then(([o, c]) => {
        setOccasions(o.data.occasions);
        setCategories(c.data.categories);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const upcoming = occasions
    .map((o) => ({ ...o, days: daysUntil(o.month, o.day) }))
    .filter((o) => o.days != null)
    .sort((a, b) => a.days - b.days)
    .slice(0, 4);

  return (
    <div className="container-app py-10">
      <div className="mb-8">
        <h1 className="font-display text-4xl font-semibold text-ink">Shop by occasion</h1>
        <p className="mt-2 max-w-2xl text-[15px] text-ink-muted">
          Every moment deserves the right gift. Pick the occasion and we'll narrow the catalogue to what fits —
          and what can reach them in time.
        </p>
      </div>

      {/* Countdown rail for dated occasions */}
      {upcoming.length > 0 && (
        <section className="mb-12">
          <SectionHeader eyebrow="Coming up" title="Don't get caught out" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {upcoming.map((o) => (
              <Link
                key={o._id}
                to={`/gifts?occasion=${o._id}`}
                className="group relative overflow-hidden rounded-xl2 bg-gradient-to-br from-rose-50 to-gold-50 p-5 transition hover:-translate-y-0.5 hover:shadow-lift"
              >
                <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-white/70 text-rose-500">
                  <OccasionGlyph occasion={o} size={20} />
                </span>
                <h3 className="text-[15px] font-bold text-ink">{o.name}</h3>
                <p className="mt-0.5 text-xs text-ink-muted">{o.tagline}</p>
                <p className="mt-3 inline-block rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-rose-600">
                  {o.days === 0 ? 'Today!' : `in ${o.days} day${o.days === 1 ? '' : 's'}`}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="mb-12">
        <SectionHeader title="All occasions" />
        {loading ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {Array.from({ length: 10 }).map((_, i) => <Skeleton key={i} className="h-32 w-full rounded-xl2" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {occasions.map((o) => (
              <Link
                key={o._id}
                to={`/gifts?occasion=${o._id}`}
                className="group flex flex-col items-center gap-3 rounded-xl2 border border-line bg-white p-6 text-center transition hover:-translate-y-1 hover:border-rose-200 hover:shadow-lift"
              >
                <span className="flex h-16 w-16 items-center justify-center rounded-full bg-blush text-rose-500 transition group-hover:scale-110">
                  <OccasionGlyph occasion={o} size={26} />
                </span>
                <span>
                  <span className="block text-sm font-bold text-ink">{o.name}</span>
                  <span className="mt-0.5 block text-[11px] text-ink-muted">{o.tagline}</span>
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section>
        <SectionHeader
          title="Or browse by category"
          action={<Link to="/gifts" className="btn-ghost btn-sm">All gifts <ChevronRight size={14} /></Link>}
        />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {categories.map((c) => (
            <Link
              key={c._id}
              to={`/gifts?category=${c._id}`}
              className="group rounded-xl2 border border-line p-5 transition hover:-translate-y-0.5 hover:shadow-lift"
              style={{ background: `linear-gradient(135deg, ${c.accent?.from || '#FFF1F5'}, ${c.accent?.to || '#FFF8F0'})` }}
            >
              <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-white/70 text-ink-soft transition group-hover:scale-110">
                <CategoryGlyph category={c} size={20} />
              </span>
              <span className="block text-sm font-bold text-ink">{c.name}</span>
              <span className="mt-0.5 block text-[11px] text-ink-muted">{c.productCount} gifts</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
