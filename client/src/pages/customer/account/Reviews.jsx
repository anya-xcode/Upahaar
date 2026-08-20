import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../../lib/api.js';
import { toast } from '../../../store/toastStore.js';
import { Img, Badge, Skeleton, EmptyState } from '../../../components/common/ui.jsx';
import { Star, Trash, ChevronRight } from '../../../components/common/Icons.jsx';
import { formatDate } from '../../../lib/format.js';

export default function Reviews() {
  const [reviews, setReviews] = useState([]);
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      const [mine, waiting] = await Promise.all([
        api.get('/reviews/mine'),
        api.get('/reviews/pending'),
      ]);
      setReviews(mine.data.reviews);
      setPending(waiting.data.pending);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function remove(id) {
    if (!window.confirm('Delete this review?')) return;
    try {
      await api.delete(`/reviews/${id}`);
      toast.success('Review deleted');
      await load();
    } catch (err) {
      toast.error(err.message);
    }
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32 w-full rounded-xl2" />)}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-semibold text-ink">My reviews</h1>
        <p className="mt-1.5 text-sm text-ink-muted">What you thought of the gifts you've sent.</p>
      </div>

      {/* Waiting on you */}
      {pending.length > 0 && (
        <section>
          <h2 className="mb-3 font-display text-lg font-semibold text-ink">Waiting for your review</h2>
          <div className="space-y-3">
            {pending.map((p) => (
              <Link
                key={`${p.orderId}-${p.product._id}`}
                to={`/account/orders/${p.orderId}`}
                className="card flex items-center gap-4 p-4 transition hover:border-rose-200"
              >
                <Img src={p.product.image} alt={p.product.name} seed={p.product.name} className="h-14 w-14 shrink-0 rounded-xl object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-1 text-sm font-semibold text-ink">{p.product.name}</p>
                  <p className="text-[12px] text-ink-muted">
                    {p.orderId} · delivered {formatDate(p.deliveredAt)}
                  </p>
                </div>
                <span className="shrink-0 text-[12px] font-semibold text-rose-600">
                  Review <ChevronRight size={13} className="inline" />
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Written */}
      <section>
        <h2 className="mb-3 font-display text-lg font-semibold text-ink">
          Your reviews {reviews.length > 0 && <span className="text-ink-faint">({reviews.length})</span>}
        </h2>

        {!reviews.length ? (
          <EmptyState
            icon="star"
            title="No reviews written yet"
            message="Once a gift is delivered you can tell everyone how it went."
            action={<Link to="/account/orders" className="btn-primary">See my orders</Link>}
          />
        ) : (
          <div className="space-y-4">
            {reviews.map((r) => (
              <div key={r._id} className="card p-5">
                <div className="flex gap-4">
                  {r.product && (
                    <Link to={`/gift/${r.product.slug}`} className="shrink-0">
                      <Img src={r.product.images?.[0]} alt={r.product.name} seed={r.product.slug} className="h-16 w-16 rounded-xl object-cover" />
                    </Link>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <Link to={r.product ? `/gift/${r.product.slug}` : '#'} className="line-clamp-1 text-sm font-semibold text-ink hover:text-rose-600">
                          {r.product?.name || 'Product'}
                        </Link>
                        <p className="text-[12px] text-ink-muted">{r.seller?.businessName}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {r.status !== 'APPROVED' && (
                          <Badge tone={r.status === 'PENDING' ? 'amber' : 'red'} className="!text-[10px]">
                            {r.status === 'PENDING' ? 'Under review' : 'Rejected'}
                          </Badge>
                        )}
                        <button onClick={() => remove(r._id)} className="rounded-lg p-1.5 text-ink-faint transition hover:bg-blush hover:text-[#B3261E]">
                          <Trash size={15} />
                        </button>
                      </div>
                    </div>

                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5">
                      <RatingRow label="Gift" value={r.productRating} />
                      <RatingRow label="Seller" value={r.sellerRating} />
                      <RatingRow label="Delivery" value={r.deliveryRating} />
                    </div>

                    {r.title && <p className="mt-3 font-display text-[15px] font-semibold text-ink">"{r.title}"</p>}
                    {r.comment && <p className="mt-1 text-[13px] leading-relaxed text-ink-muted">{r.comment}</p>}
                    <p className="mt-2.5 text-[11px] text-ink-faint">{formatDate(r.createdAt)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function RatingRow({ label, value }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint">{label}</span>
      <span className="flex gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} size={11} filled={i < value} className={i < value ? 'text-gold-400' : 'text-line'} />
        ))}
      </span>
    </span>
  );
}
