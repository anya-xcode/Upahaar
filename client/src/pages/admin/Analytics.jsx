import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../lib/api.js';
import { PageHeader, PanelCard, StatCard, RevenueChart, BarsChart, DonutChart } from '../../components/common/panel.jsx';
import { Badge, Skeleton, EmptyState } from '../../components/common/ui.jsx';
import { Rupee, Gift, Star, MapPin, Bolt } from '../../components/common/Icons.jsx';
import { inr } from '../../lib/format.js';

export default function Analytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/admin/analytics')
      .then(({ data: d }) => setData(d))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-80 w-full rounded-xl2" />
        <Skeleton className="h-80 w-full rounded-xl2" />
      </div>
    );
  }

  if (!data) return <EmptyState icon="chart" title="Could not load analytics" />;

  const totalOrders = data.ordersByTier.reduce((n, t) => n + t.orders, 0);
  const expressOrders = data.ordersByTier.find((t) => t.tier === 'EXPRESS_60')?.orders || 0;
  const fastOrders = data.ordersByTier
    .filter((t) => ['EXPRESS_60', 'PRIORITY_3H'].includes(t.tier))
    .reduce((n, t) => n + t.orders, 0);
  const monthRevenue = data.monthlyRevenue.at(-1)?.revenue || 0;

  return (
    <div className="space-y-5">
      <PageHeader title="Analytics" subtitle="Revenue, delivery speed, categories and geography." />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Rupee} label="This month" value={inr(monthRevenue)} sub="revenue" tone="green" />
        <StatCard icon={Gift} label="Total orders" value={totalOrders} sub="all time" tone="ink" />
        <StatCard icon={Bolt} label="Express orders" value={expressOrders} sub={`${totalOrders ? Math.round((expressOrders / totalOrders) * 100) : 0}% of all orders`} tone="rose" />
        <StatCard icon={Bolt} label="Fast delivery" value={fastOrders} sub="60 min + 3 hour combined" tone="gold" />
      </div>

      <PanelCard title="Daily sales" subtitle="Last 30 days">
        <RevenueChart data={data.dailySales} height={300} />
      </PanelCard>

      <div className="grid gap-5 lg:grid-cols-2">
        <PanelCard title="Monthly revenue" subtitle="Trailing 12 months">
          {data.monthlyRevenue?.length ? (
            <BarsChart data={data.monthlyRevenue} xKey="month" dataKey="revenue" label="Revenue" money height={280} />
          ) : (
            <EmptyState icon="chart" title="Not enough history yet" />
          )}
        </PanelCard>

        <PanelCard title="Orders by delivery speed" subtitle="The core of the product">
          <DonutChart data={data.ordersByTier.map((t) => ({ name: t.label, value: t.orders }))} height={280} />
        </PanelCard>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <PanelCard title="Orders by category" subtitle="Where the money is">
          {data.ordersByCategory?.length ? (
            <BarsChart
              data={data.ordersByCategory.map((c) => ({ name: c.name, revenue: Math.round(c.revenue) }))}
              xKey="name"
              dataKey="revenue"
              label="Revenue"
              money
              height={300}
            />
          ) : (
            <EmptyState icon="chart" title="No category data yet" />
          )}
        </PanelCard>

        <PanelCard title="Delivery tier revenue" padded={false}>
          <div className="divide-y divide-line">
            {data.ordersByTier.map((t) => (
              <div key={t.tier} className="flex items-center gap-3 px-5 py-4">
                <Badge tone={t.tier === 'EXPRESS_60' ? 'rose' : t.tier === 'PRIORITY_3H' ? 'amber' : t.tier === 'NEXT_DAY' ? 'blue' : 'neutral'}>
                  {t.badge}
                </Badge>
                <div className="min-w-0 flex-1">
                  <div className="h-2 overflow-hidden rounded-full bg-blush">
                    <div
                      className="h-full rounded-full bg-rose-400"
                      style={{ width: `${totalOrders ? (t.orders / totalOrders) * 100 : 0}%` }}
                    />
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-[13px] font-bold text-ink">{inr(t.revenue)}</p>
                  <p className="text-[11px] text-ink-faint">{t.orders} orders</p>
                </div>
              </div>
            ))}
          </div>
        </PanelCard>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <PanelCard title="Orders by location" subtitle="Busiest PIN codes" padded={false}>
          <div className="divide-y divide-line">
            {data.ordersByLocation.map((l, i) => (
              <div key={l.pincode} className="flex items-center gap-3 px-5 py-3.5">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blush text-[11px] font-bold text-ink-muted">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1.5 text-[13px] font-semibold text-ink">
                    <MapPin size={11} className="text-rose-400" /> {l.pincode}
                  </p>
                  <p className="text-[11.5px] text-ink-faint">{l.city}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-[13px] font-bold text-ink">{inr(l.revenue)}</p>
                  <p className="text-[11px] text-ink-faint">{l.orders} orders</p>
                </div>
              </div>
            ))}
          </div>
        </PanelCard>

        <PanelCard title="Seller performance" subtitle="Top sellers by revenue" padded={false}>
          <div className="divide-y divide-line">
            {data.topSellers.map((s, i) => (
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
        </PanelCard>
      </div>
    </div>
  );
}
