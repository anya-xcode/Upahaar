import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../../lib/api.js';
import { toast } from '../../store/toastStore.js';
import { PageHeader, PanelCard } from '../../components/common/panel.jsx';
import OrderTimeline from '../../components/customer/OrderTimeline.jsx';
import { OrderStatusBadge } from '../customer/account/AccountHome.jsx';
import { Img, Badge, DeliveryBadge, Skeleton, EmptyState, Spinner } from '../../components/common/ui.jsx';
import { ChevronLeft, MapPin, Phone, Gift, Refresh } from '../../components/common/Icons.jsx';
import { inr, formatDateTime } from '../../lib/format.js';

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

export default function SellerOrderDetail() {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [flow, setFlow] = useState([]);
  const [statusMeta, setStatusMeta] = useState({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  async function load() {
    try {
      const { data } = await api.get(`/seller/orders/${orderId}`);
      setOrder(data.order);
      setFlow(data.flow);
      setStatusMeta(data.statusMeta);
    } catch {
      setOrder(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [orderId]);

  async function advance() {
    const next = NEXT_STEP[order.status];
    if (!next) return;
    setBusy(true);
    try {
      await api.patch(`/seller/orders/${orderId}/status`, { status: next.status });
      toast.success(next.label);
      await load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function cancel() {
    const reason = window.prompt('Why are you cancelling this order?');
    if (reason === null) return;
    try {
      await api.post(`/seller/orders/${orderId}/cancel`, { reason });
      toast.success('Order cancelled');
      await load();
    } catch (err) {
      toast.error(err.message);
    }
  }

  if (loading) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-80 w-full rounded-xl2" />
      </div>
    );
  }

  if (!order) {
    return <EmptyState icon="search" title="Order not found" action={<Link to="/seller/orders" className="btn-primary">All orders</Link>} />;
  }

  // Build the timeline shape the shared component expects.
  const done = new Map(order.timeline.map((t) => [t.status, t]));
  const steps = (order.status === 'CANCELLED' ? ['PLACED', 'CANCELLED'] : flow).map((status) => ({
    status,
    label: statusMeta[status]?.label || status,
    at: done.get(status)?.at || null,
    complete: done.has(status),
    current: order.status === status,
  }));

  const next = NEXT_STEP[order.status];

  return (
    <div>
      <Link to="/seller/orders" className="mb-4 inline-flex items-center gap-1 text-[13px] font-semibold text-ink-muted transition hover:text-rose-600">
        <ChevronLeft size={15} /> All orders
      </Link>

      <PageHeader
        title={
          <span className="flex flex-wrap items-center gap-3">
            {order.orderId}
            <OrderStatusBadge status={order.status} />
            <DeliveryBadge tier={order.deliveryTier} meta={TIER_META[order.deliveryTier]} />
          </span>
        }
        subtitle={`Placed ${formatDateTime(order.createdAt)}`}
        action={
          <div className="flex flex-wrap gap-2">
            <button onClick={load} className="btn-ghost btn-sm"><Refresh size={14} /></button>
            {!['DELIVERED', 'CANCELLED'].includes(order.status) && (
              <button onClick={cancel} className="btn-ghost btn-sm !text-[#B3261E]">Cancel order</button>
            )}
            {next && (
              <button onClick={advance} disabled={busy} className="btn-primary btn-sm">
                {busy ? <Spinner size={13} /> : null} {next.label}
              </button>
            )}
          </div>
        }
      />

      <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
        <div className="space-y-5">
          <PanelCard title="Items to prepare">
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
                      <div className="mt-2 rounded-xl border border-rose-200 bg-rose-50 p-3">
                        <p className="text-[11px] font-bold uppercase tracking-wide text-rose-600">Personalisation</p>
                        <p className="mt-1 font-display text-[14px] italic text-ink">"{item.personalization.message}"</p>
                        {item.personalization.photoUrl && (
                          <a href={item.personalization.photoUrl} target="_blank" rel="noreferrer" className="mt-2 inline-block">
                            <Img src={item.personalization.photoUrl} alt="Customer upload" seed="upload" className="h-20 w-20 rounded-lg object-cover" />
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                  <span className="shrink-0 text-sm font-bold text-ink">{inr(item.lineTotal)}</span>
                </div>
              ))}
            </div>

            {(order.giftOptions?.giftWrap || order.giftOptions?.greetingCard || order.giftOptions?.giftMessage) && (
              <div className="mt-5 rounded-xl bg-blush p-4">
                <p className="flex items-center gap-2 text-[12.5px] font-bold text-ink">
                  <Gift size={14} className="text-rose-500" /> Gift options to apply
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {order.giftOptions.giftWrap && <Badge tone="rose" className="!text-[10px]">Gift wrap</Badge>}
                  {order.giftOptions.greetingCard && <Badge tone="rose" className="!text-[10px]">Greeting card</Badge>}
                  {order.giftOptions.hidePrice && <Badge tone="neutral" className="!text-[10px]">No invoice in parcel</Badge>}
                </div>
                {order.giftOptions.giftMessage && (
                  <div className="mt-3 rounded-lg bg-white p-3">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-ink-faint">Write on the card</p>
                    <p className="mt-1 font-display text-[14px] italic leading-relaxed text-ink">
                      "{order.giftOptions.giftMessage}"
                    </p>
                  </div>
                )}
              </div>
            )}

            {order.specialInstructions && (
              <p className="mt-4 rounded-xl bg-gold-50 px-4 py-3 text-[12.5px] text-gold-600">
                <span className="font-semibold">Special instructions:</span> {order.specialInstructions}
              </p>
            )}
          </PanelCard>

          <PanelCard title="Order progress">
            <OrderTimeline steps={steps} estimatedDeliveryAt={order.estimatedDeliveryAt} deliveredAt={order.deliveredAt} />
          </PanelCard>
        </div>

        <aside className="space-y-5">
          <PanelCard title="Customer">
            <p className="text-sm font-bold text-ink">{order.shippingAddress.name}</p>
            <p className="mt-2 flex items-start gap-2 text-[13px] leading-relaxed text-ink-muted">
              <MapPin size={14} className="mt-0.5 shrink-0 text-rose-400" />
              <span>
                {order.shippingAddress.house}, {order.shippingAddress.street}
                {order.shippingAddress.landmark && `, near ${order.shippingAddress.landmark}`}
                <br />
                {order.shippingAddress.city}, {order.shippingAddress.state}
                <br />
                <span className="font-bold text-rose-600">{order.shippingAddress.pincode}</span>
              </span>
            </p>
            <a href={`tel:${order.shippingAddress.mobile}`} className="btn-ghost btn-sm mt-4 w-full">
              <Phone size={14} /> {order.shippingAddress.mobile}
            </a>
          </PanelCard>

          <PanelCard title="Delivery slot">
            <div className="space-y-2 text-[13px]">
              <Row label="Tier" value={TIER_META[order.deliveryTier]?.badge} />
              {order.deliverySlot?.window && <Row label="Window" value={order.deliverySlot.window} />}
              <Row label="Estimated" value={formatDateTime(order.estimatedDeliveryAt)} />
              {order.deliveredAt && <Row label="Delivered" value={formatDateTime(order.deliveredAt)} />}
            </div>
            {order.deliveryPartner?.name && (
              <div className="mt-4 rounded-xl bg-blush p-3">
                <p className="text-[11px] font-bold uppercase tracking-wide text-ink-faint">Delivery partner</p>
                <p className="mt-1 text-[13px] font-semibold text-ink">{order.deliveryPartner.name}</p>
                <p className="text-[11.5px] text-ink-muted">{order.deliveryPartner.vehicle}</p>
              </div>
            )}
          </PanelCard>

          <PanelCard title="Payment">
            <div className="space-y-2 text-[13px]">
              <Row label="Items" value={inr(order.subtotal)} />
              {order.personalizationTotal > 0 && <Row label="Personalisation" value={inr(order.personalizationTotal)} />}
              {order.giftOptionsTotal > 0 && <Row label="Gift options" value={inr(order.giftOptionsTotal)} />}
              <Row label="Delivery" value={order.deliveryFee > 0 ? inr(order.deliveryFee) : 'Free'} />
              {order.discount > 0 && <Row label="Discount" value={`− ${inr(order.discount)}`} />}
              <div className="flex items-center justify-between border-t border-line pt-2.5">
                <span className="font-bold text-ink">Order total</span>
                <span className="text-base font-bold text-ink">{inr(order.total)}</span>
              </div>
              <div className="flex items-center justify-between pt-1">
                <span className="text-ink-muted">Method</span>
                <Badge tone={order.paymentStatus === 'PAID' ? 'green' : order.paymentStatus === 'REFUNDED' ? 'blue' : 'amber'}>
                  {order.paymentMethod === 'COD' ? 'COD' : order.paymentMethod} · {order.paymentStatus}
                </Badge>
              </div>
              {order.paymentMethod === 'COD' && order.status !== 'DELIVERED' && (
                <p className="rounded-lg bg-gold-50 px-3 py-2 text-[11.5px] text-gold-600">
                  Collect {inr(order.total)} from the customer on delivery.
                </p>
              )}
            </div>
          </PanelCard>
        </aside>
      </div>
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
