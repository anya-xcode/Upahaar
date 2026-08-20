import { useEffect, useState } from 'react';
import api from '../../lib/api.js';
import { PageHeader, PanelCard, StatCard, DataTable } from '../../components/common/panel.jsx';
import { Badge, Skeleton, EmptyState } from '../../components/common/ui.jsx';
import { Rupee, Package, Check, Clock } from '../../components/common/Icons.jsx';
import { inr, formatDate } from '../../lib/format.js';

export default function Payouts() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/seller/payouts')
      .then(({ data: d }) => setData(d))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-32 w-full rounded-xl2" />
      </div>
    );
  }

  const pending = data?.pending;

  const columns = [
    { key: 'period', header: 'Period', render: (p) => (
      <span className="font-semibold text-ink">{formatDate(p.periodStart)} – {formatDate(p.periodEnd)}</span>
    ) },
    { key: 'orderCount', header: 'Orders', render: (p) => <span>{p.orderCount}</span> },
    { key: 'grossSales', header: 'Gross', render: (p) => <span>{inr(p.grossSales)}</span> },
    { key: 'commissionDeducted', header: 'Commission', render: (p) => (
      <span className="text-[#B3261E]">− {inr(p.commissionDeducted)}</span>
    ) },
    { key: 'netPayable', header: 'Paid out', render: (p) => (
      <span className="font-bold text-ink">{inr(p.netPayable)}</span>
    ) },
    { key: 'status', header: 'Status', render: (p) => (
      <Badge tone={p.status === 'PAID' ? 'green' : p.status === 'FAILED' ? 'red' : 'amber'}>{p.status}</Badge>
    ) },
    { key: 'utr', header: 'UTR', align: 'right', render: (p) => (
      <span className="font-mono text-[11.5px] text-ink-faint">{p.utr || '—'}</span>
    ) },
  ];

  return (
    <div>
      <PageHeader title="Payouts" subtitle="Your earnings after the platform commission." />

      <div className="mb-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Rupee} label="Pending payout" value={inr(pending?.net)} sub="next settlement" tone="green" />
        <StatCard icon={Package} label="Unsettled orders" value={pending?.orders || 0} sub="since last payout" tone="ink" />
        <StatCard icon={Rupee} label="Gross sales" value={inr(pending?.gross)} sub="before commission" tone="blue" />
        <StatCard icon={Rupee} label="Commission" value={inr(pending?.commission)} sub="platform fee" tone="gold" />
      </div>

      {/* Next payout summary */}
      <PanelCard title="Next settlement" className="mb-5">
        {pending?.orders ? (
          <div className="rounded-xl2 bg-gradient-to-br from-rose-50 to-gold-50 p-6">
            <p className="text-[12px] font-bold uppercase tracking-wide text-ink-faint">You will receive</p>
            <p className="mt-1.5 font-display text-4xl font-bold text-ink">{inr(pending.net)}</p>
            <div className="mt-4 flex flex-wrap gap-x-8 gap-y-2 text-[13px]">
              <span>
                <span className="block text-[11px] uppercase tracking-wide text-ink-faint">Gross sales</span>
                <span className="font-bold text-ink">{inr(pending.gross)}</span>
              </span>
              <span>
                <span className="block text-[11px] uppercase tracking-wide text-ink-faint">Commission</span>
                <span className="font-bold text-[#B3261E]">− {inr(pending.commission)}</span>
              </span>
              <span>
                <span className="block text-[11px] uppercase tracking-wide text-ink-faint">Orders</span>
                <span className="font-bold text-ink">{pending.orders}</span>
              </span>
            </div>
            <p className="mt-4 flex items-center gap-2 text-[12px] text-ink-muted">
              <Clock size={13} className="text-rose-500" />
              Settled to your registered bank account on the next payout cycle.
            </p>
          </div>
        ) : (
          <EmptyState icon="money" title="Nothing pending" message="All your delivered orders have been settled." />
        )}
      </PanelCard>

      <PanelCard title="Payout history" padded={false}>
        <DataTable
          columns={columns}
          rows={data?.payouts}
          empty={<EmptyState icon="receipt" title="No payouts yet" message="Your first settlement will appear here." />}
          mobileCard={(p) => (
            <div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-[13px] font-semibold text-ink">
                  {formatDate(p.periodStart)} – {formatDate(p.periodEnd)}
                </span>
                <Badge tone={p.status === 'PAID' ? 'green' : 'amber'} className="!text-[10px]">{p.status}</Badge>
              </div>
              <p className="mt-2 font-display text-xl font-bold text-ink">{inr(p.netPayable)}</p>
              <p className="mt-0.5 text-[11.5px] text-ink-faint">
                {p.orderCount} orders · {inr(p.grossSales)} gross − {inr(p.commissionDeducted)} commission
              </p>
              {p.utr && <p className="mt-1 font-mono text-[11px] text-ink-faint">UTR {p.utr}</p>}
            </div>
          )}
        />
      </PanelCard>
    </div>
  );
}
