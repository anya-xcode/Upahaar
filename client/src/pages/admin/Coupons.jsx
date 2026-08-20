import { useEffect, useState } from 'react';
import api from '../../lib/api.js';
import { toast } from '../../store/toastStore.js';
import { PageHeader, PanelCard, DataTable, SearchInput } from '../../components/common/panel.jsx';
import { Badge, Modal, Pagination, EmptyState, Spinner } from '../../components/common/ui.jsx';
import { Plus, Edit, Trash, Tag, Check } from '../../components/common/Icons.jsx';
import { inr, formatDate } from '../../lib/format.js';

const EMPTY = {
  code: '', title: '', description: '',
  type: 'PERCENT', value: 10, maxDiscount: '', minOrderValue: 0,
  categories: [], sellers: [], pincodes: [],
  firstOrderOnly: false, usageLimit: 0, perUserLimit: 1,
  startsAt: '', expiresAt: '', isActive: true, isVisible: true,
};

export default function Coupons() {
  const [data, setData] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/catalog/categories').then(({ data: d }) => setCategories(d.categories)).catch(() => {});
  }, []);

  async function load() {
    setLoading(true);
    try {
      const { data: d } = await api.get('/admin/coupons', { params: { q: q || undefined, page, limit: 20 } });
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
  }, [q, page]);

  async function save(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...editing,
        value: Number(editing.value),
        maxDiscount: editing.maxDiscount === '' ? undefined : Number(editing.maxDiscount),
        minOrderValue: Number(editing.minOrderValue || 0),
        usageLimit: Number(editing.usageLimit || 0),
        perUserLimit: Number(editing.perUserLimit || 0),
        startsAt: editing.startsAt || undefined,
        expiresAt: editing.expiresAt || undefined,
        pincodes: typeof editing.pincodes === 'string'
          ? editing.pincodes.split(',').map((s) => s.trim()).filter(Boolean)
          : editing.pincodes,
      };
      if (editing._id) await api.patch(`/admin/coupons/${editing._id}`, payload);
      else await api.post('/admin/coupons', payload);
      toast.success(editing._id ? 'Coupon updated' : 'Coupon created');
      setEditing(null);
      await load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function remove(coupon) {
    if (!window.confirm(`Delete ${coupon.code}?`)) return;
    try {
      await api.delete(`/admin/coupons/${coupon._id}`);
      toast.success('Coupon deleted');
      await load();
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function toggleActive(coupon) {
    try {
      await api.patch(`/admin/coupons/${coupon._id}`, { isActive: !coupon.isActive });
      await load();
    } catch (err) {
      toast.error(err.message);
    }
  }

  function edit(coupon) {
    setEditing({
      ...EMPTY,
      ...coupon,
      maxDiscount: coupon.maxDiscount ?? '',
      categories: (coupon.categories || []).map((c) => c._id || c),
      sellers: (coupon.sellers || []).map((s) => s._id || s),
      startsAt: coupon.startsAt ? coupon.startsAt.slice(0, 10) : '',
      expiresAt: coupon.expiresAt ? coupon.expiresAt.slice(0, 10) : '',
    });
  }

  const columns = [
    {
      key: 'code',
      header: 'Coupon',
      render: (c) => (
        <div className="min-w-0">
          <p className="font-display text-[15px] font-bold tracking-wide text-rose-600">{c.code}</p>
          <p className="line-clamp-1 text-[11.5px] text-ink-faint">{c.title}</p>
        </div>
      ),
    },
    {
      key: 'value',
      header: 'Discount',
      render: (c) => (
        <div>
          <p className="font-bold text-ink">{c.type === 'PERCENT' ? `${c.value}%` : inr(c.value)}</p>
          {c.maxDiscount > 0 && <p className="text-[11px] text-ink-faint">max {inr(c.maxDiscount)}</p>}
        </div>
      ),
    },
    { key: 'minOrderValue', header: 'Min order', render: (c) => <span className="text-ink-soft">{c.minOrderValue > 0 ? inr(c.minOrderValue) : '—'}</span> },
    {
      key: 'scope',
      header: 'Scope',
      render: (c) => (
        <div className="flex flex-wrap gap-1">
          {c.firstOrderOnly && <Badge tone="rose" className="!text-[9px]">1st order</Badge>}
          {c.categories?.length > 0 && <Badge tone="neutral" className="!text-[9px]">{c.categories.length} cat</Badge>}
          {c.pincodes?.length > 0 && <Badge tone="blue" className="!text-[9px]">{c.pincodes.length} PIN</Badge>}
          {!c.firstOrderOnly && !c.categories?.length && !c.pincodes?.length && <span className="text-[11.5px] text-ink-faint">Everywhere</span>}
        </div>
      ),
    },
    {
      key: 'usageCount',
      header: 'Used',
      render: (c) => (
        <span className="text-ink-soft">
          {c.usageCount}{c.usageLimit > 0 ? ` / ${c.usageLimit}` : ''}
        </span>
      ),
    },
    { key: 'expiresAt', header: 'Expires', render: (c) => (
      <span className="text-ink-muted">{c.expiresAt ? formatDate(c.expiresAt) : 'never'}</span>
    ) },
    {
      key: 'isActive',
      header: 'Status',
      render: (c) => (
        <button onClick={(e) => { e.stopPropagation(); toggleActive(c); }}>
          <Badge tone={c.isActive ? 'green' : 'neutral'}>{c.isActive ? 'Active' : 'Paused'}</Badge>
        </button>
      ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (c) => (
        <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <button onClick={() => edit(c)} className="rounded-lg p-2 text-ink-faint transition hover:bg-blush hover:text-rose-600"><Edit size={15} /></button>
          <button onClick={() => remove(c)} className="rounded-lg p-2 text-ink-faint transition hover:bg-blush hover:text-[#B3261E]"><Trash size={15} /></button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Coupons & offers"
        subtitle="Platform-wide, category, seller, location and time-limited offers."
        action={<button onClick={() => setEditing({ ...EMPTY })} className="btn-primary btn-sm"><Plus size={14} /> New coupon</button>}
      />

      <div className="mb-4">
        <SearchInput value={q} onChange={(v) => { setQ(v); setPage(1); }} placeholder="Search coupon codes…" className="w-full sm:w-64" />
      </div>

      <PanelCard padded={false}>
        <DataTable
          columns={columns}
          rows={data?.coupons}
          loading={loading}
          empty={
            <EmptyState
              icon="tag"
              title="No coupons yet"
              message="Create your first offer to bring customers back."
              action={<button onClick={() => setEditing({ ...EMPTY })} className="btn-primary">Create a coupon</button>}
            />
          }
          mobileCard={(c) => (
            <div>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-display text-[15px] font-bold tracking-wide text-rose-600">{c.code}</p>
                  <p className="text-[11.5px] text-ink-faint">{c.title}</p>
                </div>
                <span className="shrink-0 text-[15px] font-bold text-ink">
                  {c.type === 'PERCENT' ? `${c.value}%` : inr(c.value)}
                </span>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <Badge tone={c.isActive ? 'green' : 'neutral'} className="!text-[10px]">{c.isActive ? 'Active' : 'Paused'}</Badge>
                <Badge tone="neutral" className="!text-[10px]">used {c.usageCount}</Badge>
                {c.expiresAt && <Badge tone="neutral" className="!text-[10px]">till {formatDate(c.expiresAt)}</Badge>}
              </div>
              <div className="mt-3 flex gap-2" onClick={(e) => e.stopPropagation()}>
                <button onClick={() => edit(c)} className="btn-ghost btn-sm flex-1"><Edit size={13} /> Edit</button>
                <button onClick={() => remove(c)} className="btn-ghost btn-sm !text-[#B3261E]"><Trash size={13} /></button>
              </div>
            </div>
          )}
        />
      </PanelCard>

      <Pagination page={data?.page} pages={data?.pages} onChange={setPage} className="mt-6" />

      <Modal
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        title={editing?._id ? `Edit ${editing.code}` : 'New coupon'}
        width="max-w-xl"
      >
        {editing && (
          <form onSubmit={save} className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="label">Code <span className="text-rose-500">*</span></label>
                <input
                  required
                  value={editing.code}
                  onChange={(e) => setEditing({ ...editing, code: e.target.value.toUpperCase().replace(/\s/g, '') })}
                  placeholder="WELCOME10"
                  className="input font-display font-bold tracking-wider"
                />
              </div>
              <div>
                <label className="label">Type</label>
                <select value={editing.type} onChange={(e) => setEditing({ ...editing, type: e.target.value })} className="input">
                  <option value="PERCENT">Percentage off</option>
                  <option value="FLAT">Flat amount off</option>
                </select>
              </div>
            </div>

            <div>
              <label className="label">Title <span className="text-rose-500">*</span></label>
              <input required value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} placeholder="10% off your first gift" className="input" />
            </div>

            <div>
              <label className="label">Description</label>
              <input value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} className="input" />
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <label className="label">{editing.type === 'PERCENT' ? 'Percent off' : 'Amount off (₹)'} <span className="text-rose-500">*</span></label>
                <input type="number" required min={1} value={editing.value} onChange={(e) => setEditing({ ...editing, value: e.target.value })} className="input" />
              </div>
              {editing.type === 'PERCENT' && (
                <div>
                  <label className="label">Max discount (₹)</label>
                  <input type="number" min={0} value={editing.maxDiscount} onChange={(e) => setEditing({ ...editing, maxDiscount: e.target.value })} className="input" />
                </div>
              )}
              <div>
                <label className="label">Min order (₹)</label>
                <input type="number" min={0} value={editing.minOrderValue} onChange={(e) => setEditing({ ...editing, minOrderValue: e.target.value })} className="input" />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="label">Starts</label>
                <input type="date" value={editing.startsAt} onChange={(e) => setEditing({ ...editing, startsAt: e.target.value })} className="input" />
              </div>
              <div>
                <label className="label">Expires</label>
                <input type="date" value={editing.expiresAt} onChange={(e) => setEditing({ ...editing, expiresAt: e.target.value })} className="input" />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="label">Total uses (0 = unlimited)</label>
                <input type="number" min={0} value={editing.usageLimit} onChange={(e) => setEditing({ ...editing, usageLimit: e.target.value })} className="input" />
              </div>
              <div>
                <label className="label">Uses per customer</label>
                <input type="number" min={0} value={editing.perUserLimit} onChange={(e) => setEditing({ ...editing, perUserLimit: e.target.value })} className="input" />
              </div>
            </div>

            <div className="rounded-xl border border-line p-4">
              <p className="mb-3 text-[13px] font-bold text-ink">Targeting</p>

              <label className="label">Limit to categories (leave empty for all)</label>
              <div className="mb-3 flex max-h-32 flex-wrap gap-1.5 overflow-y-auto">
                {categories.map((c) => {
                  const active = editing.categories.includes(c._id);
                  return (
                    <button
                      type="button"
                      key={c._id}
                      onClick={() =>
                        setEditing({
                          ...editing,
                          categories: active
                            ? editing.categories.filter((x) => x !== c._id)
                            : [...editing.categories, c._id],
                        })
                      }
                      className={`chip border transition ${active ? 'border-rose-300 bg-rose-50 text-rose-700' : 'border-line bg-white text-ink-muted'}`}
                    >
                      {c.name}
                    </button>
                  );
                })}
              </div>

              <label className="label">Limit to PIN codes (comma separated)</label>
              <input
                value={Array.isArray(editing.pincodes) ? editing.pincodes.join(', ') : editing.pincodes}
                onChange={(e) => setEditing({ ...editing, pincodes: e.target.value })}
                placeholder="400001, 400005"
                className="input font-mono text-[12px]"
              />
            </div>

            <div className="space-y-2">
              <Check2 checked={editing.firstOrderOnly} onChange={(v) => setEditing({ ...editing, firstOrderOnly: v })} label="First order only" />
              <Check2 checked={editing.isVisible} onChange={(v) => setEditing({ ...editing, isVisible: v })} label="Show in the customer coupons drawer" />
              <Check2 checked={editing.isActive} onChange={(v) => setEditing({ ...editing, isActive: v })} label="Active" />
            </div>

            <div className="flex gap-2">
              <button disabled={saving} className="btn-primary flex-1">
                {saving ? <Spinner size={15} /> : <Tag size={15} />} Save coupon
              </button>
              <button type="button" onClick={() => setEditing(null)} className="btn-ghost">Cancel</button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}

function Check2({ checked, onChange, label }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`flex w-full items-center gap-3 rounded-lg border p-2.5 text-left transition ${
        checked ? 'border-rose-300 bg-rose-50' : 'border-line'
      }`}
    >
      <span className={`flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded border-2 ${checked ? 'border-rose-500 bg-rose-500 text-white' : 'border-line'}`}>
        {checked && <Check size={11} />}
      </span>
      <span className="text-[12.5px] font-semibold text-ink">{label}</span>
    </button>
  );
}
