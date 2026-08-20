import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../lib/api.js';
import { Img, Badge, Skeleton, EmptyState } from '../../components/common/ui.jsx';
import { Clock, ChevronRight } from '../../components/common/Icons.jsx';
import { formatDate } from '../../lib/format.js';

export default function GiftGuides() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    setLoading(true);
    api
      .get('/catalog/posts', { params: { kind: filter || undefined } })
      .then(({ data }) => setPosts(data.posts))
      .catch(() => setPosts([]))
      .finally(() => setLoading(false));
  }, [filter]);

  const [lead, ...rest] = posts;

  return (
    <div className="container-app py-10">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-semibold text-ink">Gift guides &amp; stories</h1>
          <p className="mt-2 max-w-2xl text-[15px] text-ink-muted">
            Ideas for the people who are hard to buy for, and a look behind how we get a cake across a city in
            under an hour.
          </p>
        </div>

        <div className="flex rounded-full border border-line bg-white p-1">
          {[
            ['', 'Everything'],
            ['GIFT_GUIDE', 'Gift guides'],
            ['BLOG', 'Stories'],
          ].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`rounded-full px-4 py-1.5 text-[13px] font-semibold transition ${
                filter === key ? 'bg-rose-500 text-white' : 'text-ink-muted hover:text-ink'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-6">
          <Skeleton className="h-80 w-full rounded-4xl" />
          <div className="grid gap-5 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-64 w-full rounded-xl2" />)}
          </div>
        </div>
      ) : !posts.length ? (
        <EmptyState icon="book" title="No stories yet" message="Check back soon — we're writing." />
      ) : (
        <>
          {/* Lead story */}
          <Link
            to={`/gift-guides/${lead.slug}`}
            className="group grid overflow-hidden rounded-4xl border border-line bg-white transition hover:shadow-lift lg:grid-cols-2"
          >
            <div className="relative aspect-[16/10] overflow-hidden lg:aspect-auto">
              <Img
                src={lead.coverImage}
                alt={lead.title}
                icon="gift"
                seed={lead.slug}
                className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
              />
            </div>
            <div className="flex flex-col justify-center p-7 sm:p-10">
              <Badge tone="rose" className="mb-4 w-fit">
                {lead.kind === 'GIFT_GUIDE' ? 'Gift guide' : 'Story'}
              </Badge>
              <h2 className="font-display text-2xl font-semibold leading-tight text-ink transition group-hover:text-rose-600 sm:text-3xl">
                {lead.title}
              </h2>
              <p className="mt-3 text-[15px] leading-relaxed text-ink-muted">{lead.excerpt}</p>
              <p className="mt-5 flex items-center gap-3 text-[12px] text-ink-faint">
                <span>{lead.author}</span>
                <span>·</span>
                <span>{formatDate(lead.publishedAt)}</span>
                <span>·</span>
                <span className="flex items-center gap-1"><Clock size={12} /> {lead.readMinutes} min read</span>
              </p>
              <span className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-rose-600">
                Read the guide <ChevronRight size={15} />
              </span>
            </div>
          </Link>

          {rest.length > 0 && (
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {rest.map((p) => (
                <Link
                  key={p._id}
                  to={`/gift-guides/${p.slug}`}
                  className="group flex flex-col overflow-hidden rounded-xl2 border border-line bg-white transition hover:-translate-y-1 hover:shadow-lift"
                >
                  <div className="aspect-[16/10] overflow-hidden">
                    <Img
                      src={p.coverImage}
                      alt={p.title}
                      icon="gift"
                      seed={p.slug}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="flex flex-1 flex-col p-5">
                    <Badge tone="neutral" className="mb-3 w-fit !text-[10px]">
                      {p.kind === 'GIFT_GUIDE' ? 'Gift guide' : 'Story'}
                    </Badge>
                    <h3 className="font-display text-[17px] font-semibold leading-snug text-ink transition group-hover:text-rose-600">
                      {p.title}
                    </h3>
                    <p className="mt-2 line-clamp-2 text-[13px] leading-relaxed text-ink-muted">{p.excerpt}</p>
                    <div className="flex-1" />
                    <p className="mt-4 flex items-center gap-2 text-[11px] text-ink-faint">
                      {formatDate(p.publishedAt)} · <Clock size={11} /> {p.readMinutes} min
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
