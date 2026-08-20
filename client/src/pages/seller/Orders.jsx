import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../lib/api.js';
import { toast } from '../../store/toastStore.js';
import { PageHeader, PanelCard, FilterTabs, SearchInput } from '../../components/common/panel.jsx';
import { Img, Badge, DeliveryBadge, Pagination, EmptyState, Skeleton, Spinner } from '../../components/common/ui.jsx';
import { OrderStatusBadge } from '../customer/account/AccountHome.jsx';
import { MapPin, ChevronRight, Clock } from '../../components/common/Icons.jsx';
import { inr, formatDateTime, timeAgo } from '../../lib/format.js';

const COLUMNS = [
  ['', 'All'],
  ['PLACED', 'New'],
  ['ACCEPTED', 'Accepted'],
  ['PREPARING', 'Preparing'],
  ['READY_FOR_PICKUP', 'Ready'],
  ['PICKED_UP', 'Picked up'],
  ['OUT_FOR_DELIVERY', 'On the way'],
  ['DELIVERED', 'Delivered'],
  ['CANCELLED', 'Cancelled'],
];

/** The seller may only move an order to the next step — mirrors the API. */
const NEXT_STEP = {
  PLACED: { status: 'ACCEPTED', label: 'Accept Order' },
  ACCEPTED: { status: 'PREPARING', label: 'Start Preparing' },
  PREPARING: { status: 'READY_FOR_PICKUP', label: 'Ready for Pickup' },
  READY_FOR_PICKUP: { status: 'PICKED_UP', label: 'Mark Picked Up' },
  PICKED_UP: { status: 'OUT_FOR_DELIVERY', label: 'Out for Delivery' },
  OUT_FOR_DELIVERY: { status: 'DELIVERED', label: 'Mark Delivered' },
};

/** Badge text only — DeliveryBadge supplies the glyph from the tier key. */
const TIER_META = {
  EXPRESS_60: { badge: '60 MIN' },
  PRIORITY_3H: { badge: '3 HOURS' },
  NEXT_DAY: { badge: 'TOMORROW' },
  STANDARD_2_3D: { badge: '2–3 DAYS' },
};

export default function SellerOrders() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);

  const status = params.get('status') || '';

  async function load() {
    setLoading(true);
    try {
      const { data: d } = await api.get('/seller/orders', {
        params: { status: status || undefined, q: q || undefined, page, limit: 15 },
      });
      setData(d);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const t = setTimeout(load, q ? 300 : 0);
    return () => clearTimeout(t);
  }, [status, q, page]);

  // New orders should surface without the seller refreshing.
  useEffect(() => {
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, [status, q, page]);

  async function advance(order) {
    const next = NEXT_STEP[order.status];
    if (!next) return;
    setBusyId(order._id);
    try {
      await api.patch(`/seller/orders/${order.orderId}/status`, { status: next.status });
      toast.success(`${order.orderId} → ${next.label}`);
      await load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusyId(null);
    }
  }

  async function cancel(order) {
    const reason = window.prompt('Why are you cancelling this order?');
    if (reason === null) return;
    try {
      await api.post(`/seller/orders/${order.orderId}/cancel`, { reason });
      toast.success('Order cancelled');
      await load();
    } catch (err) {
      toast.error(err.message);
    }
  }

  return (
    <div>
      <PageHeader
        title="Orders"
        subtitle={data ? `${data.total} order${data.total === 1 ? '' : 's'}` : 'Your live order queue'}
      />

      <div className="mb-4 space-y-3">
        <FilterTabs
          options={COLUMNS}
          value={status}
          counts={data?.counts}
          onChange={(v) => {
            const next = new URLSearchParams(params);
            if (v) next.set('status', v);
            else next.delete('status');
            setParams(next);
            setPage(1);
          }}
        />
        <SearchInput value={q} onChange={(v) => { setQ(v); setPage(1); }} placeholder="Search by order ID…" className="w-full sm:w-64" />
      </div>

      {loading && !data ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-40 w-full rounded-xl2" />)}
        </div>
      ) : !data?.orders?.length ? (
        <PanelCard>
          <EmptyState
            icon="gift"
            title={status ? 'No orders in this state' : 'No orders yet'}
            message={status ? 'Try another tab.' : 'When a customer near you orders, it lands here instantly.'}
          />
        </PanelCard>
      ) : (
        <div className="space-y-4">
          {data.orders.map((order) => {
            const next = NEXT_STEP[order.status];
            const isNew = order.status === 'PLACED';
            const isExpress = order.deliveryTier === 'EXPRESS_60';

            return (
              <div
                key={order._id}
                className={`card overflow-hidden ${isNew ? 'border-rose-300 shadow-glow' : ''}`}
              >
                {/* Header */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-blush/50 px-5 py-3">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <Link to={`/seller/orders/${order.orderId}`} className="font-display text-[15px] font-bold text-ink hover:text-rose-600">
                      {order.orderId}
                    </Link>
                    <OrderStatusBadge status={order.status} />
                    <DeliveryBadge tier={order.deliveryTier} meta={TIER_META[order.deliveryTier]} />
                    {isNew && (
                      <Badge tone="rose" className="animate-fade-in">New</Badge>
                    )}
                  </div>
                  <span className="flex items-center gap-1.5 text-[11.5px] text-ink-muted">
                    <Clock size={12} /> {timeAgo(order.createdAt)}
                  </span>
                </div>

                <div className="grid gap-5 p-5 lg:grid-cols-[1fr_260px]">
                  {/* Items */}
                  <div className="space-y-3">
                    {order.items.map((item) => (
                      <div key={item._id} className="flex gap-3">
                        <Img src={item.image} alt={item.name} seed={item.name} className="h-14 w-14 shrink-0 rounded-xl object-cover" />
                        <div className="min-w-0 flex-1">
                          <p className="text-[13.5px] font-semibold text-ink">{item.name}</p>
                          <p className="text-[11.5px] text-ink-muted">
                            Qty {item.quantity}
                            {item.variant && ` · ${item.variant}`}
                          </p>
                          {item.personalization?.message && (
                            <p className="mt-1 rounded-lg bg-blush px-2.5 py-1.5 text-[11.5px] italic text-ink-muted">
                              "{item.personalization.message}"
                            </p>
                          )}
                        </div>
                        <span className="shrink-0 text-[13px] font-bold text-ink">{inr(item.lineTotal)}</span>
                      </div>
                    ))}

                    {(order.giftOptions?.giftWrap || order.giftOptions?.greetingCard) && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {order.giftOptions.giftWrap && <Badge tone="rose" className="!text-[10px]">Gift wrap</Badge>}
                        {order.giftOptions.greetingCard && <Badge tone="rose" className="!text-[10px]">Greeting card</Badge>}
                        {order.giftOptions.hidePrice && <Badge tone="neutral" className="!text-[10px]">Hide price</Badge>}
                      </div>
                    )}

                    {order.specialInstructions && (
                      <p className="rounded-lg bg-gold-50 px-3 py-2 text-[11.5px] text-gold-600">
                        {order.specialInstructions}
                      </p>
                    )}
                  </div>

                  {/* Customer + actions */}
                  <div className="space-y-3 border-t border-line pt-4 lg:border-l lg:border-t-0 lg:pl-5 lg:pt-0">
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-wide text-ink-faint">Deliver to</p>
                      <p className="mt-1 text-[13px] font-semibold text-ink">{order.shippingAddress.name}</p>
                      <p className="text-[11.5px] leading-relaxed text-ink-muted">
                        {order.shippingAddress.house}, {order.shippingAddress.city}
                      </p>
                      <p className="mt-1 flex items-center gap-1 text-[12px] font-bold text-rose-600">
                        <MapPin size={11} /> {order.shippingAddress.pincode}
                      </p>
                      <p className="mt-1 text-[11.5px] text-ink-faint">{order.shippingAddress.mobile}</p>
                    </div>

                    <div className="border-t border-line pt-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[12px] text-ink-muted">Order total</span>
                        <span className="text-[15px] font-bold text-ink">{inr(order.total)}</span>
                      </div>
                      <p className="mt-0.5 text-right text-[11px] text-ink-faint">
                        {order.paymentMethod === 'COD' ? 'Collect on delivery' : `Paid via ${order.paymentMethod}`}
                      </p>
                    </div>

                    <div className="flex flex-col gap-2">
                      {next && (
                        <button
                          onClick={() => advance(order)}
                          disabled={busyId === order._id}
                          className={isNew || isExpress ? 'btn-primary btn-sm' : 'btn-dark btn-sm'}
                        >
                          {busyId === order._id ? <Spinner size={13} /> : null} {next.label}
                        </button>
                      )}
                      <div className="flex gap-2">
                        <Link to={`/seller/orders/${order.orderId}`} className="btn-ghost btn-sm flex-1">
                          Details <ChevronRight size={13} />
                        </Link>
                        {!['DELIVERED', 'CANCELLED'].includes(order.status) && (
                          <button onClick={() => cancel(order)} className="btn-ghost btn-sm !text-[#B3261E]">
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          <Pagination page={data.page} pages={data.pages} onChange={setPage} className="mt-6" />
        </div>
      )}
    </div>
  );
}
