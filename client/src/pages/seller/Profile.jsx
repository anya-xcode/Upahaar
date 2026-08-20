import { useEffect, useState } from 'react';
import api from '../../lib/api.js';
import { toast } from '../../store/toastStore.js';
import { PageHeader, PanelCard } from '../../components/common/panel.jsx';
import { Badge, Skeleton, Spinner } from '../../components/common/ui.jsx';
import { Check, MapPin, Clock, Close, Store, Shield, Upload, Warning, Bolt } from '../../components/common/Icons.jsx';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const KYC_TONES = { VERIFIED: 'green', PENDING: 'amber', REJECTED: 'red', NOT_SUBMITTED: 'neutral' };
const STATUS_TONES = { ACTIVE: 'green', PENDING: 'amber', SUSPENDED: 'red', REJECTED: 'red' };

export default function SellerProfile() {
  const [seller, setSeller] = useState(null);
  const [coverage, setCoverage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pinQuery, setPinQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);

  async function load() {
    try {
      const [p, c] = await Promise.all([api.get('/seller/profile'), api.get('/seller/coverage')]);
      setSeller(p.data.seller);
      setCoverage(c.data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      api
        .get('/location/suggest', { params: { q: pinQuery || seller?.address?.city } })
        .then(({ data }) => setSuggestions(data.pincodes))
        .catch(() => setSuggestions([]));
    }, 220);
    return () => clearTimeout(t);
  }, [pinQuery, seller?.address?.city]);

  const set = (k, v) => setSeller((s) => ({ ...s, [k]: v }));
  const setAddr = (k, v) => setSeller((s) => ({ ...s, address: { ...s.address, [k]: v } }));
  const setHours = (k, v) => setSeller((s) => ({ ...s, workingHours: { ...s.workingHours, [k]: v } }));
  const setBank = (k, v) => setSeller((s) => ({ ...s, bankDetails: { ...s.bankDetails, [k]: v } }));

  function togglePincode(code) {
    setSeller((s) => ({
      ...s,
      servedPincodes: s.servedPincodes.includes(code)
        ? s.servedPincodes.filter((c) => c !== code)
        : [...s.servedPincodes, code],
    }));
  }

  function toggleDay(day) {
    setSeller((s) => ({
      ...s,
      workingDays: s.workingDays.includes(day) ? s.workingDays.filter((d) => d !== day) : [...s.workingDays, day].sort(),
    }));
  }

  async function save(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.patch('/seller/profile', {
        businessName: seller.businessName,
        ownerName: seller.ownerName,
        mobile: seller.mobile,
        tagline: seller.tagline,
        description: seller.description,
        address: seller.address,
        servedPincodes: seller.servedPincodes,
        deliveryRadiusKm: Number(seller.deliveryRadiusKm),
        workingHours: seller.workingHours,
        workingDays: seller.workingDays,
        dispatchBufferMinutes: Number(seller.dispatchBufferMinutes),
        acceptsExpress: seller.acceptsExpress,
        gstNumber: seller.gstNumber,
        panNumber: seller.panNumber,
        bankDetails: seller.bankDetails,
      });
      toast.success('Store settings saved');
      await load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function submitKyc() {
    try {
      await api.post('/seller/kyc', {
        gstNumber: seller.gstNumber,
        panNumber: seller.panNumber,
        bankDetails: seller.bankDetails,
      });
      toast.success('KYC submitted for review');
      await load();
    } catch (err) {
      toast.error(err.message);
    }
  }

  if (loading || !seller) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full rounded-xl2" />
      </div>
    );
  }

  return (
    <form onSubmit={save}>
      <PageHeader
        title="Store & delivery"
        subtitle="Your shopfront, and the settings that decide who can see your gifts."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={STATUS_TONES[seller.status]}>Store: {seller.status}</Badge>
            <Badge tone={KYC_TONES[seller.kycStatus]}>KYC: {seller.kycStatus.replace('_', ' ')}</Badge>
            <button disabled={saving} className="btn-primary btn-sm">
              {saving ? <Spinner size={13} /> : <Check size={14} />} Save changes
            </button>
          </div>
        }
      />

      <div className="grid gap-5 lg:grid-cols-[1fr_380px]">
        <div className="space-y-5">
          <PanelCard title="Store details">
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Business name" value={seller.businessName} onChange={(v) => set('businessName', v)} />
                <Field label="Owner name" value={seller.ownerName} onChange={(v) => set('ownerName', v)} />
                <Field label="Mobile" value={seller.mobile} onChange={(v) => set('mobile', v)} />
                <Field label="Email" value={seller.email} disabled />
              </div>

              <Field label="Tagline" value={seller.tagline} onChange={(v) => set('tagline', v)} placeholder="Fort · Fresh cakes and flowers since 2016" />

              <div>
                <label className="label">About your store</label>
                <textarea
                  rows={3}
                  value={seller.description || ''}
                  onChange={(e) => set('description', e.target.value)}
                  className="input resize-none"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Shop address" value={seller.address?.line1} onChange={(v) => setAddr('line1', v)} />
                <Field label="Street" value={seller.address?.street} onChange={(v) => setAddr('street', v)} />
                <Field label="City" value={seller.address?.city} onChange={(v) => setAddr('city', v)} />
                <Field label="State" value={seller.address?.state} onChange={(v) => setAddr('state', v)} />
                <Field label="Shop PIN code" value={seller.address?.pincode} onChange={(v) => setAddr('pincode', v.replace(/\D/g, '').slice(0, 6))} />
              </div>
            </div>
          </PanelCard>

          <PanelCard title="Compliance & payouts" subtitle="Required before your store can be approved.">
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="GST number" value={seller.gstNumber} onChange={(v) => set('gstNumber', v.toUpperCase())} />
                <Field label="PAN number" value={seller.panNumber} onChange={(v) => set('panNumber', v.toUpperCase())} />
              </div>

              <div className="rounded-xl border border-line p-4">
                <p className="mb-3 flex items-center gap-2 text-[13px] font-bold text-ink">
                  <Shield size={14} className="text-rose-500" /> Bank account for payouts
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Account holder" value={seller.bankDetails?.accountHolder} onChange={(v) => setBank('accountHolder', v)} />
                  <Field label="Bank name" value={seller.bankDetails?.bankName} onChange={(v) => setBank('bankName', v)} />
                  <Field label="Account number" value={seller.bankDetails?.accountNumber} onChange={(v) => setBank('accountNumber', v)} />
                  <Field label="IFSC" value={seller.bankDetails?.ifsc} onChange={(v) => setBank('ifsc', v.toUpperCase())} />
                </div>
              </div>

              <div>
                <p className="label">KYC documents</p>
                {seller.kycDocuments?.length ? (
                  <div className="space-y-1.5">
                    {seller.kycDocuments.map((d, i) => (
                      <div key={i} className="flex items-center gap-2.5 rounded-lg bg-blush px-3 py-2 text-[12.5px]">
                        <Check size={13} className="text-[#1F6B45]" />
                        <span className="font-semibold text-ink">{d.type}</span>
                        <span className="ml-auto text-ink-faint">uploaded</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center gap-2.5 rounded-xl border border-dashed border-line px-3.5 py-3 text-[12px] text-ink-muted">
                    <Upload size={15} className="shrink-0 text-rose-400" />
                    Document upload arrives with the Cloudinary integration. Fill in GST/PAN and submit for review.
                  </div>
                )}

                {seller.kycStatus !== 'VERIFIED' && (
                  <button type="button" onClick={submitKyc} className="btn-ghost btn-sm mt-3">
                    Submit KYC for review
                  </button>
                )}
              </div>
            </div>
          </PanelCard>
        </div>

        {/* Delivery capability — the important half */}
        <div className="space-y-5 lg:sticky lg:top-6 lg:self-start">
          <PanelCard title="Delivery capability" subtitle="This decides which customers see your products.">
            <div className="space-y-5">
              <div className="flex items-start gap-2.5 rounded-xl bg-rose-50 p-3.5 text-[11.5px] leading-relaxed text-ink-soft">
                <MapPin size={15} className="mt-0.5 shrink-0 text-rose-500" />
                A customer only sees your gift if you cover their PIN code, you're open, and the maths says it can
                arrive in time.
              </div>

              <div>
                <label className="label">Delivery radius: {seller.deliveryRadiusKm} km</label>
                <input
                  type="range"
                  min={2}
                  max={40}
                  value={seller.deliveryRadiusKm}
                  onChange={(e) => set('deliveryRadiusKm', Number(e.target.value))}
                  className="w-full accent-rose-500"
                />
                <div className="flex justify-between text-[11px] text-ink-faint"><span>2 km</span><span>40 km</span></div>
              </div>

              <div>
                <label className="label"><Clock size={12} className="mr-1 inline" /> Opening hours</label>
                <div className="grid grid-cols-2 gap-3">
                  <input type="time" value={seller.workingHours?.open || '09:00'} onChange={(e) => setHours('open', e.target.value)} className="input" />
                  <input type="time" value={seller.workingHours?.close || '21:00'} onChange={(e) => setHours('close', e.target.value)} className="input" />
                </div>
              </div>

              <div>
                <label className="label">Open on</label>
                <div className="flex flex-wrap gap-1.5">
                  {DAYS.map((d, i) => {
                    const active = seller.workingDays?.includes(i);
                    return (
                      <button
                        type="button"
                        key={d}
                        onClick={() => toggleDay(i)}
                        className={`h-9 w-9 rounded-full text-[11.5px] font-bold transition ${
                          active ? 'bg-rose-500 text-white' : 'border border-line bg-white text-ink-faint hover:border-rose-200'
                        }`}
                      >
                        {d[0]}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="label">Dispatch buffer: {seller.dispatchBufferMinutes} minutes</label>
                <input
                  type="range"
                  min={0}
                  max={120}
                  step={5}
                  value={seller.dispatchBufferMinutes}
                  onChange={(e) => set('dispatchBufferMinutes', Number(e.target.value))}
                  className="w-full accent-rose-500"
                />
                <p className="text-[11px] text-ink-faint">
                  Packing time added on top of each product's preparation time.
                </p>
              </div>

              <button
                type="button"
                onClick={() => set('acceptsExpress', !seller.acceptsExpress)}
                className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition ${
                  seller.acceptsExpress ? 'border-rose-400 bg-rose-50' : 'border-line'
                }`}
              >
                <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 ${seller.acceptsExpress ? 'border-rose-500 bg-rose-500 text-white' : 'border-line'}`}>
                  {seller.acceptsExpress && <Check size={12} />}
                </span>
                <span>
                  <span className="block text-[13px] font-bold text-ink">Accept 60-minute express orders</span>
                  <span className="block text-[11.5px] text-ink-muted">Turn off during a rush — you'll still get 3-hour orders</span>
                </span>
              </button>
            </div>
          </PanelCard>

          <PanelCard title={`PIN codes you serve (${seller.servedPincodes?.length || 0})`}>
            {seller.servedPincodes?.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-1.5">
                {seller.servedPincodes.map((code) => (
                  <button
                    type="button"
                    key={code}
                    onClick={() => togglePincode(code)}
                    className="chip border border-rose-200 bg-rose-50 text-rose-700 transition hover:bg-rose-100"
                  >
                    {code} <Close size={11} />
                  </button>
                ))}
              </div>
            )}

            <input
              value={pinQuery}
              onChange={(e) => setPinQuery(e.target.value)}
              placeholder="Search a PIN code or area"
              className="input"
            />

            <div className="mt-2 max-h-64 space-y-1 overflow-y-auto rounded-xl border border-line p-1.5">
              {suggestions.length ? (
                suggestions.map((s) => {
                  const active = seller.servedPincodes?.includes(s.code);
                  return (
                    <button
                      type="button"
                      key={s.code}
                      onClick={() => togglePincode(s.code)}
                      className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-[12.5px] transition ${
                        active ? 'bg-rose-50 font-semibold text-rose-700' : 'hover:bg-blush'
                      }`}
                    >
                      <span className="min-w-0">
                        <span className="font-semibold">{s.code}</span>
                        <span className="ml-2 text-ink-muted">{s.area}, {s.city}</span>
                      </span>
                      {s.express60Available && !active && (
                        <Badge tone="rose" className="shrink-0 !text-[9px]"><Bolt size={9} /></Badge>
                      )}
                      {active && <Check size={14} className="shrink-0 text-rose-500" />}
                    </button>
                  );
                })
              ) : (
                <p className="px-3 py-4 text-center text-[12.5px] text-ink-faint">
                  Type a PIN code or city to find areas.
                </p>
              )}
            </div>

            {coverage && seller.servedPincodes?.length === 0 && (
              <p className="mt-3 flex items-center gap-2 rounded-lg bg-[#FEF6F5] px-3 py-2 text-[11.5px] text-[#B3261E]">
                <Warning size={13} /> No PIN codes selected — nobody can see your products.
              </p>
            )}
          </PanelCard>

          <PanelCard title="Store summary">
            <div className="space-y-2 text-[13px]">
              <Row label="Commission rate" value={`${seller.commissionRate}%`} />
              <Row label="Total orders" value={seller.totalOrders} />
              <Row label="Rating" value={`${seller.rating?.toFixed(1) || '—'} (${seller.reviewCount})`} />
              <Row label="Store slug" value={<span className="font-mono text-[11.5px]">/store/{seller.slug}</span>} />
            </div>
          </PanelCard>

          <button disabled={saving} className="btn-primary w-full !py-3">
            {saving ? <Spinner size={15} /> : <Store size={15} />} Save all changes
          </button>
        </div>
      </div>
    </form>
  );
}

function Field({ label, value, onChange, placeholder, disabled }) {
  return (
    <div>
      <label className="label">{label}</label>
      <input
        value={value || ''}
        disabled={disabled}
        placeholder={placeholder}
        onChange={(e) => onChange?.(e.target.value)}
        className={`input ${disabled ? 'cursor-not-allowed bg-blush' : ''}`}
      />
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-ink-muted">{label}</span>
      <span className="font-semibold text-ink">{value}</span>
    </div>
  );
}
