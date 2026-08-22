import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../../lib/api.js';
import { toast } from '../../store/toastStore.js';
import { PageHeader, PanelCard } from '../../components/common/panel.jsx';
import OrderTimeline from '../../components/customer/OrderTimeline.jsx';
import { OrderStatusBadge } from '../customer/account/AccountHome.jsx';
import { Img, Badge, DeliveryBadge, Skeleton, EmptyState } from '../../components/common/ui.jsx';
import { ChevronLeft, MapPin, Gift, Rupee, Store, Users } from '../../components/common/Icons.jsx';
import { TIER_BADGES } from '../../lib/glyphs.jsx';
import { inr, formatDateTime } from '../../lib/format.js';

const ORDER_FLOW = ['PLACED', 'ACCEPTED', 'PREPARING', 'READY_FOR_PICKUP', 'PICKED_UP', 'OUT_FOR_DELIVERY', 'DELIVERED'];
const LABELS = {
  PLACED: 'Order placed', ACCEPTED: 'Seller accepted', PREPARING: 'Preparing',
  READY_FOR_PICKUP: 'Ready for pickup', PICKED_UP: 'Picked up',
  OUT_FOR_DELIVERY: 'Out for delivery', DELIVERED: 'Delivered', CANCELLED: 'Cancelled',
};
export default function AdminOrderDetail() {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      const { data } = await api.get(`/admin/orders/${orderId}`);
      setOrder(data.order);
      setPayment(data.payment);
    } catch {
      setOrder(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [orderId]);

  async function refund() {
    const input = window.prompt('Refund amount (₹)', String(order.total));
    if (input === null) return;
    try {
      await api.post(`/admin/orders/${orderId}/refund`, { amount: Number(input) });
      toast.success('Refund recorded');
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
    return <EmptyState icon="search" title="Order not found" action={<Link to="/admin/orders" className="btn-primary">All orders</Link>} />;
  }

  const done = new Map(order.timeline.map((t) => [t.status, t]));
  const steps = (order.status === 'CANCELLED' ? ['PLACED', 'CANCELLED'] : ORDER_FLOW).map((status) => ({
    status,
    label: LABELS[status],
    at: done.get(status)?.at || null,
    complete: done.has(status),
    current: order.status === status,
  }));

  return (
    <div>
      <Link to="/admin/orders" className="mb-4 inline-flex items-center gap-1 text-[13px] font-semibold text-ink-muted transition hover:text-rose-600">
        <ChevronLeft size={15} /> All orders
      </Link>

      <PageHeader
        title={
          <span className="flex flex-wrap items-center gap-3">
            {order.orderId}
            <OrderStatusBadge status={order.status} />
            <DeliveryBadge tier={order.deliveryTier} meta={TIER_BADGES[order.deliveryTier]} />
          </span>
        }
        subtitle={`Placed ${formatDateTime(order.createdAt)}`}
        action={
          order.paymentStatus !== 'REFUNDED' && (
            <button onClick={refund} className="btn-ghost btn-sm !text-[#B3261E]">
              <Rupee size={14} /> Issue refund
            </button>
          )
        }
      />

      <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
        <div className="space-y-5">
          <PanelCard title={`${order.items.length} item(s)`}>
            <div className="space-y-4">
              {order.items.map((item) => (
                <div key={item._id} className="flex gap-4">
                  <Img src={item.image} alt={item.name} seed={item.name} className="h-14 w-14 shrink-0 rounded-xl object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[13.5px] font-semibold text-ink">{item.name}</p>
                    <p className="text-[11.5px] text-ink-muted">
                      Qty {item.quantity}{item.variant && ` · ${item.variant}`}
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
            </div>
          </PanelCard>

          <PanelCard title="Order journey">
            <OrderTimeline steps={steps} estimatedDeliveryAt={order.estimatedDeliveryAt} deliveredAt={order.deliveredAt} />
            {order.cancellationReason && (
              <p className="mt-4 rounded-xl bg-[#FEF6F5] px-4 py-3 text-[12.5px] text-[#B3261E]">
                {order.cancellationReason}
              </p>
            )}
          </PanelCard>
        </div>

        <aside className="space-y-5">
          <PanelCard title="Customer">
            <p className="flex items-center gap-2 text-sm font-bold text-ink">
              <Users size={15} className="text-rose-500" /> {order.customer?.name || order.customerName}
            </p>
            <p className="mt-1 text-[12px] text-ink-muted">{order.customer?.email}</p>
            <p className="text-[12px] text-ink-muted">{order.shippingAddress.mobile}</p>

            <div className="mt-4 border-t border-line pt-4">
              <p className="label"><MapPin size={11} className="mr-1 inline" /> Delivery address</p>
              <p className="text-[12.5px] leading-relaxed text-ink-soft">
                {order.shippingAddress.house}, {order.shippingAddress.street}
                {order.shippingAddress.landmark && `, near ${order.shippingAddress.landmark}`}
                <br />
                {order.shippingAddress.city}, {order.shippingAddress.state}
                <br />
                <span className="font-bold text-rose-600">{order.shippingAddress.pincode}</span>
              </p>
            </div>
          </PanelCard>

          <PanelCard title="Seller(s)">
            {order.sellers?.map((s) => (
              <Link key={s._id} to={`/admin/sellers/${s._id}`} className="flex items-center gap-2 text-[13px] font-semibold text-rose-600 hover:underline">
                <Store size={14} /> {s.businessName}
              </Link>
            ))}
            {order.deliveryPartner?.name && (
              <div className="mt-4 rounded-xl bg-blush p-3">
                <p className="text-[11px] font-bold uppercase tracking-wide text-ink-faint">Delivery partner</p>
                <p className="mt-1 text-[13px] font-semibold text-ink">{order.deliveryPartner.name}</p>
                <p className="text-[11.5px] text-ink-muted">{order.deliveryPartner.vehicle} · {order.deliveryPartner.mobile}</p>
              </div>
            )}
          </PanelCard>

          <PanelCard title="Money">
            <div className="space-y-2 text-[13px]">
              <Row label="Subtotal" value={inr(order.subtotal)} />
              {order.personalizationTotal > 0 && <Row label="Personalisation" value={inr(order.personalizationTotal)} />}
              {order.giftOptionsTotal > 0 && <Row label="Gift options" value={inr(order.giftOptionsTotal)} />}
              <Row label="Delivery fee" value={order.deliveryFee > 0 ? inr(order.deliveryFee) : 'Free'} />
              {order.discount > 0 && <Row label={`Coupon ${order.coupon?.code || ''}`} value={`− ${inr(order.discount)}`} />}
              <div className="flex items-center justify-between border-t border-line pt-2.5">
                <span className="font-bold text-ink">Order total</span>
                <span className="text-base font-bold text-ink">{inr(order.total)}</span>
              </div>
              <Row label="Platform commission" value={<span className="text-[#1F6B45]">{inr(order.commissionAmount)}</span>} />
              {order.refundAmount > 0 && <Row label="Refunded" value={<span className="text-[#B3261E]">{inr(order.refundAmount)}</span>} />}
            </div>

            <div className="mt-4 space-y-2 border-t border-line pt-4 text-[12.5px]">
              <Row label="Method" value={order.paymentMethod} />
              <Row
                label="Status"
                value={
                  <Badge tone={order.paymentStatus === 'PAID' ? 'green' : order.paymentStatus === 'REFUNDED' ? 'blue' : 'amber'}>
                    {order.paymentStatus}
                  </Badge>
                }
              />
              {payment?.reference && <Row label="Reference" value={<span className="font-mono text-[11px]">{payment.reference}</span>} />}
              {payment?.gateway && <Row label="Gateway" value={payment.gateway} />}
            </div>
          </PanelCard>

          {(order.giftOptions?.giftWrap || order.giftOptions?.greetingCard || order.giftOptions?.giftMessage) && (
            <PanelCard title="Gift options">
              <div className="flex flex-wrap gap-1.5">
                {order.giftOptions.giftWrap && <Badge tone="rose" className="!text-[10px]">Gift wrapped</Badge>}
                {order.giftOptions.greetingCard && <Badge tone="rose" className="!text-[10px]">Greeting card</Badge>}
                {order.giftOptions.hidePrice && <Badge tone="neutral" className="!text-[10px]">Price hidden</Badge>}
              </div>
              {order.giftOptions.giftMessage && (
                <p className="mt-3 rounded-lg bg-blush px-3 py-2.5 font-display text-[13px] italic text-ink-soft">
                  "{order.giftOptions.giftMessage}"
                </p>
              )}
            </PanelCard>
          )}
        </aside>
      </div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-ink-muted">{label}</span>
      <span className="text-right font-semibold text-ink">{value}</span>
    </div>
  );
}
