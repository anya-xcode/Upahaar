import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../../../lib/api.js';
import { toast } from '../../../store/toastStore.js';
import { OrderStatusBadge } from './AccountHome.jsx';
import OrderTimeline, { DeliveryPartnerCard } from '../../../components/customer/OrderTimeline.jsx';
import { Img, Badge, DeliveryBadge, Modal, Skeleton, EmptyState, Spinner } from '../../../components/common/ui.jsx';
import { MapPin, Gift, ChevronLeft, ChevronRight, Refresh, Star, Check, Store } from '../../../components/common/Icons.jsx';
import { inr, formatDateTime } from '../../../lib/format.js';

export default function OrderDetail() {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [tracking, setTracking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [reviewFor, setReviewFor] = useState(null);
  const [reviewed, setReviewed] = useState([]);

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
    const interval = setInterval(load, 20000);
    return () => clearInterval(interval);
  }, [orderId]);

  async function cancelOrder() {
    if (!window.confirm('Cancel this order? Any payment will be refunded.')) return;
    setCancelling(true);
    try {
      await api.post(`/orders/${orderId}/cancel`, { reason: 'Cancelled by customer' });
      toast.success('Order cancelled');
      await load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setCancelling(false);
    }
  }

  async function simulate() {
    try {
      await api.post(`/orders/${orderId}/simulate`);
      await load();
    } catch (err) {
      toast.error(err.message);
    }
  }

  if (loading) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-28 w-full rounded-xl2" />
        <Skeleton className="h-72 w-full rounded-xl2" />
      </div>
    );
  }

  if (!order) {
    return <EmptyState icon="search" title="Order not found" action={<Link to="/account/orders" className="btn-primary">My orders</Link>} />;
  }

  const canCancel = ['PLACED', 'ACCEPTED', 'PREPARING'].includes(order.status);
  const isDone = ['DELIVERED', 'CANCELLED'].includes(order.status);

  return (
    <div>
      <Link to="/account/orders" className="mb-5 inline-flex items-center gap-1 text-[13px] font-semibold text-ink-muted transition hover:text-rose-600">
        <ChevronLeft size={15} /> All orders
      </Link>

      {/* Header */}
      <div className="card mb-6 p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="font-display text-2xl font-semibold text-ink">{order.orderId}</h1>
              <OrderStatusBadge status={order.status} />
              {tracking?.tierMeta && <DeliveryBadge tier={tracking.tier} meta={tracking.tierMeta} />}
            </div>
            <p className="mt-1.5 text-[13px] text-ink-muted">Placed {formatDateTime(order.createdAt)}</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button onClick={load} className="btn-ghost btn-sm"><Refresh size={14} /> Refresh</button>
            {canCancel && (
              <button onClick={cancelOrder} disabled={cancelling} className="btn-ghost btn-sm !border-[#F8D7D5] !text-[#B3261E]">
                {cancelling ? <Spinner size={13} /> : null} Cancel order
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          {/* Timeline */}
          <section className="card p-5 sm:p-6">
            <h2 className="mb-5 font-display text-lg font-semibold text-ink">Order tracking</h2>
            <OrderTimeline
              steps={tracking?.steps || []}
              estimatedDeliveryAt={order.estimatedDeliveryAt}
              deliveredAt={order.deliveredAt}
            />
            {tracking?.deliveryPartner?.name && (
              <div className="mt-5"><DeliveryPartnerCard partner={tracking.deliveryPartner} /></div>
            )}
            {!isDone && (
              <button onClick={simulate} className="btn-ghost btn-sm mt-5"><ChevronRight size={13} /> Advance status (demo)</button>
            )}
          </section>

          {/* Items */}
          <section className="card p-5 sm:p-6">
            <h2 className="mb-4 font-display text-lg font-semibold text-ink">
              {order.items.length} item{order.items.length === 1 ? '' : 's'}
            </h2>
            <div className="space-y-4">
              {order.items.map((item) => (
                <div key={item._id} className="flex gap-4">
                  <Img src={item.image} alt={item.name} seed={item.name} className="h-16 w-16 shrink-0 rounded-xl object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-ink">{item.name}</p>
                    <p className="text-[12px] text-ink-muted">
                      Qty {item.quantity}{item.variant && ` · ${item.variant}`}
                    </p>
                    {item.personalization?.message && (
                      <p className="mt-1.5 rounded-lg bg-blush px-2.5 py-1.5 text-[12px] italic text-ink-muted">
                        "{item.personalization.message}"
                      </p>
                    )}
                    {order.status === 'DELIVERED' && !reviewed.includes(String(item.product)) && (
                      <button
                        onClick={() => setReviewFor(item)}
                        className="mt-2 inline-flex items-center gap-1 text-[12px] font-semibold text-rose-600 hover:underline"
                      >
                        <Star size={12} /> Write a review
                      </button>
                    )}
                    {reviewed.includes(String(item.product)) && (
                      <p className="mt-2 inline-flex items-center gap-1 text-[12px] font-semibold text-[#1F6B45]">
                        <Check size={12} /> Reviewed
                      </p>
                    )}
                  </div>
                  <p className="shrink-0 text-sm font-bold text-ink">{inr(item.lineTotal)}</p>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Sidebar */}
        <aside className="space-y-5">
          <section className="card p-5">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-ink">
              <MapPin size={15} className="text-rose-500" /> Delivery address
            </h3>
            <p className="text-sm font-semibold text-ink">{order.shippingAddress.name}</p>
            <p className="mt-1 text-[13px] leading-relaxed text-ink-muted">
              {order.shippingAddress.house}, {order.shippingAddress.street}
              {order.shippingAddress.landmark && `, near ${order.shippingAddress.landmark}`}
              <br />
              {order.shippingAddress.city}, {order.shippingAddress.state} — {order.shippingAddress.pincode}
            </p>
            <p className="mt-1.5 text-[12px] text-ink-faint">{order.shippingAddress.mobile}</p>
            {order.specialInstructions && (
              <p className="mt-3 rounded-lg bg-blush px-3 py-2 text-[12px] text-ink-muted">
                {order.specialInstructions}
              </p>
            )}
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
                <p className="mt-3 rounded-xl bg-blush px-3.5 py-3 font-display text-[13.5px] italic leading-relaxed text-ink-soft">
                  "{order.giftOptions.giftMessage}"
                </p>
              )}
            </section>
          )}

          <section className="card p-5">
            <h3 className="mb-3 text-sm font-bold text-ink">Payment</h3>
            <div className="space-y-2 text-[13px]">
              <Row label="Subtotal" value={inr(order.subtotal)} />
              {order.personalizationTotal > 0 && <Row label="Personalisation" value={inr(order.personalizationTotal)} />}
              {order.giftOptionsTotal > 0 && <Row label="Gift options" value={inr(order.giftOptionsTotal)} />}
              <Row label="Delivery" value={order.deliveryFee > 0 ? inr(order.deliveryFee) : 'Free'} />
              {order.discount > 0 && <Row label={order.coupon?.code || 'Discount'} value={`− ${inr(order.discount)}`} />}
              <div className="flex items-center justify-between border-t border-line pt-2.5">
                <span className="font-bold text-ink">Total</span>
                <span className="text-base font-bold text-ink">{inr(order.total)}</span>
              </div>
              <div className="flex items-center justify-between pt-1 text-[12px]">
                <span className="text-ink-muted">{order.paymentMethod === 'COD' ? 'Cash on delivery' : order.paymentMethod}</span>
                <Badge tone={order.paymentStatus === 'PAID' ? 'green' : order.paymentStatus === 'REFUNDED' ? 'blue' : 'amber'} className="!text-[10px]">
                  {order.paymentStatus}
                </Badge>
              </div>
              {order.refundAmount > 0 && (
                <p className="rounded-lg bg-[#EAF3FF] px-3 py-2 text-[12px] text-[#2C5B93]">
                  Refund of {inr(order.refundAmount)} processed to your original payment method.
                </p>
              )}
            </div>
          </section>

          {order.sellers?.length > 0 && (
            <section className="card p-5">
              <h3 className="mb-3 text-sm font-bold text-ink">Sold by</h3>
              {order.sellers.map((s) => (
                <Link key={s._id} to={`/store/${s.slug}`} className="block text-[13px] font-semibold text-rose-600 hover:underline">
                  <Store size={13} className="mr-1 inline" /> {s.businessName}
                </Link>
              ))}
            </section>
          )}
        </aside>
      </div>

      <ReviewModal
        item={reviewFor}
        orderId={order.orderId}
        onClose={() => setReviewFor(null)}
        onDone={(productId) => {
          setReviewed((r) => [...r, String(productId)]);
          setReviewFor(null);
        }}
      />
    </div>
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

function ReviewModal({ item, orderId, onClose, onDone }) {
  const [productRating, setProductRating] = useState(5);
  const [sellerRating, setSellerRating] = useState(5);
  const [deliveryRating, setDeliveryRating] = useState(5);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/reviews', {
        productId: item.product,
        orderId,
        productRating,
        sellerRating,
        deliveryRating,
        title,
        comment,
      });
      toast.success('Thanks for the review');
      onDone(item.product);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={Boolean(item)} onClose={onClose} title="How was it?" subtitle={item?.name}>
      <form onSubmit={submit} className="space-y-5">
        <StarRow label="The gift itself" value={productRating} onChange={setProductRating} />
        <StarRow label="The seller" value={sellerRating} onChange={setSellerRating} />
        <StarRow label="Delivery experience" value={deliveryRating} onChange={setDeliveryRating} />

        <div>
          <label className="label">Headline</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Arrived in 40 minutes flat" className="input" />
        </div>

        <div>
          <label className="label">Tell us more</label>
          <textarea
            rows={4}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="What worked, what didn't, would you order again?"
            className="input resize-none"
          />
        </div>

        <button disabled={saving} className="btn-primary w-full">
          {saving ? <Spinner size={15} /> : <Star size={15} />} Post review
        </button>
      </form>
    </Modal>
  );
}

function StarRow({ label, value, onChange }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-[13.5px] font-semibold text-ink">{label}</span>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" onClick={() => onChange(n)} aria-label={`${n} stars`}>
            <Star size={22} filled={n <= value} className={n <= value ? 'text-gold-400' : 'text-line'} />
          </button>
        ))}
      </div>
    </div>
  );
}
