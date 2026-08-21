import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../lib/api.js';
import { toast } from '../../store/toastStore.js';
import { PageHeader, PanelCard, DataTable, SearchInput, FilterTabs } from '../../components/common/panel.jsx';
import { Img, Badge, DeliveryBadge, Pagination, EmptyState } from '../../components/common/ui.jsx';
import { Plus, Edit, Trash, Star } from '../../components/common/Icons.jsx';
import { inr } from '../../lib/format.js';

/** Badge text only — DeliveryBadge supplies the glyph from the tier key. */
const TIER_META = {
  EXPRESS_60: { badge: '60 MIN' },
  PRIORITY_3H: { badge: '3 HOURS' },
  NEXT_DAY: { badge: 'TOMORROW' },
  STANDARD_2_3D: { badge: '2–3 DAYS' },
};

const FILTERS = [
  ['', 'All'],
  ['active', 'Live'],
  ['inactive', 'Hidden'],
];

/** Where a product sits in the admin review queue. */
const APPROVAL = {
  APPROVED: { tone: 'green', label: 'Approved' },
  PENDING: { tone: 'amber', label: 'In review' },
  REJECTED: { tone: 'red', label: 'Changes needed' },
};

export default function SellerProducts() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const approval = params.get('approval') || '';
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);

  async function load() {
    setLoading(true);
    try {
      const { data: d } = await api.get('/seller/products', {
        params: { q: q || undefined, status: status || undefined, approval: approval || undefined, page, limit: 20 },
      });
      setData(d);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const t = setTimeout(load, q ? 300 : 0);
    return () => clearTimeout(t);
  }, [q, status, approval, page]);

  async function toggleActive(product) {
    try {
      await api.patch(`/seller/products/${product._id}`, { isActive: !product.isActive });
      toast.success(product.isActive ? 'Hidden from the store' : 'Now live on the store');
      await load();
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function remove(product) {
    if (!window.confirm(`Delete "${product.name}"?`)) return;
    try {
      const { data: res } = await api.delete(`/seller/products/${product._id}`);
      toast.success(res.message);
      await load();
    } catch (err) {
      toast.error(err.message);
    }
  }

  const columns = [
    {
      key: 'name',
      header: 'Product',
      render: (p) => (
        <div className="flex items-center gap-3">
          <Img src={p.images?.[0]} alt={p.name} seed={p.slug} className="h-11 w-11 shrink-0 rounded-lg object-cover" />
          <div className="min-w-0">
            <p className="line-clamp-1 font-semibold text-ink">{p.name}</p>
            <p className="text-[11.5px] text-ink-faint">
              {p.category?.name}
              {p.personalizable && ' · personalisable'}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: 'price',
      header: 'Price',
      render: (p) => (
        <div>
          <p className="font-bold text-ink">{inr(p.price)}</p>
          {p.mrp > p.price && <p className="text-[11px] text-ink-faint line-through">{inr(p.mrp)}</p>}
        </div>
      ),
    },
    {
      key: 'stock',
      header: 'Stock',
      render: (p) => (
        <Badge tone={p.stock === 0 ? 'red' : p.stock <= p.lowStockThreshold ? 'amber' : 'green'}>
          {p.stock === 0 ? 'Out of stock' : `${p.stock} left`}
        </Badge>
      ),
    },
    {
      key: 'baseTier',
      header: 'Delivery',
      render: (p) => (
        <div>
          <DeliveryBadge tier={p.baseTier} meta={TIER_META[p.baseTier]} />
          <p className="mt-1 text-[11px] text-ink-faint">{p.prepTimeMinutes} min prep</p>
        </div>
      ),
    },
    {
      key: 'rating',
      header: 'Rating',
      render: (p) => (
        <span className="flex items-center gap-1 text-[12.5px] font-semibold text-ink">
          <Star size={12} className="text-gold-400" /> {p.rating?.toFixed(1) || '—'}
          <span className="font-normal text-ink-faint">({p.reviewCount})</span>
        </span>
      ),
    },
    {
      key: 'approvalStatus',
      header: 'Review',
      render: (p) => {
        const a = APPROVAL[p.approvalStatus] || APPROVAL.PENDING;
        return (
          <div>
            <Badge tone={a.tone}>{a.label}</Badge>
            {p.approvalStatus === 'REJECTED' && p.approvalNote && (
              <p className="mt-1 max-w-[16rem] text-[11px] leading-snug text-[#B3261E]">{p.approvalNote}</p>
            )}
          </div>
        );
      },
    },
    {
      key: 'isActive',
      header: 'Status',
      render: (p) => (
        <button onClick={(e) => { e.stopPropagation(); toggleActive(p); }}>
          <Badge tone={p.isActive ? 'green' : 'neutral'}>{p.isActive ? 'Live' : 'Hidden'}</Badge>
        </button>
      ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (p) => (
        <div className="flex justify-end gap-1">
          <Link
            to={`/seller/products/${p._id}/edit`}
            onClick={(e) => e.stopPropagation()}
            className="rounded-lg p-2 text-ink-faint transition hover:bg-blush hover:text-rose-600"
            aria-label="Edit"
          >
            <Edit size={15} />
          </Link>
          <button
            onClick={(e) => { e.stopPropagation(); remove(p); }}
            className="rounded-lg p-2 text-ink-faint transition hover:bg-blush hover:text-[#B3261E]"
            aria-label="Delete"
          >
            <Trash size={15} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Products"
        subtitle={data ? `${data.total} product${data.total === 1 ? '' : 's'} in your store` : 'Your catalogue'}
        action={<Link to="/seller/products/new" className="btn-primary btn-sm"><Plus size={14} /> Add product</Link>}
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <SearchInput value={q} onChange={(v) => { setQ(v); setPage(1); }} placeholder="Search your products…" className="w-full sm:w-72" />
        <FilterTabs options={FILTERS} value={status} onChange={(v) => { setStatus(v); setPage(1); }} />
      </div>

      <PanelCard padded={false}>
        <DataTable
          columns={columns}
          rows={data?.products}
          loading={loading}
          onRowClick={(p) => navigate(`/seller/products/${p._id}/edit`)}
          empty={
            <EmptyState
              icon="box"
              title={q || status ? 'No matching products' : 'No products yet'}
              message={q || status ? 'Try a different search or filter.' : 'Add your first gift and it will appear to customers near you.'}
              action={<Link to="/seller/products/new" className="btn-primary">Add your first product</Link>}
            />
          }
          mobileCard={(p) => (
            <div className="flex gap-3">
              <Img src={p.images?.[0]} alt={p.name} seed={p.slug} className="h-16 w-16 shrink-0 rounded-xl object-cover" />
              <div className="min-w-0 flex-1">
                <p className="line-clamp-1 text-sm font-semibold text-ink">{p.name}</p>
                <p className="mt-0.5 text-[15px] font-bold text-ink">{inr(p.price)}</p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  <Badge tone={p.stock === 0 ? 'red' : p.stock <= p.lowStockThreshold ? 'amber' : 'green'} className="!text-[10px]">
                    {p.stock === 0 ? 'Out of stock' : `${p.stock} left`}
                  </Badge>
                  <Badge tone={p.isActive ? 'green' : 'neutral'} className="!text-[10px]">{p.isActive ? 'Live' : 'Hidden'}</Badge>
                  <Badge tone={(APPROVAL[p.approvalStatus] || APPROVAL.PENDING).tone} className="!text-[10px]">
                    {(APPROVAL[p.approvalStatus] || APPROVAL.PENDING).label}
                  </Badge>
                  <DeliveryBadge tier={p.baseTier} meta={TIER_META[p.baseTier]} />
                </div>
              </div>
            </div>
          )}
        />
      </PanelCard>

      <Pagination page={data?.page} pages={data?.pages} onChange={setPage} className="mt-6" />
    </div>
  );
}
