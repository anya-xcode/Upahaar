import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../../lib/api.js';
import { OrderStatusBadge } from './AccountHome.jsx';
import { Img, DeliveryBadge, Skeleton, EmptyState, Pagination } from '../../../components/common/ui.jsx';
import { ChevronRight, Truck } from '../../../components/common/Icons.jsx';
import { inr, formatDateTime } from '../../../lib/format.js';

const FILTERS = [
  ['', 'All'],
  ['PLACED', 'Placed'],
  ['PREPARING', 'Preparing'],
  ['OUT_FOR_DELIVERY', 'On the way'],
  ['DELIVERED', 'Delivered'],
  ['CANCELLED', 'Cancelled'],
];

export default function Orders() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    setLoading(true);
    api
      .get('/orders', { params: { status: status || undefined, page, limit: 10 } })
      .then(({ data: d }) => setData(d))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [status, page]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-3xl font-semibold text-ink">My orders</h1>
        <p className="mt-1.5 text-sm text-ink-muted">Every gift you've sent, and where it is right now.</p>
      </div>

      <div className="hide-scrollbar mb-6 -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        {FILTERS.map(([key, label]) => (
          <button
            key={key}
            onClick={() => {
              setStatus(key);
              setPage(1);
            }}
            className={`shrink-0 rounded-full px-4 py-1.5 text-[13px] font-semibold transition ${
              status === key ? 'bg-rose-500 text-white' : 'border border-line bg-white text-ink-muted hover:border-rose-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32 w-full rounded-xl2" />)}
        </div>
      ) : !data?.orders?.length ? (
        <EmptyState
          icon="gift"
          title={status ? 'No orders here' : 'No orders yet'}
          message={status ? 'Try another filter.' : 'When you send your first gift, it will show up here.'}
          action={<Link to="/gifts" className="btn-primary">Browse gifts</Link>}
        />
      ) : (
        <>
          <div className="space-y-4">
            {data.orders.map((o) => {
              const live = !['DELIVERED', 'CANCELLED'].includes(o.status);
              return (
                <Link
                  key={o._id}
                  to={`/account/orders/${o.orderId}`}
                  className="card block p-5 transition hover:border-rose-200 hover:shadow-lift"
                >
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="font-display text-[15px] font-bold text-ink">{o.orderId}</span>
                      <OrderStatusBadge status={o.status} />
                      {live && (
                        <span className="flex items-center gap-1 text-[11px] font-bold text-rose-600">
                          <Truck size={12} /> Live
                        </span>
                      )}
                    </div>
                    <span className="text-[12px] text-ink-muted">{formatDateTime(o.createdAt)}</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex -space-x-3">
                      {o.items.slice(0, 3).map((it) => (
                        <Img
                          key={it._id}
                          src={it.image}
                          alt={it.name}
                          seed={it.name}
                          className="h-14 w-14 rounded-xl border-2 border-white object-cover"
                        />
                      ))}
                      {o.items.length > 3 && (
                        <span className="flex h-14 w-14 items-center justify-center rounded-xl border-2 border-white bg-blush text-[12px] font-bold text-ink-muted">
                          +{o.items.length - 3}
                        </span>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-1 text-sm font-semibold text-ink">
                        {o.items.map((i) => i.name).join(', ')}
                      </p>
                      <p className="mt-1 text-[12px] text-ink-muted">
                        To {o.shippingAddress.name} · {o.shippingAddress.city} {o.shippingAddress.pincode}
                      </p>
                    </div>

                    <div className="shrink-0 text-right">
                      <p className="font-display text-lg font-bold text-ink">{inr(o.total)}</p>
                      <span className="mt-1 inline-flex items-center gap-1 text-[12px] font-semibold text-rose-600">
                        {live ? 'Track' : 'View'} <ChevronRight size={13} />
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          <Pagination page={data.page} pages={data.pages} onChange={setPage} className="mt-8" />
        </>
      )}
    </div>
  );
}
