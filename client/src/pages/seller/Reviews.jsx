import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../lib/api.js';
import { PageHeader, PanelCard, StatCard } from '../../components/common/panel.jsx';
import { Img, Badge, Skeleton, EmptyState } from '../../components/common/ui.jsx';
import { Star, Truck, Store, Check } from '../../components/common/Icons.jsx';
import { formatDate } from '../../lib/format.js';

export default function SellerReviews() {
  const [reviews, setReviews] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/seller/reviews')
      .then(({ data }) => {
        setReviews(data.reviews);
        setSummary(data.summary);
      })
      .catch(() => setReviews([]))
      .finally(() => setLoading(false));
  }, []);

  // Distribution across the five star buckets, for the bar breakdown.
  const distribution = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.productRating === star).length,
  }));
  const maxCount = Math.max(1, ...distribution.map((d) => d.count));

  if (loading) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-40 w-full rounded-xl2" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Reviews" subtitle="What customers say about your gifts and your delivery." />

      <div className="mb-5 grid gap-4 sm:grid-cols-3">
        <StatCard icon={Star} label="Product rating" value={summary?.rating?.toFixed(1) || '—'} sub={`${summary?.count || 0} reviews`} tone="gold" />
        <StatCard icon={Store} label="Store rating" value={summary?.rating?.toFixed(1) || '—'} sub="how you're rated overall" tone="rose" />
        <StatCard icon={Truck} label="Delivery rating" value={summary?.deliveryRating?.toFixed(1) || '—'} sub="speed and condition" tone="blue" />
      </div>

      {reviews.length > 0 && (
        <PanelCard title="Rating breakdown" className="mb-5">
          <div className="space-y-2">
            {distribution.map(({ star, count }) => (
              <div key={star} className="flex items-center gap-3">
                <span className="flex w-12 shrink-0 items-center gap-1 text-[12.5px] font-semibold text-ink">
                  {star} <Star size={11} className="text-gold-400" />
                </span>
                <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-blush">
                  <div
                    className="h-full rounded-full bg-gold-300 transition-all"
                    style={{ width: `${(count / maxCount) * 100}%` }}
                  />
                </div>
                <span className="w-8 shrink-0 text-right text-[12px] text-ink-muted">{count}</span>
              </div>
            ))}
          </div>
        </PanelCard>
      )}

      <PanelCard title={`All reviews (${reviews.length})`} padded={false}>
        {!reviews.length ? (
          <div className="p-5">
            <EmptyState
              icon="star"
              title="No reviews yet"
              message="Once your first orders are delivered, customer reviews will show up here."
            />
          </div>
        ) : (
          <div className="divide-y divide-line">
            {reviews.map((r) => (
              <div key={r._id} className="p-5">
                <div className="flex gap-4">
                  {r.product && (
                    <Link to={`/gift/${r.product.slug}`} className="shrink-0">
                      <Img src={r.product.images?.[0]} alt={r.product.name} seed={r.product.slug} className="h-14 w-14 rounded-xl object-cover" />
                    </Link>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="line-clamp-1 text-[13.5px] font-semibold text-ink">{r.product?.name}</p>
                        <p className="text-[11.5px] text-ink-faint">
                          {r.userName} · {formatDate(r.createdAt)}
                        </p>
                      </div>
                      {r.isVerifiedPurchase && <Badge tone="green" className="!text-[10px]"><Check size={10} /> Verified</Badge>}
                    </div>

                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5">
                      <Stars label="Gift" value={r.productRating} />
                      <Stars label="Seller" value={r.sellerRating} />
                      <Stars label="Delivery" value={r.deliveryRating} />
                    </div>

                    {r.title && <p className="mt-3 font-display text-[15px] font-semibold text-ink">"{r.title}"</p>}
                    {r.comment && <p className="mt-1 text-[13px] leading-relaxed text-ink-muted">{r.comment}</p>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </PanelCard>
    </div>
  );
}

function Stars({ label, value }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="text-[10.5px] font-bold uppercase tracking-wide text-ink-faint">{label}</span>
      <span className="flex gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} size={11} filled={i < value} className={i < value ? 'text-gold-400' : 'text-line'} />
        ))}
      </span>
    </span>
  );
}
