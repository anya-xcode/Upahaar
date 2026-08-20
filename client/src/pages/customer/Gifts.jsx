import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../../lib/api.js';
import { useLocation as useLocationStore } from '../../store/locationStore.js';
import ProductCard from '../../components/customer/ProductCard.jsx';
import { ProductCardSkeleton, EmptyState, Pagination, Modal, Badge } from '../../components/common/ui.jsx';
import { Filter, Close, MapPin, ChevronDown, Check, Star } from '../../components/common/Icons.jsx';
import { TierIcon, CategoryGlyph, OccasionGlyph } from '../../lib/glyphs.jsx';

const RATINGS = [
  { key: '4', label: '4.0 & above' },
  { key: '3', label: '3.0 & above' },
];

export default function Gifts() {
  const [params, setParams] = useSearchParams();
  const { pincode, openPicker } = useLocationStore();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [meta, setMeta] = useState({ tiers: [], priceBuckets: [], sortOptions: [], sellers: [] });
  const [categories, setCategories] = useState([]);
  const [occasions, setOccasions] = useState([]);
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get('/products/filters'),
      api.get('/catalog/categories'),
      api.get('/catalog/occasions'),
    ])
      .then(([f, c, o]) => {
        setMeta(f.data);
        setCategories(c.data.categories);
        setOccasions(o.data.occasions);
      })
      .catch(() => {});
  }, []);

  const query = useMemo(() => Object.fromEntries(params.entries()), [params]);

  useEffect(() => {
    setLoading(true);
    api
      .get('/products', { params: { ...query, pincode: pincode || undefined, limit: 24 } })
      .then(({ data: d }) => setData(d))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [params, pincode, query]);

  /** Writes a filter into the URL — the URL is the single source of truth here,
      so a filtered listing is shareable and survives a refresh. */
  function setFilter(key, value) {
    const next = new URLSearchParams(params);
    if (value == null || value === '' || next.get(key) === String(value)) next.delete(key);
    else next.set(key, value);
    next.delete('page');
    setParams(next);
  }

  function clearAll() {
    const next = new URLSearchParams();
    if (params.get('q')) next.set('q', params.get('q'));
    setParams(next);
  }

  const activeFilters = ['tier', 'priceBucket', 'category', 'occasion', 'rating', 'seller', 'personalizable', 'featured', 'bestSeller']
    .filter((k) => params.get(k));

  const heading = params.get('q')
    ? `Results for "${params.get('q')}"`
    : categories.find((c) => c._id === params.get('category'))?.name ||
      occasions.find((o) => o._id === params.get('occasion'))?.name ||
      meta.tiers.find((t) => t.key === params.get('tier'))?.label ||
      'All gifts';

  const filterPanel = (
    <FilterPanel
      params={params}
      setFilter={setFilter}
      clearAll={clearAll}
      meta={meta}
      categories={categories}
      occasions={occasions}
      activeCount={activeFilters.length}
    />
  );

  return (
    <div className="container-app py-8">
      {/* Heading */}
      <div className="mb-6">
        <nav className="mb-2 flex items-center gap-1.5 text-xs text-ink-faint">
          <Link to="/" className="hover:text-rose-600">Home</Link>
          <span>/</span>
          <span className="text-ink-muted">Gifts</span>
        </nav>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-semibold text-ink">{heading}</h1>
            <p className="mt-1.5 flex flex-wrap items-center gap-2 text-sm text-ink-muted">
              {loading ? 'Finding gifts…' : `${data?.total || 0} gifts`}
              {pincode && (
                <>
                  <span>·</span>
                  <button onClick={openPicker} className="inline-flex items-center gap-1 font-semibold text-rose-600 hover:underline">
                    <MapPin size={12} /> deliverable to {pincode}
                  </button>
                </>
              )}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={() => setFiltersOpen(true)} className="btn-ghost btn-sm lg:hidden">
              <Filter size={15} /> Filters
              {activeFilters.length > 0 && (
                <span className="ml-0.5 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
                  {activeFilters.length}
                </span>
              )}
            </button>

            <div className="relative">
              <select
                value={params.get('sort') || 'popular'}
                onChange={(e) => setFilter('sort', e.target.value)}
                className="input !w-auto !rounded-full !py-2 pr-9 text-[13px] font-semibold appearance-none cursor-pointer"
              >
                {meta.sortOptions.map((s) => (
                  <option key={s.key} value={s.key}>Sort: {s.label}</option>
                ))}
              </select>
              <ChevronDown size={14} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-faint" />
            </div>
          </div>
        </div>
      </div>

      {/* Active filter chips */}
      {activeFilters.length > 0 && (
        <div className="mb-5 flex flex-wrap items-center gap-2">
          {activeFilters.map((key) => {
            const value = params.get(key);
            const label =
              key === 'tier' ? meta.tiers.find((t) => t.key === value)?.shortLabel
              : key === 'priceBucket' ? meta.priceBuckets.find((b) => b.key === value)?.label
              : key === 'category' ? categories.find((c) => c._id === value)?.name
              : key === 'occasion' ? occasions.find((o) => o._id === value)?.name
              : key === 'seller' ? meta.sellers.find((s) => s._id === value)?.businessName
              : key === 'rating' ? `${value}.0 & above`
              : key === 'personalizable' ? 'Personalisable'
              : key === 'featured' ? 'Featured'
              : 'Best sellers';
            return (
              <button
                key={key}
                onClick={() => setFilter(key, null)}
                className="chip border border-rose-200 bg-rose-50 text-rose-700 transition hover:bg-rose-100"
              >
                {label} <Close size={12} />
              </button>
            );
          })}
          <button onClick={clearAll} className="text-xs font-semibold text-ink-muted hover:text-rose-600">
            Clear all
          </button>
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-[248px_1fr]">
        {/* Desktop filters */}
        <aside className="hidden lg:block">
          <div className="sticky top-[180px] max-h-[calc(100vh-200px)] overflow-y-auto pr-2">{filterPanel}</div>
        </aside>

        {/* Results */}
        <div>
          {loading ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {Array.from({ length: 9 }).map((_, i) => <ProductCardSkeleton key={i} />)}
            </div>
          ) : !pincode ? (
            <EmptyState
              icon="location"
              title="Set your PIN code first"
              message="We show gifts that can genuinely reach you — which means we need to know where you are."
              action={<button onClick={openPicker} className="btn-primary">Enter your PIN code</button>}
            />
          ) : !data?.products?.length ? (
            <EmptyState
              icon="search"
              title="Nothing matches just yet"
              message={
                activeFilters.length
                  ? 'Try loosening a filter — a slower delivery tier usually opens up a lot more.'
                  : `We couldn't find gifts deliverable to ${pincode} with those terms.`
              }
              action={
                activeFilters.length ? (
                  <button onClick={clearAll} className="btn-primary">Clear filters</button>
                ) : (
                  <Link to="/gifts" className="btn-primary">Browse all gifts</Link>
                )
              }
            />
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                {data.products.map((p) => (
                  <ProductCard key={p._id} product={p} />
                ))}
              </div>
              <Pagination
                page={data.page}
                pages={data.pages}
                onChange={(p) => {
                  const next = new URLSearchParams(params);
                  next.set('page', p);
                  setParams(next);
                }}
                className="mt-10"
              />
            </>
          )}
        </div>
      </div>

      {/* Mobile filter sheet */}
      <Modal open={filtersOpen} onClose={() => setFiltersOpen(false)} title="Filters">
        {filterPanel}
        <button onClick={() => setFiltersOpen(false)} className="btn-primary mt-6 w-full">
          Show {data?.total || 0} gifts
        </button>
      </Modal>
    </div>
  );
}

/* ------------------------------ Filter rail ------------------------------ */

function FilterGroup({ title, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-line py-4 first:pt-0">
      <button onClick={() => setOpen((v) => !v)} className="flex w-full items-center justify-between text-left">
        <span className="text-[13px] font-bold uppercase tracking-wide text-ink">{title}</span>
        <ChevronDown size={15} className={`text-ink-faint transition ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <div className="mt-3 space-y-1.5">{children}</div>}
    </div>
  );
}

function Option({ active, onClick, children, badge }) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13px] transition ${
        active ? 'bg-rose-50 font-semibold text-rose-700' : 'text-ink-soft hover:bg-blush'
      }`}
    >
      <span
        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition ${
          active ? 'border-rose-500 bg-rose-500 text-white' : 'border-line'
        }`}
      >
        {active && <Check size={11} />}
      </span>
      <span className="min-w-0 flex-1 truncate">{children}</span>
      {badge}
    </button>
  );
}

function FilterPanel({ params, setFilter, clearAll, meta, categories, occasions, activeCount }) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-sm font-bold text-ink">Filters</h2>
        {activeCount > 0 && (
          <button onClick={clearAll} className="text-xs font-semibold text-rose-600 hover:underline">
            Clear all
          </button>
        )}
      </div>

      {/* Delivery time leads, because it is the reason people are here. */}
      <FilterGroup title="Delivery time">
        {meta.tiers.map((t) => (
          <Option key={t.key} active={params.get('tier') === t.key} onClick={() => setFilter('tier', t.key)}>
            <TierIcon tier={t.key} size={13} className="text-rose-500" />
            {t.label.replace('Deliver ', '')}
          </Option>
        ))}
      </FilterGroup>

      <FilterGroup title="Price">
        {meta.priceBuckets.map((b) => (
          <Option key={b.key} active={params.get('priceBucket') === b.key} onClick={() => setFilter('priceBucket', b.key)}>
            {b.label}
          </Option>
        ))}
      </FilterGroup>

      <FilterGroup title="Category">
        <div className="max-h-56 space-y-1.5 overflow-y-auto pr-1">
          {categories.map((c) => (
            <Option key={c._id} active={params.get('category') === c._id} onClick={() => setFilter('category', c._id)}>
              <CategoryGlyph category={c} size={13} className="text-ink-faint" />
              {c.name}
            </Option>
          ))}
        </div>
      </FilterGroup>

      <FilterGroup title="Occasion" defaultOpen={false}>
        <div className="max-h-56 space-y-1.5 overflow-y-auto pr-1">
          {occasions.map((o) => (
            <Option key={o._id} active={params.get('occasion') === o._id} onClick={() => setFilter('occasion', o._id)}>
              <OccasionGlyph occasion={o} size={13} className="text-ink-faint" />
              {o.name}
            </Option>
          ))}
        </div>
      </FilterGroup>

      <FilterGroup title="Rating" defaultOpen={false}>
        {RATINGS.map((r) => (
          <Option key={r.key} active={params.get('rating') === r.key} onClick={() => setFilter('rating', r.key)}>
            <span className="flex items-center gap-1">
              <Star size={12} className="text-gold-400" /> {r.label}
            </span>
          </Option>
        ))}
      </FilterGroup>

      <FilterGroup title="Seller" defaultOpen={false}>
        <div className="max-h-56 space-y-1.5 overflow-y-auto pr-1">
          {meta.sellers.map((s) => (
            <Option key={s._id} active={params.get('seller') === s._id} onClick={() => setFilter('seller', s._id)}>
              {s.businessName}
            </Option>
          ))}
        </div>
      </FilterGroup>

      <FilterGroup title="More">
        <Option
          active={params.get('personalizable') === 'true'}
          onClick={() => setFilter('personalizable', 'true')}
        >
          Personalisation available
        </Option>
        <Option active={params.get('bestSeller') === 'true'} onClick={() => setFilter('bestSeller', 'true')}>
          Best sellers
        </Option>
        <Option active={params.get('featured') === 'true'} onClick={() => setFilter('featured', 'true')}>
          Featured
        </Option>
      </FilterGroup>
    </div>
  );
}
