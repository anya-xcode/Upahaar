import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../lib/api.js';
import { PageHeader, PanelCard, DataTable, SearchInput, FilterTabs } from '../../components/common/panel.jsx';
import { OrderStatusBadge } from '../customer/account/AccountHome.jsx';
import { Badge, DeliveryBadge, Pagination, EmptyState } from '../../components/common/ui.jsx';
import { MapPin, ChevronRight } from '../../components/common/Icons.jsx';
import { inr, formatDateTime } from '../../lib/format.js';

const STATUS_FILTERS = [
  ['', 'All'],
  ['PLACED', 'Placed'],
  ['PREPARING', 'Preparing'],
  ['OUT_FOR_DELIVERY', 'On the way'],
  ['DELIVERED', 'Delivered'],
  ['CANCELLED', 'Cancelled'],
];

const TIER_FILTERS = [
  ['', 'All speeds'],
  ['EXPRESS_60', '60 min'],
  ['PRIORITY_3H', '3 hours'],
  ['NEXT_DAY', 'Tomorrow'],
  ['STANDARD_2_3D', '2–3 days'],
];

/** Badge text only — DeliveryBadge supplies the glyph from the tier key. */
const TIER_META = {
  EXPRESS_60: { badge: '60 MIN' },
  PRIORITY_3H: { badge: '3 HOURS' },
  NEXT_DAY: { badge: 'TOMORROW' },
  STANDARD_2_3D: { badge: '2–3 DAYS' },
};

export default function AdminOrders() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);

  const status = params.get('status') || '';
  const tier = params.get('tier') || '';

  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => {
      api
        .get('/admin/orders', {
          params: { status: status || undefined, tier: tier || undefined, q: q || undefined, page, limit: 20 },
        })
        .then(({ data: d }) => setData(d))
        .catch(() => setData(null))
        .finally(() => setLoading(false));
    }, q ? 300 : 0);
    return () => clearTimeout(t);
  }, [status, tier, q, page]);

  function setParam(key, value) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next);
    setPage(1);
  }

  const columns = [
    {
      key: 'orderId',
      header: 'Order',
      render: (o) => (
        <div className="min-w-0">
          <p className="font-bold text-ink">{o.orderId}</p>
          <p className="text-[11.5px] text-ink-faint">{formatDateTime(o.createdAt)}</p>
        </div>
      ),
    },
    {
      key: 'customerName',
      header: 'Customer',
      render: (o) => (
        <div className="min-w-0">
          <p className="font-semibold text-ink">{o.customerName}</p>
          <p className="flex items-center gap-1 text-[11.5px] text-ink-faint">
            <MapPin size={10} /> {o.shippingAddress?.city} {o.shippingAddress?.pincode}
          </p>
        </div>
      ),
    },
    {
      key: 'sellers',
      header: 'Seller(s)',
      render: (o) => (
        <span className="text-[12.5px] text-ink-soft">
          {o.sellers?.map((s) => s.businessName).join(', ') || '—'}
        </span>
      ),
    },
    { key: 'items', header: 'Items', render: (o) => <span className="text-ink-soft">{o.items.length}</span> },
    {
      key: 'deliveryTier',
      header: 'Speed',
      render: (o) => <DeliveryBadge tier={o.deliveryTier} meta={TIER_META[o.deliveryTier]} />,
    },
    { key: 'status', header: 'Status', render: (o) => <OrderStatusBadge status={o.status} /> },
    {
      key: 'paymentStatus',
      header: 'Payment',
      render: (o) => (
        <Badge tone={o.paymentStatus === 'PAID' ? 'green' : o.paymentStatus === 'REFUNDED' ? 'blue' : 'amber'}>
          {o.paymentMethod === 'COD' ? 'COD' : o.paymentMethod}
        </Badge>
      ),
    },
    {
      key: 'total',
      header: 'Total',
      align: 'right',
      render: (o) => (
        <div>
          <p className="font-bold text-ink">{inr(o.total)}</p>
          <p className="text-[11px] text-ink-faint">{inr(o.commissionAmount)} commission</p>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Orders"
        subtitle={data ? `${data.total} order${data.total === 1 ? '' : 's'} across the platform` : 'Every order on Upahaar'}
      />

      <div className="mb-4 space-y-3">
        <FilterTabs options={STATUS_FILTERS} value={status} counts={data?.counts} onChange={(v) => setParam('status', v)} />
        <div className="flex flex-wrap items-center gap-3">
          <SearchInput value={q} onChange={(v) => { setQ(v); setPage(1); }} placeholder="Search order ID…" className="w-full sm:w-56" />
          <FilterTabs options={TIER_FILTERS} value={tier} onChange={(v) => setParam('tier', v)} />
        </div>
      </div>

      <PanelCard padded={false}>
        <DataTable
          columns={columns}
          rows={data?.orders}
          loading={loading}
          onRowClick={(o) => navigate(`/admin/orders/${o.orderId}`)}
          empty={<EmptyState icon="gift" title="No orders match" message="Try another filter." />}
          mobileCard={(o) => (
            <div>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[13.5px] font-bold text-ink">{o.orderId}</p>
                  <p className="text-[11.5px] text-ink-faint">{o.customerName} · {formatDateTime(o.createdAt)}</p>
                </div>
                <span className="shrink-0 text-[14px] font-bold text-ink">{inr(o.total)}</span>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <OrderStatusBadge status={o.status} />
                <DeliveryBadge tier={o.deliveryTier} meta={TIER_META[o.deliveryTier]} />
                <Badge tone="neutral" className="!text-[10px]"><MapPin size={10} /> {o.shippingAddress?.pincode}</Badge>
              </div>
            </div>
          )}
        />
      </PanelCard>

      <Pagination page={data?.page} pages={data?.pages} onChange={setPage} className="mt-6" />
    </div>
  );
}
