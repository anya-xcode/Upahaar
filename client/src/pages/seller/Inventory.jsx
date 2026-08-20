import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../lib/api.js';
import { toast } from '../../store/toastStore.js';
import { PageHeader, PanelCard, DataTable, FilterTabs, StatCard } from '../../components/common/panel.jsx';
import { Img, Badge, EmptyState, Spinner } from '../../components/common/ui.jsx';
import { Package, Warning, Plus, Minus, Check, Refresh } from '../../components/common/Icons.jsx';
import { inr, formatDateTime } from '../../lib/format.js';

const FILTERS = [
  ['', 'All products'],
  ['low', 'Low stock'],
  ['out', 'Out of stock'],
];

export default function Inventory() {
  const [products, setProducts] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stock, setStock] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [drafts, setDrafts] = useState({});

  async function load() {
    setLoading(true);
    try {
      const [p, l] = await Promise.all([
        api.get('/seller/products', { params: { stock: stock || undefined, limit: 60 } }),
        api.get('/seller/inventory/log'),
      ]);
      setProducts(p.data.products);
      setLogs(l.data.logs);
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [stock]);

  async function adjust(product, change) {
    setBusyId(product._id);
    try {
      await api.patch(`/seller/products/${product._id}/stock`, { change, note: change > 0 ? 'Quick restock' : 'Quick adjustment' });
      await load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusyId(null);
    }
  }

  async function setAbsolute(product) {
    const value = Number(drafts[product._id]);
    if (Number.isNaN(value) || value < 0) return toast.error('Enter a valid stock number');
    setBusyId(product._id);
    try {
      await api.patch(`/seller/products/${product._id}/stock`, { absolute: value, note: 'Stock count' });
      toast.success(`${product.name} set to ${value}`);
      setDrafts((d) => ({ ...d, [product._id]: '' }));
      await load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusyId(null);
    }
  }

  const lowCount = products.filter((p) => p.stock > 0 && p.stock <= p.lowStockThreshold).length;
  const outCount = products.filter((p) => p.stock === 0).length;
  const totalUnits = products.reduce((n, p) => n + p.stock, 0);
  const stockValue = products.reduce((n, p) => n + p.stock * p.price, 0);

  const columns = [
    {
      key: 'name',
      header: 'Product',
      render: (p) => (
        <div className="flex items-center gap-3">
          <Img src={p.images?.[0]} alt={p.name} seed={p.slug} className="h-10 w-10 shrink-0 rounded-lg object-cover" />
          <div className="min-w-0">
            <Link to={`/seller/products/${p._id}/edit`} className="line-clamp-1 font-semibold text-ink hover:text-rose-600">
              {p.name}
            </Link>
            <p className="text-[11px] text-ink-faint">{inr(p.price)} · alert at {p.lowStockThreshold}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'stock',
      header: 'In stock',
      render: (p) => (
        <Badge tone={p.stock === 0 ? 'red' : p.stock <= p.lowStockThreshold ? 'amber' : 'green'}>
          {p.stock} unit{p.stock === 1 ? '' : 's'}
        </Badge>
      ),
    },
    {
      key: 'value',
      header: 'Stock value',
      render: (p) => <span className="font-semibold text-ink">{inr(p.stock * p.price)}</span>,
    },
    {
      key: 'adjust',
      header: 'Quick adjust',
      align: 'right',
      render: (p) => (
        <div className="flex items-center justify-end gap-2">
          <div className="inline-flex items-center rounded-lg border border-line">
            <button
              onClick={() => adjust(p, -1)}
              disabled={p.stock === 0 || busyId === p._id}
              className="px-2.5 py-1.5 text-ink-muted transition hover:text-rose-600 disabled:opacity-30"
            >
              <Minus size={13} />
            </button>
            <span className="w-8 text-center text-[12.5px] font-bold text-ink">
              {busyId === p._id ? '…' : p.stock}
            </span>
            <button
              onClick={() => adjust(p, 1)}
              disabled={busyId === p._id}
              className="px-2.5 py-1.5 text-ink-muted transition hover:text-rose-600 disabled:opacity-30"
            >
              <Plus size={13} />
            </button>
          </div>

          <div className="flex items-center gap-1">
            <input
              value={drafts[p._id] ?? ''}
              onChange={(e) => setDrafts((d) => ({ ...d, [p._id]: e.target.value.replace(/\D/g, '') }))}
              placeholder="Set"
              className="w-16 rounded-lg border border-line px-2 py-1.5 text-[12.5px] focus:border-rose-300 focus:outline-none"
            />
            <button
              onClick={() => setAbsolute(p)}
              disabled={!drafts[p._id] || busyId === p._id}
              className="rounded-lg p-1.5 text-ink-faint transition hover:bg-blush hover:text-rose-600 disabled:opacity-30"
            >
              <Check size={14} />
            </button>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Inventory"
        subtitle="Out-of-stock products are hidden from customers automatically."
        action={<button onClick={load} className="btn-ghost btn-sm"><Refresh size={14} /> Refresh</button>}
      />

      <div className="mb-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Package} label="Total units" value={totalUnits} sub={`${products.length} products`} tone="ink" />
        <StatCard icon={Package} label="Stock value" value={inr(stockValue)} sub="at selling price" tone="green" />
        <StatCard icon={Warning} label="Low stock" value={lowCount} sub="need restocking soon" tone="gold" />
        <StatCard icon={Warning} label="Out of stock" value={outCount} sub="hidden from customers" tone="red" />
      </div>

      <div className="mb-4">
        <FilterTabs options={FILTERS} value={stock} onChange={setStock} />
      </div>

      <PanelCard padded={false} className="mb-6">
        <DataTable
          columns={columns}
          rows={products}
          loading={loading}
          empty={
            <EmptyState
              icon="box"
              title={stock ? 'Nothing in this state' : 'No products yet'}
              message={stock === 'low' ? 'Everything is comfortably stocked.' : stock === 'out' ? 'Nothing has run out. Nice.' : 'Add a product to start tracking stock.'}
            />
          }
          mobileCard={(p) => (
            <div>
              <div className="flex gap-3">
                <Img src={p.images?.[0]} alt={p.name} seed={p.slug} className="h-14 w-14 shrink-0 rounded-xl object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-1 text-[13.5px] font-semibold text-ink">{p.name}</p>
                  <p className="text-[11.5px] text-ink-faint">{inr(p.price)}</p>
                  <Badge tone={p.stock === 0 ? 'red' : p.stock <= p.lowStockThreshold ? 'amber' : 'green'} className="mt-1.5 !text-[10px]">
                    {p.stock} in stock
                  </Badge>
                </div>
                <div className="inline-flex h-fit items-center rounded-lg border border-line">
                  <button onClick={() => adjust(p, -1)} disabled={p.stock === 0} className="px-2.5 py-1.5 text-ink-muted disabled:opacity-30">
                    <Minus size={13} />
                  </button>
                  <span className="w-7 text-center text-[12px] font-bold">{p.stock}</span>
                  <button onClick={() => adjust(p, 1)} className="px-2.5 py-1.5 text-ink-muted">
                    <Plus size={13} />
                  </button>
                </div>
              </div>
            </div>
          )}
        />
      </PanelCard>

      <PanelCard title="Stock history" subtitle="Every change, and what caused it" padded={false}>
        {logs.length ? (
          <div className="max-h-96 divide-y divide-line overflow-y-auto">
            {logs.map((l) => (
              <div key={l._id} className="flex items-center gap-3 px-5 py-3">
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[12px] font-bold ${
                    l.change > 0 ? 'bg-[#EAF7F0] text-[#1F6B45]' : 'bg-[#FDECEC] text-[#B3261E]'
                  }`}
                >
                  {l.change > 0 ? `+${l.change}` : l.change}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-1 text-[13px] font-medium text-ink">{l.product?.name || 'Product'}</p>
                  <p className="text-[11.5px] text-ink-faint">
                    {l.reason} · {l.note || '—'} · {formatDateTime(l.createdAt)}
                  </p>
                </div>
                <span className="shrink-0 text-[12px] text-ink-muted">→ {l.stockAfter}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-5"><EmptyState icon="note" title="No stock movements yet" /></div>
        )}
      </PanelCard>
    </div>
  );
}
