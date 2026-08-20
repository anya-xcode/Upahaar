import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../../lib/api.js';
import { toast } from '../../store/toastStore.js';
import OrderTimeline, { DeliveryPartnerCard } from '../../components/customer/OrderTimeline.jsx';
import { Img, Badge, DeliveryBadge, Skeleton, EmptyState, Spinner } from '../../components/common/ui.jsx';
import { MapPin, Gift, ChevronRight, Refresh, Check, Warning, Heart } from '../../components/common/Icons.jsx';
import { inr, formatDateTime } from '../../lib/format.js';

export default function OrderConfirmation() {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [tracking, setTracking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [advancing, setAdvancing] = useState(false);

  async function load() {
    try {
      const [o, t] = await Promise.all([
        api.get(`/orders/${orderId}`),
        api.get(`/orders/${orderId}/track`),
      ]);
      setOrder(o.data.order);
      setTracking(t.data);
    } catch {
      setOrder(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // Poll while the order is live so the timeline updates as the seller works.
    const interval = setInterval(load, 20000);
    return () => clearInterval(interval);
  }, [orderId]);

  /** Dev-only: walks the order forward so the timeline can be demonstrated. */
  async function simulate() {
    setAdvancing(true);
    try {
      await api.post(`/orders/${orderId}/simulate`);
      await load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setAdvancing(false);
    }
  }

  if (loading) {
    return (
      <div className="container-app space-y-6 py-14">
        <Skeleton className="h-48 w-full rounded-4xl" />
        <Skeleton className="h-64 w-full rounded-xl2" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container-app py-20">
        <EmptyState icon="search" title="Order not found" action={<Link to="/account/orders" className="btn-primary">My orders</Link>} />
      </div>
    );
  }

  const isDelivered = order.status === 'DELIVERED';
  const isCancelled = order.status === 'CANCELLED';

  return (
    <div className="container-app py-10">
      {/* Celebration header */}
      <div className="relative overflow-hidden rounded-4xl bg-gradient-to-br from-rose-50 via-blush to-gold-50 px-6 py-12 text-center sm:px-12">
        <div className="pointer-events-none absolute -left-16 -top-16 h-56 w-56 rounded-full bg-rose-200/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -right-10 h-64 w-64 rounded-full bg-gold-200/30 blur-3xl" />

        <div className="relative">
          <span className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-white text-rose-500 shadow-lift">
            {isCancelled ? <Warning size={30} /> : isDelivered ? <Heart size={30} filled /> : <Gift size={30} />}
          </span>
          <h1 className="font-display text-3xl font-semibold text-ink sm:text-4xl">
            {isCancelled
              ? 'This order was cancelled'
              : isDelivered
              ? 'Delivered. We hope it made their day.'
              : 'Your gift is on the way'}
          </h1>
          <p className="mt-2.5 text-[15px] text-ink-soft">
            {isCancelled
              ? 'Any payment made will be refunded to the original method.'
              : "We've let the seller know. You'll get an update at every step."}
          </p>

          <div className="mt-6 inline-flex flex-wrap items-center justify-center gap-x-6 gap-y-2 rounded-2xl bg-white/80 px-6 py-4 backdrop-blur">
            <Stat label="Order ID" value={order.orderId} />
            <Stat label="Total paid" value={inr(order.total)} />
            <Stat
              label={isDelivered ? 'Delivered' : 'Estimated delivery'}
              value={formatDateTime(isDelivered ? order.deliveredAt : order.estimatedDeliveryAt)}
            />
          </div>

          <div className="mt-6 flex flex-wrap justify-center gap-2.5">
            <Link to={`/account/orders/${order.orderId}`} className="btn-primary">
              Track this order <ChevronRight size={15} />
            </Link>
            <Link to="/gifts" className="btn-ghost">Continue shopping</Link>
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_380px]">
        {/* Tracking */}
        <div className="space-y-6">
          <section className="card p-5 sm:p-6">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-display text-lg font-semibold text-ink">Live order tracking</h2>
              <div className="flex items-center gap-2">
                {tracking?.tierMeta && <DeliveryBadge tier={tracking.tier} meta={tracking.tierMeta} />}
                <button onClick={load} className="rounded-full p-1.5 text-ink-faint transition hover:bg-blush hover:text-rose-600" aria-label="Refresh">
                  <Refresh size={15} />
                </button>
              </div>
            </div>

            <OrderTimeline
              steps={tracking?.steps || []}
              estimatedDeliveryAt={order.estimatedDeliveryAt}
              deliveredAt={order.deliveredAt}
            />

            {tracking?.deliveryPartner?.name && (
              <div className="mt-5">
                <DeliveryPartnerCard partner={tracking.deliveryPartner} />
              </div>
            )}

            {/* Demo affordance — real deployments drive this from the seller app. */}
            {!isDelivered && !isCancelled && (
              <button onClick={simulate} disabled={advancing} className="btn-ghost btn-sm mt-5">
                {advancing ? <Spinner size={13} /> : <ChevronRight size={13} />} Advance status (demo)
              </button>
            )}
          </section>

          {/* Items */}
          <section className="card p-5 sm:p-6">
            <h2 className="mb-4 font-display text-lg font-semibold text-ink">
              {order.items.length} item{order.items.length === 1 ? '' : 's'} in this order
            </h2>
            <div className="space-y-4">
              {order.items.map((item) => (
                <div key={item._id} className="flex gap-4">
                  <Img src={item.image} alt={item.name} seed={item.name} className="h-16 w-16 shrink-0 rounded-xl object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-ink">{item.name}</p>
                    <p className="text-xs text-ink-muted">
                      Qty {item.quantity}
                      {item.variant && ` · ${item.variant}`}
                    </p>
                    {item.personalization?.message && (
                      <p className="mt-1.5 rounded-lg bg-blush px-2.5 py-1.5 text-[12px] italic text-ink-muted">
                        "{item.personalization.message}"
                      </p>
                    )}
                  </div>
                  <p className="shrink-0 text-sm font-bold text-ink">{inr(item.lineTotal)}</p>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Order details */}
        <aside className="space-y-6">
          <section className="card p-5">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-ink">
              <MapPin size={15} className="text-rose-500" /> Delivering to
            </h3>
            <p className="text-sm font-semibold text-ink">{order.shippingAddress.name}</p>
            <p className="mt-1 text-[13px] leading-relaxed text-ink-muted">
              {order.shippingAddress.house}, {order.shippingAddress.street}
              {order.shippingAddress.landmark && `, near ${order.shippingAddress.landmark}`}
              <br />
              {order.shippingAddress.city}, {order.shippingAddress.state} — {order.shippingAddress.pincode}
            </p>
            <p className="mt-1.5 text-xs text-ink-faint">{order.shippingAddress.mobile}</p>
          </section>

          {(order.giftOptions?.giftWrap || order.giftOptions?.greetingCard || order.giftOptions?.giftMessage) && (
            <section className="card p-5">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-ink">
                <Gift size={15} className="text-rose-500" /> Gift options
              </h3>
              <div className="flex flex-wrap gap-2">
                {order.giftOptions.giftWrap && <Badge tone="rose">Gift wrapped</Badge>}
                {order.giftOptions.greetingCard && <Badge tone="rose">Greeting card</Badge>}
                {order.giftOptions.hidePrice && <Badge tone="neutral">Price hidden</Badge>}
              </div>
              {order.giftOptions.giftMessage && (
                <p className="mt-3 rounded-xl bg-blush px-3.5 py-3 font-display text-[14px] italic leading-relaxed text-ink-soft">
                  "{order.giftOptions.giftMessage}"
                </p>
              )}
            </section>
          )}

          <section className="card p-5">
            <h3 className="mb-3 text-sm font-bold text-ink">Payment summary</h3>
            <div className="space-y-2 text-sm">
              <Row label="Subtotal" value={inr(order.subtotal)} />
              {order.personalizationTotal > 0 && <Row label="Personalisation" value={inr(order.personalizationTotal)} />}
              {order.giftOptionsTotal > 0 && <Row label="Gift options" value={inr(order.giftOptionsTotal)} />}
              <Row label="Delivery" value={order.deliveryFee > 0 ? inr(order.deliveryFee) : 'Free'} />
              {order.discount > 0 && (
                <Row label={`Coupon ${order.coupon?.code || ''}`} value={<span className="text-[#1F6B45]">− {inr(order.discount)}</span>} />
              )}
              <div className="flex items-center justify-between border-t border-line pt-2.5">
                <span className="font-bold text-ink">Total</span>
                <span className="text-lg font-bold text-ink">{inr(order.total)}</span>
              </div>
              <p className="flex items-center gap-1.5 pt-1 text-xs text-ink-muted">
                <Check size={12} className="text-[#1F6B45]" />
                {order.paymentMethod === 'COD' ? 'Cash on delivery' : `Paid via ${order.paymentMethod}`}
              </p>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <span className="text-left">
      <span className="block text-[10px] font-bold uppercase tracking-[0.14em] text-ink-faint">{label}</span>
      <span className="block text-sm font-bold text-ink">{value}</span>
    </span>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-ink-muted">{label}</span>
      <span className="font-medium text-ink">{value}</span>
    </div>
  );
}
