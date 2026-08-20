import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api from '../../lib/api.js';
import { toast } from '../../store/toastStore.js';
import { PageHeader, PanelCard } from '../../components/common/panel.jsx';
import { Img, Badge, Spinner, Skeleton } from '../../components/common/ui.jsx';
import { Check, Plus, Trash, ChevronLeft, Clock, Upload, Warning } from '../../components/common/Icons.jsx';
import { TierIcon } from '../../lib/glyphs.jsx';
import { inr } from '../../lib/format.js';

const EMPTY = {
  name: '', description: '', highlights: [], images: [],
  category: '', occasions: [],
  price: '', mrp: '', stock: 10, lowStockThreshold: 5,
  baseTier: 'NEXT_DAY', prepTimeMinutes: 45, isPerishable: false,
  personalizable: false, allowsPhotoUpload: false, personalizationFee: 0, personalizationNote: '',
  variants: [], tags: [], isActive: true,
};

export default function ProductForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [form, setForm] = useState(EMPTY);
  const [meta, setMeta] = useState({ categories: [], occasions: [], tiers: [] });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [imageInput, setImageInput] = useState('');
  const [highlightInput, setHighlightInput] = useState('');
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const [m, p] = await Promise.all([
          api.get('/seller/meta'),
          isEdit ? api.get(`/seller/products/${id}`) : Promise.resolve(null),
        ]);
        setMeta(m.data);
        if (p) {
          const prod = p.data.product;
          setForm({
            ...EMPTY,
            ...prod,
            category: prod.category?._id || prod.category || '',
            occasions: (prod.occasions || []).map((o) => o._id || o),
          });
        } else {
          setForm((f) => ({ ...f, category: m.data.categories[0]?._id || '' }));
        }
      } catch (err) {
        toast.error(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id, isEdit]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  function addTo(key, value, clear) {
    if (!value.trim()) return;
    setForm((f) => ({ ...f, [key]: [...f[key], value.trim()] }));
    clear('');
  }

  function removeFrom(key, index) {
    setForm((f) => ({ ...f, [key]: f[key].filter((_, i) => i !== index) }));
  }

  function toggleOccasion(occasionId) {
    setForm((f) => ({
      ...f,
      occasions: f.occasions.includes(occasionId)
        ? f.occasions.filter((o) => o !== occasionId)
        : [...f.occasions, occasionId],
    }));
  }

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        price: Number(form.price),
        mrp: form.mrp ? Number(form.mrp) : undefined,
        stock: Number(form.stock),
        lowStockThreshold: Number(form.lowStockThreshold),
        prepTimeMinutes: Number(form.prepTimeMinutes),
        personalizationFee: Number(form.personalizationFee || 0),
      };
      if (isEdit) await api.patch(`/seller/products/${id}`, payload);
      else await api.post('/seller/products', payload);

      toast.success(isEdit ? 'Product updated' : 'Product added');
      navigate('/seller/products');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full rounded-xl2" />
      </div>
    );
  }

  const discount = form.mrp && form.mrp > form.price ? Math.round(((form.mrp - form.price) / form.mrp) * 100) : 0;

  return (
    <div>
      <Link to="/seller/products" className="mb-4 inline-flex items-center gap-1 text-[13px] font-semibold text-ink-muted transition hover:text-rose-600">
        <ChevronLeft size={15} /> All products
      </Link>

      <PageHeader
        title={isEdit ? 'Edit product' : 'Add a product'}
        subtitle="Everything customers see, and how fast you can get it to them."
      />

      <form onSubmit={submit} className="grid gap-5 lg:grid-cols-[1fr_360px]">
        <div className="space-y-5">
          <PanelCard title="The basics">
            <div className="space-y-4">
              <div>
                <label className="label">Product name <span className="text-rose-500">*</span></label>
                <input required value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Chocolate & Rose Gift Box" className="input" />
              </div>

              <div>
                <label className="label">Description</label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => set('description', e.target.value)}
                  placeholder="A dozen dark and milk truffles nestled beside six long-stem roses…"
                  className="input resize-none"
                />
              </div>

              <div>
                <label className="label">Category <span className="text-rose-500">*</span></label>
                <select required value={form.category} onChange={(e) => set('category', e.target.value)} className="input">
                  <option value="">Choose a category</option>
                  {meta.categories.map((c) => (
                    <option key={c._id} value={c._id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Occasions this suits</label>
                <div className="flex flex-wrap gap-1.5">
                  {meta.occasions.map((o) => {
                    const active = form.occasions.includes(o._id);
                    return (
                      <button
                        type="button"
                        key={o._id}
                        onClick={() => toggleOccasion(o._id)}
                        className={`chip border transition ${
                          active ? 'border-rose-300 bg-rose-50 text-rose-700' : 'border-line bg-white text-ink-muted hover:border-rose-200'
                        }`}
                      >
                        {o.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </PanelCard>

          <PanelCard title="Images" subtitle="Paste image links — direct upload arrives with Cloudinary.">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Upload size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint" />
                <input
                  value={imageInput}
                  onChange={(e) => setImageInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addTo('images', imageInput, setImageInput);
                    }
                  }}
                  placeholder="https://…"
                  className="input pl-9"
                />
              </div>
              <button type="button" onClick={() => addTo('images', imageInput, setImageInput)} className="btn-ghost btn-sm shrink-0">
                <Plus size={14} /> Add
              </button>
            </div>

            {form.images.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-3">
                {form.images.map((img, i) => (
                  <div key={img + i} className="group relative">
                    <Img src={img} alt={`Image ${i + 1}`} seed={img} className="h-24 w-24 rounded-xl border border-line object-cover" />
                    {i === 0 && (
                      <span className="absolute left-1 top-1 rounded-full bg-ink px-1.5 py-0.5 text-[9px] font-bold text-white">Cover</span>
                    )}
                    <button
                      type="button"
                      onClick={() => removeFrom('images', i)}
                      className="absolute -right-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-white text-[#B3261E] shadow-soft transition hover:bg-[#FEF6F5]"
                    >
                      <Trash size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </PanelCard>

          <PanelCard title="Highlights & tags">
            <div className="space-y-4">
              <div>
                <label className="label">Highlights (bullet points on the product page)</label>
                <div className="flex gap-2">
                  <input
                    value={highlightInput}
                    onChange={(e) => setHighlightInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addTo('highlights', highlightInput, setHighlightInput);
                      }
                    }}
                    placeholder="12 handmade truffles"
                    className="input"
                  />
                  <button type="button" onClick={() => addTo('highlights', highlightInput, setHighlightInput)} className="btn-ghost btn-sm shrink-0">
                    <Plus size={14} />
                  </button>
                </div>
                <div className="mt-2 space-y-1.5">
                  {form.highlights.map((h, i) => (
                    <div key={h + i} className="flex items-center gap-2 rounded-lg bg-blush px-3 py-2 text-[13px] text-ink-soft">
                      <Check size={13} className="shrink-0 text-rose-500" />
                      <span className="min-w-0 flex-1">{h}</span>
                      <button type="button" onClick={() => removeFrom('highlights', i)} className="text-ink-faint hover:text-[#B3261E]">
                        <Trash size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="label">Search tags</label>
                <div className="flex gap-2">
                  <input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addTo('tags', tagInput, setTagInput);
                      }
                    }}
                    placeholder="romantic"
                    className="input"
                  />
                  <button type="button" onClick={() => addTo('tags', tagInput, setTagInput)} className="btn-ghost btn-sm shrink-0">
                    <Plus size={14} />
                  </button>
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {form.tags.map((t, i) => (
                    <button type="button" key={t + i} onClick={() => removeFrom('tags', i)} className="chip border border-line bg-white text-ink-muted">
                      #{t} <Trash size={11} />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </PanelCard>

          <PanelCard title="Personalisation">
            <div className="space-y-3">
              <Toggle
                checked={form.personalizable}
                onChange={(v) => set('personalizable', v)}
                title="Customers can personalise this"
                sub="Adds a message field on the product page"
              />
              {form.personalizable && (
                <>
                  <Toggle
                    checked={form.allowsPhotoUpload}
                    onChange={(v) => set('allowsPhotoUpload', v)}
                    title="Allow photo upload"
                    sub="For photo cakes, frames, mugs and lamps"
                  />
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="label">Personalisation fee (per item)</label>
                      <input
                        type="number"
                        min={0}
                        value={form.personalizationFee}
                        onChange={(e) => set('personalizationFee', e.target.value)}
                        className="input"
                      />
                    </div>
                    <div>
                      <label className="label">Instructions for the customer</label>
                      <input
                        value={form.personalizationNote || ''}
                        onChange={(e) => set('personalizationNote', e.target.value)}
                        placeholder="Up to 12 characters, printed in gold"
                        className="input"
                      />
                    </div>
                  </div>
                </>
              )}
            </div>
          </PanelCard>
        </div>

        {/* Sidebar */}
        <div className="space-y-5 lg:sticky lg:top-6 lg:self-start">
          <PanelCard title="Pricing">
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="label">Selling price <span className="text-rose-500">*</span></label>
                  <input type="number" required min={1} value={form.price} onChange={(e) => set('price', e.target.value)} placeholder="999" className="input" />
                </div>
                <div>
                  <label className="label">MRP (struck through)</label>
                  <input type="number" min={0} value={form.mrp || ''} onChange={(e) => set('mrp', e.target.value)} placeholder="1299" className="input" />
                </div>
              </div>
              {discount > 0 && (
                <p className="rounded-lg bg-[#F2FBF6] px-3 py-2 text-[12.5px] font-semibold text-[#1F6B45]">
                  Shows as {discount}% off — customers save {inr(form.mrp - form.price)}
                </p>
              )}

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="label">Stock</label>
                  <input type="number" min={0} value={form.stock} onChange={(e) => set('stock', e.target.value)} className="input" />
                </div>
                <div>
                  <label className="label">Low stock alert at</label>
                  <input type="number" min={0} value={form.lowStockThreshold} onChange={(e) => set('lowStockThreshold', e.target.value)} className="input" />
                </div>
              </div>
            </div>
          </PanelCard>

          {/* The section that actually decides visibility */}
          <PanelCard title="Delivery capability" subtitle="This decides which customers see this gift.">
            <div className="space-y-4">
              <div>
                <label className="label">Fastest tier you can promise</label>
                <div className="space-y-2">
                  {meta.tiers.map((t) => (
                    <button
                      type="button"
                      key={t.key}
                      onClick={() => set('baseTier', t.key)}
                      className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition ${
                        form.baseTier === t.key ? 'border-rose-400 bg-rose-50' : 'border-line hover:border-rose-200'
                      }`}
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blush text-rose-500">
                        <TierIcon tier={t.key} size={16} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[13px] font-bold text-ink">{t.label.replace('Deliver ', '')}</span>
                        <span className="block text-[11px] text-ink-muted">{t.tagline}</span>
                      </span>
                      {form.baseTier === t.key && <Check size={15} className="shrink-0 text-rose-500" />}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="label">
                  <Clock size={12} className="mr-1 inline" /> Preparation time: {form.prepTimeMinutes} minutes
                </label>
                <input
                  type="range"
                  min={5}
                  max={300}
                  step={5}
                  value={form.prepTimeMinutes}
                  onChange={(e) => set('prepTimeMinutes', e.target.value)}
                  className="w-full accent-rose-500"
                />
                <div className="flex justify-between text-[11px] text-ink-faint">
                  <span>5 min</span>
                  <span>5 hours</span>
                </div>
              </div>

              <Toggle
                checked={form.isPerishable}
                onChange={(v) => set('isPerishable', v)}
                title="Perishable"
                sub="Cakes and flowers — never shipped long distance"
              />

              <div className="flex items-start gap-2.5 rounded-xl bg-blush p-3 text-[11.5px] leading-relaxed text-ink-muted">
                <Warning size={14} className="mt-0.5 shrink-0 text-rose-400" />
                Upahaar may show a slower badge than the one you pick if the customer is far away, you are
                closed, or ops has limited express delivery in their area.
              </div>
            </div>
          </PanelCard>

          <PanelCard title="Visibility">
            <Toggle
              checked={form.isActive}
              onChange={(v) => set('isActive', v)}
              title="Live on the store"
              sub="Turn off to hide without deleting"
            />
          </PanelCard>

          <div className="flex gap-2">
            <button disabled={saving} className="btn-primary flex-1 !py-3">
              {saving ? <Spinner size={15} /> : <Check size={15} />}
              {isEdit ? 'Save changes' : 'Add product'}
            </button>
            <Link to="/seller/products" className="btn-ghost">Cancel</Link>
          </div>
        </div>
      </form>
    </div>
  );
}

function Toggle({ checked, onChange, title, sub }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition ${
        checked ? 'border-rose-400 bg-rose-50' : 'border-line hover:border-rose-200'
      }`}
    >
      <span
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition ${
          checked ? 'border-rose-500 bg-rose-500 text-white' : 'border-line'
        }`}
      >
        {checked && <Check size={12} />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[13px] font-bold text-ink">{title}</span>
        <span className="block text-[11.5px] text-ink-muted">{sub}</span>
      </span>
    </button>
  );
}
