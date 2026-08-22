import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../lib/api.js';
import { PageHeader, StatCard, PanelCard, RevenueChart, DonutChart, BarsChart } from '../../components/common/panel.jsx';
import { Badge, Skeleton, EmptyState } from '../../components/common/ui.jsx';
import { OrderStatusBadge } from '../customer/account/AccountHome.jsx';
import {
  Rupee, Users, Store, Gift, Grid, Star, Warning, ChevronRight, Truck, Shield, Bell,
} from '../../components/common/Icons.jsx';
import { inr, formatDateTime, timeAgo } from '../../lib/format.js';
import { NotificationGlyph } from '../../lib/glyphs.jsx';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [generatedAt, setGeneratedAt] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [orders, setOrders] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/admin/dashboard'),
      api.get('/admin/analytics'),
      api.get('/admin/orders', { params: { limit: 6 } }),
      api.get('/admin/notifications'),
    ])
      .then(([d, a, o, n]) => {
        setStats(d.data.stats);
        setGeneratedAt(d.data.generatedAt);
        setAnalytics(a.data);
        setOrders(o.data.orders);
        setNotifications(n.data.notifications.slice(0, 5));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-32 w-full rounded-xl2" />)}
        </div>
        <Skeleton className="h-80 w-full rounded-xl2" />
      </div>
    );
  }

  if (!stats) return <EmptyState icon="chart" title="Could not load the dashboard" />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Platform overview"
        subtitle={
          // These figures are read through a short-lived cache, so say when they
          // were taken rather than implying they are live to the second.
          generatedAt
            ? `Everything happening across Upahaar · figures as of ${formatDateTime(generatedAt)}`
            : 'Everything happening across Upahaar right now.'
        }
        action={
          <div className="flex gap-2">
            <Link to="/admin/analytics" className="btn-ghost btn-sm">Full analytics <ChevronRight size={13} /></Link>
            <Link to="/admin/sellers?status=PENDING" className="btn-primary btn-sm">Review sellers</Link>
          </div>
        }
      />

      {/* Action queue */}
      {(stats.pendingSellers > 0 || stats.pendingKyc > 0 || stats.pendingProducts > 0 || stats.pendingReviews > 0) && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {stats.pendingSellers > 0 && (
            <ActionTile to="/admin/sellers?status=PENDING" icon={Store} tone="rose" title={`${stats.pendingSellers} seller application(s)`} sub="Waiting for approval" />
          )}
          {stats.pendingKyc > 0 && (
            <ActionTile to="/admin/sellers?kyc=PENDING" icon={Shield} tone="gold" title={`${stats.pendingKyc} KYC submission(s)`} sub="Documents to verify" />
          )}
          {stats.pendingProducts > 0 && (
            <ActionTile to="/admin/products?approval=PENDING" icon={Grid} tone="rose" title={`${stats.pendingProducts} product(s) to review`} sub="Submitted by sellers" />
          )}
          {stats.pendingReviews > 0 && (
            <ActionTile to="/admin/reviews?status=PENDING" icon={Star} tone="blue" title={`${stats.pendingReviews} review(s) flagged`} sub="Awaiting moderation" />
          )}
        </div>
      )}

      {/* Primary stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Rupee} label="Total revenue" value={inr(stats.revenue)} sub={`${inr(stats.todayRevenue)} today`} tone="green" />
        <StatCard icon={Rupee} label="Commission earned" value={inr(stats.commission)} sub="platform take" tone="gold" />
        <StatCard icon={Gift} label="Total orders" value={stats.totalOrders} sub={`${stats.todaysOrders} today`} to="/admin/orders" />
        <StatCard icon={Truck} label="Cancelled" value={stats.cancelledOrders} sub={`${inr(stats.refunds)} refunded`} tone="red" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Users} label="Customers" value={stats.totalUsers} sub="registered" to="/admin/users" tone="blue" />
        <StatCard icon={Store} label="Sellers" value={stats.totalSellers} sub={`${stats.activeSellers} active`} to="/admin/sellers" tone="rose" />
        <StatCard icon={Grid} label="Live products" value={stats.activeProducts} sub={`${stats.pendingProducts || 0} awaiting review`} to="/admin/products" tone="ink" />
        <StatCard icon={Warning} label="Pending approvals" value={stats.pendingSellers + stats.pendingKyc} sub="sellers + KYC" tone="gold" to="/admin/sellers" />
      </div>

      {/* Charts */}
      <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr]">
        <PanelCard title="Revenue" subtitle="Last 30 days">
          <RevenueChart data={analytics?.dailySales || []} height={280} />
        </PanelCard>

        <PanelCard title="Orders by delivery speed" subtitle="What customers are choosing">
          <DonutChart data={(analytics?.ordersByTier || []).map((t) => ({ name: t.label, value: t.orders }))} height={280} />
        </PanelCard>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <PanelCard title="Orders by category" subtitle="Top 10 by revenue">
          {analytics?.ordersByCategory?.length ? (
            <BarsChart
              data={analytics.ordersByCategory.map((c) => ({ name: c.name, revenue: Math.round(c.revenue) }))}
              xKey="name"
              dataKey="revenue"
              label="Revenue"
              money
              height={280}
            />
          ) : (
            <EmptyState icon="chart" title="No category data yet" />
          )}
        </PanelCard>

        <PanelCard title="Orders by location" subtitle="Busiest PIN codes" padded={false}>
          {analytics?.ordersByLocation?.length ? (
            <div className="divide-y divide-line">
              {analytics.ordersByLocation.slice(0, 8).map((l, i) => (
                <div key={l.pincode} className="flex items-center gap-3 px-5 py-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blush text-[11px] font-bold text-ink-muted">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-semibold text-ink">{l.pincode}</p>
                    <p className="text-[11.5px] text-ink-faint">{l.city}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-[13px] font-bold text-ink">{inr(l.revenue)}</p>
                    <p className="text-[11px] text-ink-faint">{l.orders} orders</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-5"><EmptyState icon="location" title="No location data yet" /></div>
          )}
        </PanelCard>
      </div>

      {/* Recent activity */}
      <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
        <PanelCard
          title="Latest orders"
          padded={false}
          action={<Link to="/admin/orders" className="btn-ghost btn-sm">View all <ChevronRight size={13} /></Link>}
        >
          {orders.length ? (
            <div className="divide-y divide-line">
              {orders.map((o) => (
                <Link key={o._id} to={`/admin/orders/${o.orderId}`} className="flex items-center gap-3 px-5 py-3.5 transition hover:bg-blush">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[12.5px] font-bold text-ink">{o.orderId}</span>
                      <OrderStatusBadge status={o.status} />
                    </div>
                    <p className="mt-0.5 text-[11.5px] text-ink-faint">
                      {o.customerName} · {o.shippingAddress?.city} {o.shippingAddress?.pincode} · {timeAgo(o.createdAt)}
                    </p>
                  </div>
                  <span className="shrink-0 text-[13px] font-bold text-ink">{inr(o.total)}</span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="p-5"><EmptyState icon="gift" title="No orders yet" /></div>
          )}
        </PanelCard>

        <PanelCard title="Notifications" padded={false}>
          {notifications.length ? (
            <div className="divide-y divide-line">
              {notifications.map((n) => (
                <Link key={n._id} to={n.link || '/admin'} className="flex items-start gap-3 px-5 py-3.5 transition hover:bg-blush">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blush text-rose-500">
                    <NotificationGlyph icon={n.icon} size={16} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-semibold text-ink">{n.title}</p>
                    <p className="text-[11.5px] text-ink-muted">{n.body}</p>
                    <p className="mt-0.5 text-[11px] text-ink-faint">{timeAgo(n.createdAt)}</p>
                  </div>
                  {!n.isRead && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-rose-500" />}
                </Link>
              ))}
            </div>
          ) : (
            <div className="p-5"><EmptyState icon="bell" title="Nothing new" /></div>
          )}
        </PanelCard>
      </div>

      {/* Seller leaderboard */}
      <PanelCard title="Top sellers" subtitle="By revenue" padded={false}>
        {analytics?.topSellers?.length ? (
          <div className="divide-y divide-line">
            {analytics.topSellers.map((s, i) => (
              <Link key={s._id} to={`/admin/sellers/${s._id}`} className="flex items-center gap-3 px-5 py-3.5 transition hover:bg-blush">
                <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[12px] font-bold ${
                  i === 0 ? 'bg-gold-100 text-gold-600' : 'bg-blush text-ink-muted'
                }`}>
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[13.5px] font-semibold text-ink">{s.businessName}</p>
                  <p className="flex items-center gap-1 text-[11.5px] text-ink-faint">
                    <Star size={10} className="text-gold-400" /> {s.rating?.toFixed(1)} · {s.orders} orders
                  </p>
                </div>
                <span className="shrink-0 text-[13.5px] font-bold text-ink">{inr(s.revenue)}</span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="p-5"><EmptyState icon="store" title="No seller data yet" /></div>
        )}
      </PanelCard>
    </div>
  );
}

function ActionTile({ to, icon: Icon, tone, title, sub }) {
  const tones = {
    rose: 'border-rose-200 bg-rose-50 text-rose-700',
    gold: 'border-gold-200 bg-gold-50 text-gold-600',
    blue: 'border-[#D5E6FA] bg-[#EAF3FF] text-[#2C5B93]',
  };
  return (
    <Link to={to} className={`flex items-center gap-3 rounded-xl2 border p-4 transition hover:shadow-soft ${tones[tone]}`}>
      <Icon size={20} className="shrink-0" />
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-bold">{title}</span>
        <span className="block text-[12px] opacity-80">{sub}</span>
      </span>
      <ChevronRight size={16} className="shrink-0" />
    </Link>
  );
}
