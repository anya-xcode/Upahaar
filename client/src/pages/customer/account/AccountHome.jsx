import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../../lib/api.js';
import { useAuth } from '../../../store/authStore.js';
import { toast } from '../../../store/toastStore.js';
import { Img, Badge, DeliveryBadge, Skeleton, EmptyState } from '../../../components/common/ui.jsx';
import { Gift, Heart, Calendar, Star, ChevronRight, Tag, Truck } from '../../../components/common/Icons.jsx';
import { inr, formatDate } from '../../../lib/format.js';

export default function AccountHome() {
  const user = useAuth((s) => s.user);
  const [summary, setSummary] = useState(null);
  const [orders, setOrders] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/account/summary'),
      api.get('/orders', { params: { limit: 3 } }),
      api.get('/account/reminders'),
    ])
      .then(([s, o, r]) => {
        setSummary(s.data.summary);
        setOrders(o.data.orders);
        setReminders(r.data.reminders.slice(0, 3));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full rounded-xl2" />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-xl2" />)}
        </div>
        <Skeleton className="h-64 w-full rounded-xl2" />
      </div>
    );
  }

  const firstName = user?.name?.split(' ')[0];

  return (
    <div className="space-y-8">
      {/* Greeting */}
      <div className="overflow-hidden rounded-xl2 bg-gradient-to-br from-rose-50 via-blush to-gold-50 p-6 sm:p-8">
        <h1 className="font-display text-3xl font-semibold text-ink">Hello, {firstName}</h1>
        <p className="mt-1.5 text-[15px] text-ink-soft">
          {summary?.activeOrders > 0
            ? `You have ${summary.activeOrders} gift${summary.activeOrders === 1 ? '' : 's'} on the way.`
            : "Nothing in transit right now — who deserves a surprise?"}
        </p>
        <div className="mt-5 flex flex-wrap gap-2.5">
          <Link to="/gifts" className="btn-primary btn-sm">Find a gift</Link>
          {summary?.activeOrders > 0 && (
            <Link to="/account/orders" className="btn-ghost btn-sm"><Truck size={14} /> Track orders</Link>
          )}
        </div>
      </div>

      {/* Stat tiles */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile to="/account/orders" icon={Gift} label="Orders" value={summary?.orders} sub={`${summary?.activeOrders || 0} active`} />
        <StatTile to="/account/wishlist" icon={Heart} label="Wishlist" value={summary?.wishlist} sub="saved gifts" />
        <StatTile to="/account/reminders" icon={Calendar} label="Reminders" value={summary?.reminders} sub="occasions saved" />
        <StatTile to="/account/reviews" icon={Star} label="Reviews" value={summary?.reviews} sub="written" />
      </div>

      {/* Referral */}
      <div className="card flex flex-wrap items-center justify-between gap-4 p-5">
        <div>
          <p className="flex items-center gap-2 text-sm font-bold text-ink">
            <Tag size={15} className="text-rose-500" /> Your referral code
          </p>
          <p className="mt-1 text-[13px] text-ink-muted">
            Share it — your friend gets ₹150 off, you earn ₹150 when they order.
          </p>
        </div>
        <button
          onClick={() => {
            navigator.clipboard?.writeText(summary?.referralCode || '');
            toast.success('Referral code copied');
          }}
          className="rounded-xl border-2 border-dashed border-rose-200 bg-rose-50 px-5 py-2.5 font-display text-lg font-bold tracking-wider text-rose-700 transition hover:bg-rose-100"
        >
          {summary?.referralCode}
        </button>
      </div>

      {/* Recent orders */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold text-ink">Recent orders</h2>
          <Link to="/account/orders" className="text-[13px] font-semibold text-rose-600 hover:underline">
            View all
          </Link>
        </div>

        {orders.length ? (
          <div className="space-y-3">
            {orders.map((o) => (
              <Link
                key={o._id}
                to={`/account/orders/${o.orderId}`}
                className="card flex items-center gap-4 p-4 transition hover:border-rose-200 hover:shadow-lift"
              >
                <Img src={o.items[0]?.image} alt={o.items[0]?.name} seed={o.orderId} className="h-16 w-16 shrink-0 rounded-xl object-cover" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[12px] font-bold text-ink-faint">{o.orderId}</span>
                    <OrderStatusBadge status={o.status} />
                  </div>
                  <p className="mt-1 line-clamp-1 text-sm font-semibold text-ink">
                    {o.items[0]?.name}
                    {o.items.length > 1 && ` + ${o.items.length - 1} more`}
                  </p>
                  <p className="mt-0.5 text-[12px] text-ink-muted">{formatDate(o.createdAt)}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-[15px] font-bold text-ink">{inr(o.total)}</p>
                  <ChevronRight size={16} className="ml-auto mt-1 text-ink-faint" />
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState
            icon="gift"
            title="No orders yet"
            message="Your first gift is waiting to be found."
            action={<Link to="/gifts" className="btn-primary">Browse gifts</Link>}
          />
        )}
      </section>

      {/* Upcoming reminders */}
      {reminders.length > 0 && (
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-xl font-semibold text-ink">Coming up</h2>
            <Link to="/account/reminders" className="text-[13px] font-semibold text-rose-600 hover:underline">
              Manage
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {reminders.map((r) => (
              <div key={r._id} className="card p-4">
                <p className="text-sm font-bold text-ink">{r.title}</p>
                <p className="mt-0.5 text-[12px] text-ink-muted">{r.relation}</p>
                <Badge tone={r.isDue ? 'rose' : 'neutral'} className="mt-3 !text-[10px]">
                  {r.daysUntil === 0 ? 'Today!' : `in ${r.daysUntil} days`}
                </Badge>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function StatTile({ to, icon: Icon, label, value, sub }) {
  return (
    <Link to={to} className="card p-4 transition hover:-translate-y-0.5 hover:border-rose-200 hover:shadow-lift">
      <Icon size={18} className="mb-2.5 text-rose-500" />
      <p className="font-display text-2xl font-bold text-ink">{value ?? 0}</p>
      <p className="text-[12px] font-semibold text-ink">{label}</p>
      <p className="text-[11px] text-ink-faint">{sub}</p>
    </Link>
  );
}

export function OrderStatusBadge({ status }) {
  const tones = {
    PLACED: 'neutral',
    ACCEPTED: 'blue',
    PREPARING: 'amber',
    READY_FOR_PICKUP: 'amber',
    PICKED_UP: 'blue',
    OUT_FOR_DELIVERY: 'blue',
    DELIVERED: 'green',
    CANCELLED: 'red',
  };
  const labels = {
    PLACED: 'Placed',
    ACCEPTED: 'Accepted',
    PREPARING: 'Preparing',
    READY_FOR_PICKUP: 'Ready',
    PICKED_UP: 'Picked up',
    OUT_FOR_DELIVERY: 'Out for delivery',
    DELIVERED: 'Delivered',
    CANCELLED: 'Cancelled',
  };
  return <Badge tone={tones[status] || 'neutral'} className="!text-[10px]">{labels[status] || status}</Badge>;
}
