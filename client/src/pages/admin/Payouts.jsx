import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../lib/api.js';
import { toast } from '../../store/toastStore.js';
import { PageHeader, PanelCard, StatCard, DataTable } from '../../components/common/panel.jsx';
import { Badge, EmptyState, Skeleton, Spinner } from '../../components/common/ui.jsx';
import { Rupee, Store, Check, ChevronRight } from '../../components/common/Icons.jsx';
import { inr, formatDate } from '../../lib/format.js';

export default function AdminPayouts() {
  const [payouts, setPayouts] = useState([]);
  const [pendingBySeller, setPendingBySeller] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  async function load() {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/payouts');
      setPayouts(data.payouts);
      setPendingBySeller(data.pendingBySeller);
    } catch {
      setPayouts([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function settle(row) {
    if (!window.confirm(`Settle ${inr(row.net)} to ${row.businessName}?`)) return;
    setBusyId(row._id);
    try {
      await api.post(`/admin/payouts/${row._id}`);
      toast.success(`Payout of ${inr(row.net)} processed`);
      await load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusyId(null);
    }
  }

  const totalPending = pendingBySeller.reduce((n, s) => n + s.net, 0);
  const totalCommission = pendingBySeller.reduce((n, s) => n + s.commission, 0);
  const totalPaid = payouts.reduce((n, p) => n + (p.status === 'PAID' ? p.netPayable : 0), 0);

  if (loading) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-80 w-full rounded-xl2" />
      </div>
    );
  }

  const historyColumns = [
    {
      key: 'seller',
      header: 'Seller',
      render: (p) => (
        <Link to={`/admin/sellers/${p.seller?._id}`} className="font-semibold text-ink hover:text-rose-600">
          {p.seller?.businessName || '—'}
        </Link>
      ),
    },
    { key: 'period', header: 'Period', render: (p) => (
      <span className="text-[12.5px] text-ink-muted">{formatDate(p.periodStart)} – {formatDate(p.periodEnd)}</span>
    ) },
    { key: 'orderCount', header: 'Orders', render: (p) => <span>{p.orderCount}</span> },
    { key: 'grossSales', header: 'Gross', render: (p) => <span>{inr(p.grossSales)}</span> },
    { key: 'commissionDeducted', header: 'Commission', render: (p) => (
      <span className="font-semibold text-[#1F6B45]">{inr(p.commissionDeducted)}</span>
    ) },
    { key: 'netPayable', header: 'Paid', render: (p) => <span className="font-bold text-ink">{inr(p.netPayable)}</span> },
    { key: 'status', header: 'Status', render: (p) => (
      <Badge tone={p.status === 'PAID' ? 'green' : p.status === 'FAILED' ? 'red' : 'amber'}>{p.status}</Badge>
    ) },
    { key: 'utr', header: 'UTR', align: 'right', render: (p) => (
      <span className="font-mono text-[11px] text-ink-faint">{p.utr || '—'}</span>
    ) },
  ];

  return (
    <div>
      <PageHeader title="Seller payouts" subtitle="Settle earnings and track the platform's commission." />

      <div className="mb-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Rupee} label="Pending payouts" value={inr(totalPending)} sub={`${pendingBySeller.length} sellers`} tone="gold" />
        <StatCard icon={Rupee} label="Commission (unsettled)" value={inr(totalCommission)} sub="platform earnings" tone="green" />
        <StatCard icon={Rupee} label="Settled to date" value={inr(totalPaid)} sub={`${payouts.length} payouts`} tone="blue" />
        <StatCard icon={Store} label="Sellers awaiting" value={pendingBySeller.length} sub="ready to settle" tone="rose" />
      </div>

      <PanelCard title="Ready to settle" subtitle="Unsettled commissions grouped by seller" padded={false} className="mb-5">
        {pendingBySeller.length ? (
          <div className="divide-y divide-line">
            {pendingBySeller.map((row) => (
              <div key={row._id} className="flex flex-wrap items-center gap-4 px-5 py-4">
                <div className="min-w-0 flex-1">
                  <Link to={`/admin/sellers/${row._id}`} className="flex items-center gap-1.5 text-[14px] font-semibold text-ink hover:text-rose-600">
                    <Store size={14} className="text-rose-500" /> {row.businessName}
                    <ChevronRight size={13} className="text-ink-faint" />
                  </Link>
                  <p className="mt-0.5 text-[11.5px] text-ink-faint">
                    {row.orders} order{row.orders === 1 ? '' : 's'} · gross {inr(row.gross)} · commission {inr(row.commission)}
                  </p>
                </div>

                <div className="shrink-0 text-right">
                  <p className="font-display text-xl font-bold text-ink">{inr(row.net)}</p>
                  <p className="text-[11px] uppercase tracking-wide text-ink-faint">net payable</p>
                </div>

                <button onClick={() => settle(row)} disabled={busyId === row._id} className="btn-primary btn-sm shrink-0">
                  {busyId === row._id ? <Spinner size={13} /> : <Check size={14} />} Settle
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-5">
            <EmptyState icon="money" title="Everything is settled" message="No unsettled commissions right now." />
          </div>
        )}
      </PanelCard>

      <PanelCard title="Payout history" padded={false}>
        <DataTable
          columns={historyColumns}
          rows={payouts}
          empty={<EmptyState icon="receipt" title="No payouts yet" message="Settle a seller above to create the first one." />}
          mobileCard={(p) => (
            <div>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[13.5px] font-semibold text-ink">{p.seller?.businessName}</p>
                  <p className="text-[11.5px] text-ink-faint">
                    {formatDate(p.periodStart)} – {formatDate(p.periodEnd)} · {p.orderCount} orders
                  </p>
                </div>
                <Badge tone={p.status === 'PAID' ? 'green' : 'amber'} className="!text-[10px]">{p.status}</Badge>
              </div>
              <p className="mt-2 font-display text-xl font-bold text-ink">{inr(p.netPayable)}</p>
              <p className="text-[11px] text-ink-faint">
                {inr(p.grossSales)} gross − {inr(p.commissionDeducted)} commission
              </p>
            </div>
          )}
        />
      </PanelCard>
    </div>
  );
}
