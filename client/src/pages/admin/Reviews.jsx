import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../../lib/api.js';
import { toast } from '../../store/toastStore.js';
import { PageHeader, PanelCard, FilterTabs } from '../../components/common/panel.jsx';
import { Img, Badge, Pagination, EmptyState, Skeleton } from '../../components/common/ui.jsx';
import { Star, Check, Close, Warning } from '../../components/common/Icons.jsx';
import { formatDateTime } from '../../lib/format.js';

const FILTERS = [
  ['PENDING', 'Pending'],
  ['APPROVED', 'Approved'],
  ['REJECTED', 'Rejected'],
  ['', 'All'],
];

export default function AdminReviews() {
  const [params, setParams] = useSearchParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const status = params.get('status') ?? 'PENDING';

  async function load() {
    setLoading(true);
    try {
      const { data: d } = await api.get('/admin/reviews', {
        params: { status: status || undefined, page, limit: 20 },
      });
      setData(d);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [status, page]);

  async function moderate(review, next) {
    const note = next === 'REJECTED' ? window.prompt('Reason for rejecting this review?') : undefined;
    if (next === 'REJECTED' && note === null) return;
    try {
      await api.patch(`/admin/reviews/${review._id}`, { status: next, note });
      toast.success(`Review ${next.toLowerCase()}`);
      await load();
    } catch (err) {
      toast.error(err.message);
    }
  }

  return (
    <div>
      <PageHeader
        title="Review moderation"
        subtitle="Only approved reviews appear on the storefront and count towards ratings."
      />

      <div className="mb-4">
        <FilterTabs
          options={FILTERS}
          value={status}
          onChange={(v) => {
            const next = new URLSearchParams(params);
            if (v) next.set('status', v);
            else next.set('status', '');
            setParams(next);
            setPage(1);
          }}
        />
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-36 w-full rounded-xl2" />)}
        </div>
      ) : !data?.reviews?.length ? (
        <PanelCard>
          <EmptyState
            icon="star"
            title={status === 'PENDING' ? 'Nothing to moderate' : 'No reviews here'}
            message={status === 'PENDING' ? 'Every flagged review has been dealt with.' : 'Try another filter.'}
          />
        </PanelCard>
      ) : (
        <div className="space-y-4">
          {data.reviews.map((r) => (
            <div key={r._id} className={`card p-5 ${r.status === 'PENDING' ? 'border-gold-200' : ''}`}>
              <div className="flex flex-col gap-4 sm:flex-row">
                {r.product && (
                  <Link to={`/gift/${r.product.slug}`} className="shrink-0">
                    <Img src={r.product.images?.[0]} alt={r.product.name} seed={r.product.slug} className="h-16 w-16 rounded-xl object-cover" />
                  </Link>
                )}

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[13.5px] font-semibold text-ink">{r.product?.name || 'Product'}</p>
                      <p className="text-[11.5px] text-ink-faint">
                        {r.seller?.businessName} · by {r.userName} · {formatDateTime(r.createdAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {r.isVerifiedPurchase && <Badge tone="green" className="!text-[10px]"><Check size={10} /> Verified</Badge>}
                      <Badge tone={r.status === 'APPROVED' ? 'green' : r.status === 'PENDING' ? 'amber' : 'red'}>
                        {r.status}
                      </Badge>
                    </div>
                  </div>

                  <div className="mt-2.5 flex flex-wrap items-center gap-x-5 gap-y-1.5">
                    <Stars label="Gift" value={r.productRating} />
                    <Stars label="Seller" value={r.sellerRating} />
                    <Stars label="Delivery" value={r.deliveryRating} />
                  </div>

                  {r.title && <p className="mt-3 font-display text-[15px] font-semibold text-ink">"{r.title}"</p>}
                  {r.comment && <p className="mt-1 text-[13px] leading-relaxed text-ink-muted">{r.comment}</p>}

                  {r.moderationNote && (
                    <p className="mt-3 flex items-start gap-2 rounded-lg bg-blush px-3 py-2 text-[11.5px] text-ink-muted">
                      <Warning size={13} className="mt-0.5 shrink-0" /> {r.moderationNote}
                    </p>
                  )}

                  <div className="mt-4 flex flex-wrap gap-2 border-t border-line pt-4">
                    {r.status !== 'APPROVED' && (
                      <button onClick={() => moderate(r, 'APPROVED')} className="btn-primary btn-sm">
                        <Check size={13} /> Approve
                      </button>
                    )}
                    {r.status !== 'REJECTED' && (
                      <button onClick={() => moderate(r, 'REJECTED')} className="btn-ghost btn-sm !text-[#B3261E]">
                        <Close size={13} /> Reject
                      </button>
                    )}
                    {r.status !== 'PENDING' && (
                      <button onClick={() => moderate(r, 'PENDING')} className="btn-ghost btn-sm">
                        Move to pending
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}

          <Pagination page={data.page} pages={data.pages} onChange={setPage} className="mt-6" />
        </div>
      )}
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
