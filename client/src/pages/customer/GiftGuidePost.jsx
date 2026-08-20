import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../../lib/api.js';
import { Img, Badge, Skeleton, EmptyState } from '../../components/common/ui.jsx';
import { Clock, ChevronLeft, ChevronRight } from '../../components/common/Icons.jsx';
import { formatDate, inr } from '../../lib/format.js';

export default function GiftGuidePost() {
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api
      .get(`/catalog/posts/${slug}`)
      .then(({ data }) => setPost(data.post))
      .catch(() => setPost(null))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="container-app max-w-3xl space-y-5 py-10">
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-64 w-full rounded-4xl" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="container-app py-20">
        <EmptyState icon="book" title="Story not found" action={<Link to="/gift-guides" className="btn-primary">All stories</Link>} />
      </div>
    );
  }

  return (
    <article className="container-app max-w-3xl py-10">
      <Link to="/gift-guides" className="mb-6 inline-flex items-center gap-1 text-[13px] font-semibold text-ink-muted transition hover:text-rose-600">
        <ChevronLeft size={15} /> All gift guides
      </Link>

      <Badge tone="rose" className="mb-4">
        {post.kind === 'GIFT_GUIDE' ? 'Gift guide' : 'Story'}
      </Badge>

      <h1 className="font-display text-4xl font-semibold leading-tight text-ink">{post.title}</h1>
      <p className="mt-4 text-[17px] leading-relaxed text-ink-soft">{post.excerpt}</p>

      <div className="mt-5 flex flex-wrap items-center gap-3 border-b border-line pb-6 text-[12.5px] text-ink-faint">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-100 text-[11px] font-bold text-rose-700">
          U
        </span>
        <span className="font-semibold text-ink-soft">{post.author}</span>
        <span>·</span>
        <span>{formatDate(post.publishedAt)}</span>
        <span>·</span>
        <span className="flex items-center gap-1"><Clock size={12} /> {post.readMinutes} min read</span>
      </div>

      <div className="mt-8 overflow-hidden rounded-4xl border border-line">
        <Img src={post.coverImage} alt={post.title} icon="gift" seed={post.slug} className="aspect-[16/9] w-full object-cover" />
      </div>

      {/* Body is plain text with blank-line paragraphs from the CMS. */}
      <div className="mt-8 space-y-5">
        {String(post.body || '')
          .split('\n')
          .filter((p) => p.trim())
          .map((para, i) => (
            <p key={i} className="text-[16.5px] leading-[1.75] text-ink-soft">
              {para}
            </p>
          ))}
      </div>

      {post.tags?.length > 0 && (
        <div className="mt-8 flex flex-wrap gap-2 border-t border-line pt-6">
          {post.tags.map((t) => (
            <span key={t} className="chip bg-blush text-ink-muted">#{t}</span>
          ))}
        </div>
      )}

      {post.products?.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-4 font-display text-xl font-semibold text-ink">Gifts from this guide</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {post.products.map((p) => (
              <Link key={p._id} to={`/gift/${p.slug}`} className="group flex gap-4 rounded-xl2 border border-line bg-white p-4 transition hover:border-rose-200 hover:shadow-soft">
                <Img src={p.images?.[0]} alt={p.name} seed={p.slug} className="h-20 w-20 shrink-0 rounded-xl object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-sm font-semibold text-ink transition group-hover:text-rose-600">{p.name}</p>
                  <p className="mt-1.5 text-[15px] font-bold text-ink">{inr(p.price)}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <div className="mt-12 rounded-4xl bg-gradient-to-br from-rose-50 to-gold-50 p-8 text-center">
        <h2 className="font-display text-2xl font-semibold text-ink">Ready to send one?</h2>
        <p className="mt-2 text-[15px] text-ink-muted">Enter your PIN code and see what can reach them today.</p>
        <Link to="/gifts" className="btn-primary mt-5">
          Browse gifts <ChevronRight size={15} />
        </Link>
      </div>
    </article>
  );
}
