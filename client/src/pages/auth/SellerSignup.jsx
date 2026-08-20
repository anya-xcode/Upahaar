import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthShell, { BrandAside } from './AuthShell.jsx';
import api from '../../lib/api.js';
import { useAuth } from '../../store/authStore.js';
import { toast } from '../../store/toastStore.js';
import { Spinner, Badge } from '../../components/common/ui.jsx';
import { Check, ChevronLeft, ChevronRight, Store, MapPin, Close } from '../../components/common/Icons.jsx';

/**
 * Three-step seller onboarding. Splitting it keeps the form from looking like a
 * tax return — and the delivery-capability step is the one that actually
 * decides who will see this seller's products.
 */
const STEPS = ['Your business', 'Delivery capability', 'Account & compliance'];

export default function SellerSignup() {
  const navigate = useNavigate();
  const registerSeller = useAuth((s) => s.registerSeller);

  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [pinQuery, setPinQuery] = useState('');

  const [form, setForm] = useState({
    businessName: '', ownerName: '', mobile: '', description: '',
    address: { line1: '', street: '', city: '', state: '', pincode: '' },
    servedPincodes: [], deliveryRadiusKm: 10,
    email: '', password: '', gstNumber: '', panNumber: '',
    bankDetails: { accountHolder: '', accountNumber: '', ifsc: '', bankName: '' },
  });

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const setAddr = (k, v) => setForm((f) => ({ ...f, address: { ...f.address, [k]: v } }));
  const setBank = (k, v) => setForm((f) => ({ ...f, bankDetails: { ...f.bankDetails, [k]: v } }));

  useEffect(() => {
    if (step !== 1) return undefined;
    const t = setTimeout(() => {
      api
        .get('/location/suggest', { params: { q: pinQuery || form.address.city } })
        .then(({ data }) => setSuggestions(data.pincodes))
        .catch(() => setSuggestions([]));
    }, 200);
    return () => clearTimeout(t);
  }, [pinQuery, step, form.address.city]);

  function togglePincode(code) {
    setForm((f) => ({
      ...f,
      servedPincodes: f.servedPincodes.includes(code)
        ? f.servedPincodes.filter((c) => c !== code)
        : [...f.servedPincodes, code],
    }));
  }

  function next(e) {
    e.preventDefault();
    if (step < STEPS.length - 1) return setStep(step + 1);
    return submit();
  }

  async function submit() {
    setBusy(true);
    try {
      await registerSeller({ ...form, name: form.ownerName });
      toast.success('Store created. Our team will review it shortly.');
      navigate('/seller', { replace: true });
    } catch (err) {
      toast.error(err.message);
      setBusy(false);
    }
  }

  return (
    <AuthShell
      wide
      title="Sell on Upahaar"
      subtitle="Set up your store in a few minutes. You can list products while your KYC is reviewed."
      aside={
        <BrandAside
          quote={`"Reach customers a few\nkilometres away who need\nsomething beautiful, today."`}
          points={[
            { icon: 'money', title: 'Commission from 10%', body: 'No listing fees, ever.' },
            { icon: 'bolt', title: 'Approval in ~2 days', body: 'Most stores go live within two working days.' },
            { icon: 'chart', title: 'A real dashboard', body: 'Orders, revenue, stock alerts and ratings.' },
          ]}
        />
      }
    >
      {/* Stepper */}
      <div className="mb-7 flex items-center gap-2">
        {STEPS.map((label, i) => (
          <div key={label} className="flex flex-1 items-center gap-2">
            <span
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold transition ${
                i < step ? 'bg-rose-500 text-white' : i === step ? 'bg-rose-500 text-white shadow-glow' : 'bg-blush text-ink-faint'
              }`}
            >
              {i < step ? <Check size={13} /> : i + 1}
            </span>
            <span className={`hidden text-[11.5px] font-semibold sm:block ${i === step ? 'text-ink' : 'text-ink-faint'}`}>
              {label}
            </span>
            {i < STEPS.length - 1 && <span className={`h-0.5 flex-1 ${i < step ? 'bg-rose-300' : 'bg-line'}`} />}
          </div>
        ))}
      </div>

      <form onSubmit={next} className="space-y-4">
        {step === 0 && (
          <>
            <Field label="Business name" required value={form.businessName} onChange={(v) => set('businessName', v)} placeholder="Blooms & Bakes" />
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Owner name" required value={form.ownerName} onChange={(v) => set('ownerName', v)} />
              <Field label="Mobile" required value={form.mobile} onChange={(v) => set('mobile', v)} placeholder="+91 98200 00000" />
            </div>
            <div>
              <label className="label">Tell customers about your store</label>
              <textarea
                rows={3}
                value={form.description}
                onChange={(e) => set('description', e.target.value)}
                placeholder="A tiny patisserie-florist. Everything is baked and tied the morning it is delivered."
                className="input resize-none"
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Shop address" required value={form.address.line1} onChange={(v) => setAddr('line1', v)} />
              <Field label="Street" value={form.address.street} onChange={(v) => setAddr('street', v)} />
              <Field label="City" required value={form.address.city} onChange={(v) => setAddr('city', v)} />
              <Field label="State" required value={form.address.state} onChange={(v) => setAddr('state', v)} />
            </div>
            <Field
              label="Shop PIN code"
              required
              value={form.address.pincode}
              onChange={(v) => setAddr('pincode', v.replace(/\D/g, '').slice(0, 6))}
              placeholder="400001"
            />
          </>
        )}

        {step === 1 && (
          <>
            <div className="rounded-2xl bg-blush p-4">
              <p className="flex items-center gap-2 text-[13px] font-bold text-ink">
                <MapPin size={15} className="text-rose-500" /> This decides who sees your products
              </p>
              <p className="mt-1 text-[12.5px] leading-relaxed text-ink-muted">
                Upahaar only shows a gift to a customer if you cover their PIN code and can reach them in time.
                Pick every area you genuinely deliver to.
              </p>
            </div>

            <div>
              <label className="label">Delivery radius: {form.deliveryRadiusKm} km</label>
              <input
                type="range"
                min={2}
                max={40}
                value={form.deliveryRadiusKm}
                onChange={(e) => set('deliveryRadiusKm', Number(e.target.value))}
                className="w-full accent-rose-500"
              />
              <div className="flex justify-between text-[11px] text-ink-faint">
                <span>2 km</span>
                <span>40 km</span>
              </div>
            </div>

            <div>
              <label className="label">PIN codes you serve ({form.servedPincodes.length} selected)</label>

              {form.servedPincodes.length > 0 && (
                <div className="mb-2.5 flex flex-wrap gap-1.5">
                  {form.servedPincodes.map((code) => (
                    <button
                      type="button"
                      key={code}
                      onClick={() => togglePincode(code)}
                      className="chip border border-rose-200 bg-rose-50 text-rose-700"
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

              <div className="mt-2 max-h-52 space-y-1 overflow-y-auto rounded-xl border border-line p-1.5">
                {suggestions.length ? (
                  suggestions.map((s) => {
                    const active = form.servedPincodes.includes(s.code);
                    return (
                      <button
                        type="button"
                        key={s.code}
                        onClick={() => togglePincode(s.code)}
                        className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-[13px] transition ${
                          active ? 'bg-rose-50 font-semibold text-rose-700' : 'hover:bg-blush'
                        }`}
                      >
                        <span>
                          <span className="font-semibold">{s.code}</span>
                          <span className="ml-2 text-ink-muted">{s.area}, {s.city}</span>
                        </span>
                        {active ? <Check size={14} className="text-rose-500" /> : <span className="text-ink-faint">+</span>}
                      </button>
                    );
                  })
                ) : (
                  <p className="px-3 py-4 text-center text-[13px] text-ink-faint">
                    Type a PIN code or city to see the areas we serve.
                  </p>
                )}
              </div>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <Field label="Login email" required type="email" value={form.email} onChange={(v) => set('email', v)} placeholder="store@example.com" />
            <Field label="Password" required type="password" value={form.password} onChange={(v) => set('password', v)} placeholder="At least 6 characters" />

            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="GST number" value={form.gstNumber} onChange={(v) => set('gstNumber', v.toUpperCase())} placeholder="27ABCDE1234F1Z5" />
              <Field label="PAN number" value={form.panNumber} onChange={(v) => set('panNumber', v.toUpperCase())} placeholder="ABCDE1234F" />
            </div>

            <div className="rounded-2xl border border-line p-4">
              <p className="mb-3 text-[13px] font-bold text-ink">Bank details for payouts</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Account holder" value={form.bankDetails.accountHolder} onChange={(v) => setBank('accountHolder', v)} />
                <Field label="Bank name" value={form.bankDetails.bankName} onChange={(v) => setBank('bankName', v)} />
                <Field label="Account number" value={form.bankDetails.accountNumber} onChange={(v) => setBank('accountNumber', v)} />
                <Field label="IFSC" value={form.bankDetails.ifsc} onChange={(v) => setBank('ifsc', v.toUpperCase())} />
              </div>
            </div>

            <div className="flex items-start gap-2.5 rounded-xl bg-blush p-4 text-[12px] leading-relaxed text-ink-muted">
              <Store size={15} className="mt-0.5 shrink-0 text-rose-500" />
              You can upload KYC documents from your dashboard after signing up. Stores are usually approved
              within two working days — you can add products in the meantime.
            </div>
          </>
        )}

        <div className="flex gap-2 pt-2">
          {step > 0 && (
            <button type="button" onClick={() => setStep(step - 1)} className="btn-ghost">
              <ChevronLeft size={15} /> Back
            </button>
          )}
          <button disabled={busy} className="btn-primary flex-1 !py-3">
            {busy ? <Spinner size={16} /> : null}
            {step === STEPS.length - 1 ? 'Create my store' : 'Continue'}
            {step < STEPS.length - 1 && <ChevronRight size={15} />}
          </button>
        </div>
      </form>

      <p className="mt-5 text-center text-[13px] text-ink-muted">
        Already selling with us?{' '}
        <Link to="/seller/login" className="font-semibold text-rose-600 hover:underline">Sign in</Link>
      </p>
    </AuthShell>
  );
}

function Field({ label, value, onChange, required, placeholder, type = 'text' }) {
  return (
    <div>
      <label className="label">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>
      <input
        type={type}
        required={required}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="input"
      />
    </div>
  );
}
