import { useEffect, useState } from 'react';
import api from '../../lib/api.js';
import { toast } from '../../store/toastStore.js';
import { PageHeader, PanelCard, StatCard, SearchInput } from '../../components/common/panel.jsx';
import { Badge, Modal, Skeleton, EmptyState, Spinner } from '../../components/common/ui.jsx';
import {
  MapPin, Plus, Edit, Trash, Check, Close, Bolt, ChevronDown, Store, Truck, Warning, Clock, Package, Cash,
} from '../../components/common/Icons.jsx';
import { inr } from '../../lib/format.js';

const EMPTY_PINCODE = {
  code: '', city: '', state: '', area: '',
  location: { lat: '', lng: '' },
  isServiceable: true, express60Available: false, priority3hAvailable: true,
  nextDayAvailable: true, standardAvailable: true, codAvailable: true,
  expressFee: '', priorityFee: '', standardFee: '',
  deliveryPartners: [],
};

const EMPTY_ZONE = {
  name: '', city: '', state: '', pincodes: [], activeRiders: 0, express60Enabled: true, isActive: true,
};

export default function Pincodes() {
  const [grouped, setGrouped] = useState([]);
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [openCity, setOpenCity] = useState(null);
  const [editing, setEditing] = useState(null);
  const [detail, setDetail] = useState(null);
  const [zoneEditing, setZoneEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState('pincodes');

  async function load() {
    setLoading(true);
    try {
      const [p, z] = await Promise.all([
        api.get('/admin/pincodes', { params: { q: q || undefined } }),
        api.get('/admin/zones'),
      ]);
      setGrouped(p.data.grouped);
      setZones(z.data.items);
      if (!openCity && p.data.grouped.length) setOpenCity(p.data.grouped[0].city);
    } catch {
      setGrouped([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const t = setTimeout(load, q ? 300 : 0);
    return () => clearTimeout(t);
  }, [q]);

  /** Inline flag toggle — the fastest way for ops to change serviceability. */
  async function toggleFlag(pincode, field) {
    try {
      await api.patch(`/admin/pincodes/${pincode._id}`, { [field]: !pincode[field] });
      await load();
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function savePincode(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...editing,
        location: {
          lat: editing.location?.lat ? Number(editing.location.lat) : undefined,
          lng: editing.location?.lng ? Number(editing.location.lng) : undefined,
        },
        expressFee: editing.expressFee === '' ? null : Number(editing.expressFee),
        priorityFee: editing.priorityFee === '' ? null : Number(editing.priorityFee),
        standardFee: editing.standardFee === '' ? null : Number(editing.standardFee),
      };
      if (editing._id) await api.patch(`/admin/pincodes/${editing._id}`, payload);
      else await api.post('/admin/pincodes', payload);
      toast.success(editing._id ? 'PIN code updated' : 'PIN code added');
      setEditing(null);
      await load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function removePincode(pincode) {
    if (!window.confirm(`Remove ${pincode.code}?`)) return;
    try {
      await api.delete(`/admin/pincodes/${pincode._id}`);
      toast.success('PIN code removed');
      await load();
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function openDetail(pincode) {
    try {
      const { data } = await api.get(`/admin/pincodes/${pincode.code}/detail`);
      setDetail(data);
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function saveZone(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...zoneEditing,
        activeRiders: Number(zoneEditing.activeRiders),
        pincodes: typeof zoneEditing.pincodes === 'string'
          ? zoneEditing.pincodes.split(',').map((s) => s.trim()).filter(Boolean)
          : zoneEditing.pincodes,
      };
      if (zoneEditing._id) await api.patch(`/admin/zones/${zoneEditing._id}`, payload);
      else await api.post('/admin/zones', payload);
      toast.success('Zone saved');
      setZoneEditing(null);
      await load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  }

  const totals = grouped.reduce(
    (acc, g) => ({
      pincodes: acc.pincodes + g.total,
      express: acc.express + g.express,
      sellers: acc.sellers + g.pincodes.reduce((n, p) => n + (p.sellerCount || 0), 0),
    }),
    { pincodes: 0, express: 0, sellers: 0 }
  );

  return (
    <div>
      <PageHeader
        title="PIN codes & delivery zones"
        subtitle="The serviceability map. Switching a tier off here removes it from the storefront immediately."
        action={
          <div className="flex gap-2">
            <button onClick={() => setZoneEditing({ ...EMPTY_ZONE })} className="btn-ghost btn-sm"><Plus size={14} /> Zone</button>
            <button onClick={() => setEditing({ ...EMPTY_PINCODE })} className="btn-primary btn-sm"><Plus size={14} /> PIN code</button>
          </div>
        }
      />

      <div className="mb-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={MapPin} label="Serviceable PIN codes" value={totals.pincodes} sub={`${grouped.length} cities`} tone="ink" />
        <StatCard icon={Bolt} label="60-minute enabled" value={totals.express} sub="express-ready areas" tone="rose" />
        <StatCard icon={Store} label="Seller coverage" value={totals.sellers} sub="seller × pincode links" tone="green" />
        <StatCard icon={Truck} label="Delivery zones" value={zones.length} sub={`${zones.filter((z) => z.express60Enabled).length} express-enabled`} tone="blue" />
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="flex rounded-full border border-line bg-white p-1">
          {[['pincodes', 'PIN codes'], ['zones', 'Zones']].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`rounded-full px-4 py-1.5 text-[13px] font-semibold transition ${
                tab === key ? 'bg-rose-500 text-white' : 'text-ink-muted hover:text-ink'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        {tab === 'pincodes' && (
          <SearchInput value={q} onChange={setQ} placeholder="Search PIN code, city or area…" className="w-full sm:w-72" />
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-xl2" />)}
        </div>
      ) : tab === 'zones' ? (
        <ZoneList zones={zones} onEdit={setZoneEditing} onReload={load} />
      ) : !grouped.length ? (
        <PanelCard><EmptyState icon="location" title="No PIN codes found" message="Try another search, or add one." /></PanelCard>
      ) : (
        <div className="space-y-3">
          {grouped.map((city) => (
            <div key={city.city} className="card overflow-hidden">
              <button
                onClick={() => setOpenCity(openCity === city.city ? null : city.city)}
                className="flex w-full items-center gap-4 px-5 py-4 text-left transition hover:bg-blush"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blush">
                  <MapPin size={18} className="text-rose-500" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-display text-lg font-semibold text-ink">{city.city}</p>
                  <p className="text-[12px] text-ink-muted">{city.state} · {city.total} PIN codes</p>
                </div>
                <div className="hidden shrink-0 items-center gap-2 sm:flex">
                  <Badge tone="rose"><Bolt size={11} /> {city.express} express</Badge>
                  <Badge tone="neutral">{city.total - city.express} standard</Badge>
                </div>
                <ChevronDown size={18} className={`shrink-0 text-ink-faint transition ${openCity === city.city ? 'rotate-180' : ''}`} />
              </button>

              {openCity === city.city && (
                <div className="border-t border-line">
                  {/* Header row (desktop) */}
                  <div className="hidden items-center gap-3 border-b border-line bg-blush/50 px-5 py-2.5 text-[10.5px] font-bold uppercase tracking-wide text-ink-faint lg:flex">
                    <span className="w-24">PIN code</span>
                    <span className="flex-1">Area</span>
                    <span className="w-16 text-center">Live</span>
                    <span className="w-16 text-center">60 min</span>
                    <span className="w-16 text-center">3 hr</span>
                    <span className="w-16 text-center">Next day</span>
                    <span className="w-16 text-center">COD</span>
                    <span className="w-20 text-center">Sellers</span>
                    <span className="w-20 text-right">Actions</span>
                  </div>

                  <div className="divide-y divide-line">
                    {city.pincodes.map((p) => (
                      <div key={p._id} className="flex flex-wrap items-center gap-3 px-5 py-3">
                        <span className="w-24 shrink-0">
                          <button onClick={() => openDetail(p)} className="font-mono text-[13px] font-bold text-ink hover:text-rose-600">
                            {p.code}
                          </button>
                        </span>
                        <span className="min-w-0 flex-1 truncate text-[12.5px] text-ink-muted">{p.area}</span>

                        <Flag active={p.isServiceable} onClick={() => toggleFlag(p, 'isServiceable')} />
                        <Flag active={p.express60Available} onClick={() => toggleFlag(p, 'express60Available')} />
                        <Flag active={p.priority3hAvailable} onClick={() => toggleFlag(p, 'priority3hAvailable')} />
                        <Flag active={p.nextDayAvailable} onClick={() => toggleFlag(p, 'nextDayAvailable')} />
                        <Flag active={p.codAvailable} onClick={() => toggleFlag(p, 'codAvailable')} />

                        <span className="w-20 shrink-0 text-center">
                          <Badge tone={p.sellerCount > 0 ? 'green' : 'neutral'} className="!text-[10px]">
                            {p.sellerCount || 0}
                          </Badge>
                        </span>

                        <span className="flex w-20 shrink-0 justify-end gap-1">
                          <button onClick={() => setEditing({ ...p, expressFee: p.expressFee ?? '', priorityFee: p.priorityFee ?? '', standardFee: p.standardFee ?? '' })} className="rounded-lg p-1.5 text-ink-faint transition hover:bg-blush hover:text-rose-600">
                            <Edit size={14} />
                          </button>
                          <button onClick={() => removePincode(p)} className="rounded-lg p-1.5 text-ink-faint transition hover:bg-blush hover:text-[#B3261E]">
                            <Trash size={14} />
                          </button>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Edit / create PIN code */}
      <Modal open={Boolean(editing)} onClose={() => setEditing(null)} title={editing?._id ? `Edit ${editing.code}` : 'Add a PIN code'}>
        {editing && (
          <form onSubmit={savePincode} className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="label">PIN code <span className="text-rose-500">*</span></label>
                <input
                  required
                  disabled={Boolean(editing._id)}
                  value={editing.code}
                  onChange={(e) => setEditing({ ...editing, code: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                  className={`input ${editing._id ? 'cursor-not-allowed bg-blush' : ''}`}
                />
              </div>
              <Field label="Area" value={editing.area} onChange={(v) => setEditing({ ...editing, area: v })} />
              <Field label="City" required value={editing.city} onChange={(v) => setEditing({ ...editing, city: v })} />
              <Field label="State" required value={editing.state} onChange={(v) => setEditing({ ...editing, state: v })} />
              <Field label="Latitude" value={editing.location?.lat} onChange={(v) => setEditing({ ...editing, location: { ...editing.location, lat: v } })} />
              <Field label="Longitude" value={editing.location?.lng} onChange={(v) => setEditing({ ...editing, location: { ...editing.location, lng: v } })} />
            </div>

            <p className="text-[11px] text-ink-faint">
              Coordinates drive the distance maths in the availability engine — without them, delivery falls back
              to seller coverage alone.
            </p>

            <div className="rounded-xl border border-line p-4">
              <p className="mb-3 text-[13px] font-bold text-ink">Delivery tiers available here</p>
              <div className="space-y-2">
                <Check2 checked={editing.isServiceable} onChange={(v) => setEditing({ ...editing, isServiceable: v })} label="Serviceable at all" sub="Turning this off hides every gift for this area" />
                <Check2 checked={editing.express60Available} onChange={(v) => setEditing({ ...editing, express60Available: v })} label="60-minute delivery" />
                <Check2 checked={editing.priority3hAvailable} onChange={(v) => setEditing({ ...editing, priority3hAvailable: v })} label="3-hour delivery" />
                <Check2 checked={editing.nextDayAvailable} onChange={(v) => setEditing({ ...editing, nextDayAvailable: v })} label="Next-day delivery" />
                <Check2 checked={editing.standardAvailable} onChange={(v) => setEditing({ ...editing, standardAvailable: v })} label="Standard shipping" />
                <Check2 checked={editing.codAvailable} onChange={(v) => setEditing({ ...editing, codAvailable: v })} label="Cash on delivery" />
              </div>
            </div>

            <div className="rounded-xl border border-line p-4">
              <p className="mb-1 text-[13px] font-bold text-ink">Delivery fee overrides</p>
              <p className="mb-3 text-[11.5px] text-ink-muted">Leave blank to use the platform default (₹99 / ₹49 / free).</p>
              <div className="grid gap-3 sm:grid-cols-3">
                <Field label="Express ₹" value={editing.expressFee} onChange={(v) => setEditing({ ...editing, expressFee: v })} />
                <Field label="Priority ₹" value={editing.priorityFee} onChange={(v) => setEditing({ ...editing, priorityFee: v })} />
                <Field label="Standard ₹" value={editing.standardFee} onChange={(v) => setEditing({ ...editing, standardFee: v })} />
              </div>
            </div>

            <div>
              <label className="label">Delivery partners (comma separated)</label>
              <input
                value={Array.isArray(editing.deliveryPartners) ? editing.deliveryPartners.join(', ') : editing.deliveryPartners}
                onChange={(e) => setEditing({ ...editing, deliveryPartners: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })}
                placeholder="Upahaar Express, Dunzo"
                className="input"
              />
            </div>

            <div className="flex gap-2">
              <button disabled={saving} className="btn-primary flex-1">
                {saving ? <Spinner size={15} /> : <Check size={15} />} Save PIN code
              </button>
              <button type="button" onClick={() => setEditing(null)} className="btn-ghost">Cancel</button>
            </div>
          </form>
        )}
      </Modal>

      {/* PIN code detail */}
      <Modal
        open={Boolean(detail)}
        onClose={() => setDetail(null)}
        title={detail ? `${detail.pincode.code} — ${detail.pincode.area}` : ''}
        subtitle={detail ? `${detail.pincode.city}, ${detail.pincode.state}` : ''}
        width="max-w-2xl"
      >
        {detail && (
          <div className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-3">
              <MiniStat label="Sellers serving" value={detail.sellers.length} />
              <MiniStat label="Products available" value={detail.productCount} />
              <MiniStat label="Riders on shift" value={detail.zone?.activeRiders ?? '—'} />
            </div>

            <div>
              <p className="label">Delivery tiers</p>
              <div className="flex flex-wrap gap-2">
                <Badge tone={detail.pincode.express60Available ? 'rose' : 'neutral'}><Bolt size={11} /> 60 min {detail.pincode.express60Available ? 'on' : 'off'}</Badge>
                <Badge tone={detail.pincode.priority3hAvailable ? 'amber' : 'neutral'}><Clock size={11} /> 3 hours {detail.pincode.priority3hAvailable ? 'on' : 'off'}</Badge>
                <Badge tone={detail.pincode.nextDayAvailable ? 'blue' : 'neutral'}><Package size={11} /> Tomorrow {detail.pincode.nextDayAvailable ? 'on' : 'off'}</Badge>
                <Badge tone={detail.pincode.codAvailable ? 'green' : 'neutral'}><Cash size={11} /> COD {detail.pincode.codAvailable ? 'on' : 'off'}</Badge>
              </div>
            </div>

            {detail.zone && (
              <div className="rounded-xl bg-blush p-4">
                <p className="text-[12px] font-bold uppercase tracking-wide text-ink-faint">Delivery zone</p>
                <p className="mt-1 text-[14px] font-semibold text-ink">{detail.zone.name}</p>
                <p className="text-[12px] text-ink-muted">
                  {detail.zone.activeRiders} riders · {detail.zone.deliveryPartners?.join(', ')}
                </p>
                {detail.zone.activeRiders === 0 && (
                  <p className="mt-2 flex items-center gap-1.5 text-[11.5px] font-semibold text-[#B3261E]">
                    <Warning size={12} /> No riders on shift — express is suppressed for this area.
                  </p>
                )}
              </div>
            )}

            <div>
              <p className="label">Sellers serving this PIN code</p>
              {detail.sellers.length ? (
                <div className="space-y-2">
                  {detail.sellers.map((s) => (
                    <div key={s._id} className="flex items-center gap-3 rounded-xl border border-line p-3">
                      <Store size={16} className="shrink-0 text-rose-500" />
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] font-semibold text-ink">{s.businessName}</p>
                        <p className="text-[11.5px] text-ink-faint">
                          {s.address?.city} · {s.deliveryRadiusKm} km · {s.workingHours?.open}–{s.workingHours?.close}
                        </p>
                      </div>
                      <div className="flex shrink-0 gap-1.5">
                        {s.acceptsExpress && <Badge tone="rose" className="!text-[9px]"><Bolt size={9} /></Badge>}
                        <Badge tone={s.status === 'ACTIVE' ? 'green' : 'amber'} className="!text-[9px]">{s.status}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState icon="store" title="No sellers here yet" message="Only shippable products can reach this area." />
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Zone editor */}
      <Modal open={Boolean(zoneEditing)} onClose={() => setZoneEditing(null)} title={zoneEditing?._id ? 'Edit zone' : 'New delivery zone'}>
        {zoneEditing && (
          <form onSubmit={saveZone} className="space-y-4">
            <Field label="Zone name" required value={zoneEditing.name} onChange={(v) => setZoneEditing({ ...zoneEditing, name: v })} placeholder="South Mumbai" />
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="City" required value={zoneEditing.city} onChange={(v) => setZoneEditing({ ...zoneEditing, city: v })} />
              <Field label="State" required value={zoneEditing.state} onChange={(v) => setZoneEditing({ ...zoneEditing, state: v })} />
            </div>
            <div>
              <label className="label">PIN codes (comma separated)</label>
              <textarea
                rows={3}
                value={Array.isArray(zoneEditing.pincodes) ? zoneEditing.pincodes.join(', ') : zoneEditing.pincodes}
                onChange={(e) => setZoneEditing({ ...zoneEditing, pincodes: e.target.value })}
                className="input resize-none font-mono text-[12px]"
              />
            </div>
            <div>
              <label className="label">Riders on shift: {zoneEditing.activeRiders}</label>
              <input
                type="range"
                min={0}
                max={60}
                value={zoneEditing.activeRiders}
                onChange={(e) => setZoneEditing({ ...zoneEditing, activeRiders: Number(e.target.value) })}
                className="w-full accent-rose-500"
              />
              <p className="text-[11px] text-ink-faint">
                At zero riders, express delivery is automatically suppressed across the zone.
              </p>
            </div>
            <Check2
              checked={zoneEditing.express60Enabled}
              onChange={(v) => setZoneEditing({ ...zoneEditing, express60Enabled: v })}
              label="Express enabled for this zone"
            />
            <div className="flex gap-2">
              <button disabled={saving} className="btn-primary flex-1">
                {saving ? <Spinner size={15} /> : <Check size={15} />} Save zone
              </button>
              <button type="button" onClick={() => setZoneEditing(null)} className="btn-ghost">Cancel</button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}

function ZoneList({ zones, onEdit, onReload }) {
  async function remove(zone) {
    if (!window.confirm(`Delete zone "${zone.name}"?`)) return;
    try {
      await api.delete(`/admin/zones/${zone._id}`);
      toast.success('Zone deleted');
      await onReload();
    } catch (err) {
      toast.error(err.message);
    }
  }

  if (!zones.length) {
    return <PanelCard><EmptyState icon="map" title="No delivery zones" message="Group PIN codes into zones to manage rider capacity." /></PanelCard>;
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {zones.map((z) => (
        <div key={z._id} className="card p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="font-display text-lg font-semibold text-ink">{z.name}</h3>
              <p className="text-[12px] text-ink-muted">{z.city}, {z.state}</p>
            </div>
            <div className="flex shrink-0 gap-1.5">
              <Badge tone={z.express60Enabled && z.activeRiders > 0 ? 'rose' : 'neutral'}>
                <Bolt size={11} /> {z.express60Enabled && z.activeRiders > 0 ? 'Live' : 'Off'}
              </Badge>
              <Badge tone={z.isActive ? 'green' : 'red'}>{z.isActive ? 'Active' : 'Paused'}</Badge>
            </div>
          </div>

          <div className="mt-4 flex gap-6">
            <div>
              <p className="font-display text-2xl font-bold text-ink">{z.pincodes?.length || 0}</p>
              <p className="text-[11px] uppercase tracking-wide text-ink-faint">PIN codes</p>
            </div>
            <div>
              <p className={`font-display text-2xl font-bold ${z.activeRiders > 0 ? 'text-rose-500' : 'text-ink-faint'}`}>
                {z.activeRiders}
              </p>
              <p className="text-[11px] uppercase tracking-wide text-ink-faint">Riders on shift</p>
            </div>
          </div>

          {z.deliveryPartners?.length > 0 && (
            <p className="mt-3 flex items-center gap-1.5 text-[11.5px] text-ink-muted"><Truck size={12} /> {z.deliveryPartners.join(' · ')}</p>
          )}

          {z.activeRiders === 0 && (
            <p className="mt-3 flex items-center gap-1.5 rounded-lg bg-[#FEF6F5] px-3 py-2 text-[11.5px] font-semibold text-[#B3261E]">
              <Warning size={12} /> Express suppressed — no riders on shift
            </p>
          )}

          <div className="mt-4 flex gap-2 border-t border-line pt-4">
            <button onClick={() => onEdit(z)} className="btn-ghost btn-sm"><Edit size={13} /> Edit</button>
            <button onClick={() => remove(z)} className="btn-ghost btn-sm !text-[#B3261E]"><Trash size={13} /></button>
          </div>
        </div>
      ))}
    </div>
  );
}

function Flag({ active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex h-6 w-16 shrink-0 items-center justify-center rounded-full text-[10px] font-bold transition ${
        active ? 'bg-[#EAF7F0] text-[#1F6B45]' : 'bg-blush text-ink-faint'
      }`}
    >
      {active ? <Check size={13} /> : <Close size={12} />}
    </button>
  );
}

function Field({ label, value, onChange, required, placeholder }) {
  return (
    <div>
      <label className="label">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>
      <input value={value ?? ''} required={required} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} className="input" />
    </div>
  );
}

function Check2({ checked, onChange, label, sub }) {
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
      <span className="min-w-0">
        <span className="block text-[12.5px] font-semibold text-ink">{label}</span>
        {sub && <span className="block text-[11px] text-ink-muted">{sub}</span>}
      </span>
    </button>
  );
}

function MiniStat({ label, value }) {
  return (
    <div className="rounded-xl bg-blush p-4 text-center">
      <p className="font-display text-2xl font-bold text-ink">{value}</p>
      <p className="text-[11px] uppercase tracking-wide text-ink-faint">{label}</p>
    </div>
  );
}
