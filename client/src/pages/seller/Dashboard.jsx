import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../lib/api.js';
import { PageHeader, StatCard, PanelCard, RevenueChart, DonutChart } from '../../components/common/panel.jsx';
import { Img, Badge, Rating, Skeleton, EmptyState } from '../../components/common/ui.jsx';
import { OrderStatusBadge } from '../customer/account/AccountHome.jsx';
import {
  Rupee, Gift, Package, Star, Warning, ChevronRight, Plus, Truck, Clock,
} from '../../components/common/Icons.jsx';
import { inr, compact, formatDateTime } from '../../lib/format.js';

export default function SellerDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/seller/dashboard')
      .then(({ data: d }) => setData(d))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32 w-full rounded-xl2" />)}
        </div>
        <Skeleton className="h-80 w-full rounded-xl2" />
      </div>
    );
  }

  if (!data) return <EmptyState icon="chart" title="Could not load your dashboard" />;

  const { stats, charts, recentOrders, seller } = data;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Hello, ${seller.businessName}`}
        subtitle="Here's how your store is doing."
        action={
          <div className="flex gap-2">
            <Link to="/seller/orders" className="btn-ghost btn-sm"><Gift size={14} /> Orders</Link>
            <Link to="/seller/products/new" className="btn-primary btn-sm"><Plus size={14} /> Add product</Link>
          </div>
        }
      />

      {/* Attention strip */}
      {(stats.pendingOrders > 0 || stats.lowStock > 0 || stats.outOfStock > 0) && (
        <div className="grid gap-3 sm:grid-cols-3">
          {stats.pendingOrders > 0 && (
            <Link to="/seller/orders?status=PLACED" className="flex items-center gap-3 rounded-xl2 border border-rose-200 bg-rose-50 p-4 transition hover:shadow-soft">
              <Clock size={20} className="shrink-0 text-rose-600" />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-bold text-rose-700">{stats.pendingOrders} order(s) waiting</span>
                <span className="block text-[12px] text-rose-600/80">Accept them to start the clock</span>
              </span>
              <ChevronRight size={16} className="shrink-0 text-rose-600" />
            </Link>
          )}
          {stats.lowStock > 0 && (
            <Link to="/seller/inventory" className="flex items-center gap-3 rounded-xl2 border border-gold-200 bg-gold-50 p-4 transition hover:shadow-soft">
              <Warning size={20} className="shrink-0 text-gold-600" />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-bold text-gold-600">{stats.lowStock} item(s) low on stock</span>
                <span className="block text-[12px] text-gold-600/80">Restock before they sell out</span>
              </span>
              <ChevronRight size={16} className="shrink-0 text-gold-600" />
            </Link>
          )}
          {stats.outOfStock > 0 && (
            <Link to="/seller/inventory" className="flex items-center gap-3 rounded-xl2 border border-[#F8D7D5] bg-[#FEF6F5] p-4 transition hover:shadow-soft">
              <Package size={20} className="shrink-0 text-[#B3261E]" />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-bold text-[#B3261E]">{stats.outOfStock} item(s) out of stock</span>
                <span className="block text-[12px] text-[#B3261E]/80">Hidden from customers right now</span>
              </span>
              <ChevronRight size={16} className="shrink-0 text-[#B3261E]" />
            </Link>
          )}
        </div>
      )}

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Rupee} label="Total sales" value={inr(stats.totalSales)} sub={`${stats.totalOrders} orders all time`} tone="green" />
        <StatCard icon={Gift} label="Today's orders" value={stats.todaysOrders} sub={`${stats.pendingOrders} pending`} to="/seller/orders" />
        <StatCard icon={Truck} label="Completed" value={stats.completedOrders} sub={`${stats.cancelledOrders} cancelled`} tone="blue" />
        <StatCard icon={Rupee} label="Pending payout" value={inr(stats.pendingEarnings)} sub={`after ${seller.commissionRate}% commission`} tone="gold" to="/seller/payouts" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Package} label="Products" value={stats.productCount} sub={`${stats.activeProducts} live`} to="/seller/products" tone="ink" />
        <StatCard icon={Warning} label="Low stock" value={stats.lowStock} sub={`${stats.outOfStock} out of stock`} tone="gold" to="/seller/inventory" />
        <StatCard icon={Star} label="Store rating" value={seller.rating?.toFixed(1) || '—'} sub={`${seller.reviewCount} reviews`} tone="gold" to="/seller/reviews" />
        <StatCard icon={Truck} label="Delivery rating" value={seller.deliveryRating?.toFixed(1) || '—'} sub="from customers" tone="blue" />
      </div>

      {/* Charts */}
      <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
        <PanelCard title="Revenue" subtitle="Last 14 days">
          <RevenueChart data={charts.dailySales} />
        </PanelCard>

        <PanelCard title="Orders by delivery speed" subtitle="How customers choose">
          {charts.byTier?.length ? (
            <DonutChart data={charts.byTier.map((t) => ({ name: t.label, value: t.count }))} />
          ) : (
            <EmptyState icon="chart" title="No orders yet" />
          )}
        </PanelCard>
      </div>

      {/* Recent orders */}
      <PanelCard
        title="Recent orders"
        padded={false}
        action={<Link to="/seller/orders" className="btn-ghost btn-sm">View all <ChevronRight size={13} /></Link>}
      >
        {recentOrders?.length ? (
          <div className="divide-y divide-line">
            {recentOrders.map((o) => (
              <Link key={o._id} to={`/seller/orders/${o.orderId}`} className="flex items-center gap-4 p-4 transition hover:bg-blush">
                <Img src={o.items[0]?.image} alt={o.items[0]?.name} seed={o.orderId} className="h-12 w-12 shrink-0 rounded-xl object-cover" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[12.5px] font-bold text-ink">{o.orderId}</span>
                    <OrderStatusBadge status={o.status} />
                  </div>
                  <p className="mt-0.5 line-clamp-1 text-[13px] text-ink-soft">{o.items.map((i) => i.name).join(', ')}</p>
                  <p className="text-[11.5px] text-ink-faint">
                    {o.customerName} · {o.shippingAddress?.pincode} · {formatDateTime(o.createdAt)}
                  </p>
                </div>
                <span className="shrink-0 text-sm font-bold text-ink">{inr(o.total)}</span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="p-5">
            <EmptyState icon="gift" title="No orders yet" message="Once customers near you start ordering, they'll appear here." />
          </div>
        )}
      </PanelCard>
    </div>
  );
}
