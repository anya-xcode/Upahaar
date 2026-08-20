import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../lib/api.js';
import { toast } from '../../store/toastStore.js';
import { PageHeader, PanelCard, DataTable, SearchInput, FilterTabs } from '../../components/common/panel.jsx';
import { Img, Badge, DeliveryBadge, Pagination, EmptyState, Rating } from '../../components/common/ui.jsx';
import { Sparkles, Star, ChevronRight } from '../../components/common/Icons.jsx';
import { inr } from '../../lib/format.js';

const FILTERS = [
  ['', 'All'],
  ['true', 'Live'],
  ['false', 'Hidden'],
];

/** Badge text only — DeliveryBadge supplies the glyph from the tier key. */
const TIER_META = {
  EXPRESS_60: { badge: '60 MIN' },
  PRIORITY_3H: { badge: '3 HOURS' },
  NEXT_DAY: { badge: 'TOMORROW' },
  STANDARD_2_3D: { badge: '2–3 DAYS' },
};

export default function AdminProducts() {
  const [data, setData] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [isActive, setIsActive] = useState('');
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    api.get('/catalog/categories').then(({ data: d }) => setCategories(d.categories)).catch(() => {});
  }, []);

  async function load() {
    setLoading(true);
    try {
      const { data: d } = await api.get('/admin/products', {
        params: { q: q || undefined, isActive: isActive || undefined, category: category || undefined, page, limit: 20 },
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
  }, [q, isActive, category, page]);

  async function patch(product, changes, message) {
    try {
      await api.patch(`/admin/products/${product._id}`, changes);
      toast.success(message);
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
          <Img src={p.images?.[0]} alt={p.name} seed={p.slug} className="h-10 w-10 shrink-0 rounded-lg object-cover" />
          <div className="min-w-0">
            <Link to={`/gift/${p.slug}`} className="line-clamp-1 font-semibold text-ink hover:text-rose-600">{p.name}</Link>
            <p className="text-[11px] text-ink-faint">{p.category?.name}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'seller',
      header: 'Seller',
      render: (p) => (
        <Link to={`/admin/sellers/${p.seller?._id}`} className="text-[12.5px] font-medium text-ink-soft hover:text-rose-600">
          {p.seller?.businessName}
        </Link>
      ),
    },
    { key: 'price', header: 'Price', render: (p) => <span className="font-bold text-ink">{inr(p.price)}</span> },
    {
      key: 'stock',
      header: 'Stock',
      render: (p) => (
        <Badge tone={p.stock === 0 ? 'red' : p.stock <= p.lowStockThreshold ? 'amber' : 'green'}>{p.stock}</Badge>
      ),
    },
    { key: 'baseTier', header: 'Speed', render: (p) => <DeliveryBadge tier={p.baseTier} meta={TIER_META[p.baseTier]} /> },
    { key: 'rating', header: 'Rating', render: (p) => <Rating value={p.rating} count={p.reviewCount} /> },
    {
      key: 'flags',
      header: 'Flags',
      render: (p) => (
        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => patch(p, { isFeatured: !p.isFeatured }, p.isFeatured ? 'Unfeatured' : 'Featured on the homepage')}
            title="Featured"
            className={`rounded-lg p-1.5 transition ${p.isFeatured ? 'bg-gold-50 text-gold-600' : 'text-ink-faint hover:bg-blush'}`}
          >
            <Sparkles size={14} />
          </button>
          <button
            onClick={() => patch(p, { isBestSeller: !p.isBestSeller }, p.isBestSeller ? 'Removed from best sellers' : 'Marked as best seller')}
            title="Best seller"
            className={`rounded-lg p-1.5 transition ${p.isBestSeller ? 'bg-rose-50 text-rose-600' : 'text-ink-faint hover:bg-blush'}`}
          >
            <Star size={14} />
          </button>
        </div>
      ),
    },
    {
      key: 'isActive',
      header: 'Status',
      align: 'right',
      render: (p) => (
        <button onClick={(e) => { e.stopPropagation(); patch(p, { isActive: !p.isActive }, p.isActive ? 'Product hidden' : 'Product is live'); }}>
          <Badge tone={p.isActive ? 'green' : 'neutral'}>{p.isActive ? 'Live' : 'Hidden'}</Badge>
        </button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Products"
        subtitle={data ? `${data.total} product${data.total === 1 ? '' : 's'} across all sellers` : 'Platform catalogue'}
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <SearchInput value={q} onChange={(v) => { setQ(v); setPage(1); }} placeholder="Search products…" className="w-full sm:w-64" />
        <select value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }} className="input !w-auto !py-2 text-[13px]">
          <option value="">All categories</option>
          {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
        </select>
        <FilterTabs options={FILTERS} value={isActive} onChange={(v) => { setIsActive(v); setPage(1); }} />
      </div>

      <PanelCard padded={false}>
        <DataTable
          columns={columns}
          rows={data?.products}
          loading={loading}
          empty={<EmptyState icon="box" title="No products match" message="Try another search or filter." />}
          mobileCard={(p) => (
            <div className="flex gap-3">
              <Img src={p.images?.[0]} alt={p.name} seed={p.slug} className="h-14 w-14 shrink-0 rounded-xl object-cover" />
              <div className="min-w-0 flex-1">
                <p className="line-clamp-1 text-[13.5px] font-semibold text-ink">{p.name}</p>
                <p className="text-[11.5px] text-ink-faint">{p.seller?.businessName}</p>
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                  <span className="text-[13px] font-bold text-ink">{inr(p.price)}</span>
                  <Badge tone={p.isActive ? 'green' : 'neutral'} className="!text-[10px]">{p.isActive ? 'Live' : 'Hidden'}</Badge>
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
