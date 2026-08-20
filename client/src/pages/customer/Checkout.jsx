import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../lib/api.js';
import { useShop } from '../../store/shopStore.js';
import { useAuth } from '../../store/authStore.js';
import { toast } from '../../store/toastStore.js';
import { Img, EmptyState, Badge, Spinner, Skeleton } from '../../components/common/ui.jsx';
import { MapPin, Check, Plus, Gift, Shield, Warning, ChevronRight, CreditCard } from '../../components/common/Icons.jsx';
import { PAYMENT_ICONS, TierIcon } from '../../lib/glyphs.jsx';
import { inr } from '../../lib/format.js';

const PAYMENT_METHODS = [
  { key: 'UPI', label: 'UPI', sub: 'GPay, PhonePe, Paytm' },
  { key: 'CARD', label: 'Credit / Debit Card', sub: 'Visa, Mastercard, RuPay' },
  { key: 'NETBANKING', label: 'Net Banking', sub: 'All major banks' },
  { key: 'WALLET', label: 'Wallets', sub: 'Paytm, Amazon Pay' },
  { key: 'COD', label: 'Cash on Delivery', sub: 'Pay when it arrives' },
];

const TIME_WINDOWS = ['9:00 AM – 12:00 PM', '12:00 PM – 3:00 PM', '3:00 PM – 6:00 PM', '6:00 PM – 9:00 PM'];

const EMPTY_ADDRESS = {
  label: 'Home', name: '', mobile: '', pincode: '', house: '', street: '', landmark: '', city: '', state: '',
};

export default function Checkout() {
  const navigate = useNavigate();
  const user = useAuth((s) => s.user);
  const { loadCart } = useShop();

  const [addresses, setAddresses] = useState([]);
  const [addressId, setAddressId] = useState(null);
  const [newAddress, setNewAddress] = useState(EMPTY_ADDRESS);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);

  const [tier, setTier] = useState(null);
  const [giftOptions, setGiftOptions] = useState({
    giftWrap: false, greetingCard: false, giftMessage: '', hidePrice: false,
  });
  const [slotDate, setSlotDate] = useState('');
  const [slotWindow, setSlotWindow] = useState('');
  const [instructions, setInstructions] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('UPI');

  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);

  const selectedAddress = useMemo(
    () => addresses.find((a) => a._id === addressId),
    [addresses, addressId]
  );

  useEffect(() => {
    api
      .get('/account/addresses')
      .then(({ data }) => {
        setAddresses(data.addresses);
        const preferred = data.addresses.find((a) => a.isDefault) || data.addresses[0];
        if (preferred) setAddressId(preferred._id);
        else setShowAddressForm(true);
      })
      .catch(() => setShowAddressForm(true));
  }, []);

  /**
   * The cart is re-priced against the *selected address* — switching from a
   * Mumbai address to a Delhi one can legitimately change which delivery tiers
   * are available and what everything costs.
   */
  useEffect(() => {
    const pincode = selectedAddress?.pincode;
    if (!pincode) return;

    setLoading(true);
    api
      .get('/cart', {
        params: {
          pincode,
          tier: tier || undefined,
          giftWrap: giftOptions.giftWrap,
          greetingCard: giftOptions.greetingCard,
        },
      })
      .then(({ data }) => {
        setSummary(data.cart);
        // Default to the fastest option this address supports.
        if (!tier && data.cart.deliveryOptions?.length) setTier(data.cart.deliveryOptions[0].tier);
      })
      .catch((err) => toast.error(err.message))
      .finally(() => setLoading(false));
  }, [selectedAddress?.pincode, tier, giftOptions.giftWrap, giftOptions.greetingCard]);

  async function saveAddress(e) {
    e.preventDefault();
    setSavingAddress(true);
    try {
      const { data } = await api.post('/account/addresses', newAddress);
      setAddresses((prev) => [data.address, ...prev]);
      setAddressId(data.address._id);
      setNewAddress(EMPTY_ADDRESS);
      setShowAddressForm(false);
      setTier(null); // let the new pincode pick its own fastest tier
      toast.success('Address saved');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSavingAddress(false);
    }
  }

  async function placeOrder() {
    if (!addressId) return toast.error('Please choose a delivery address');
    if (!tier) return toast.error('Please choose a delivery option');

    setPlacing(true);
    try {
      const { data } = await api.post('/orders', {
        addressId,
        deliveryTier: tier,
        deliverySlot: { date: slotDate || undefined, window: slotWindow || undefined },
        giftOptions,
        specialInstructions: instructions || undefined,
        paymentMethod,
      });
      await loadCart();
      navigate(`/order/${data.order.orderId}/confirmation`, { replace: true });
    } catch (err) {
      toast.error(err.message);
      setPlacing(false);
    }
  }

  if (loading && !summary) {
    return (
      <div className="container-app grid gap-8 py-10 lg:grid-cols-[1fr_380px]">
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-40 w-full rounded-xl2" />)}
        </div>
        <Skeleton className="h-96 w-full rounded-xl2" />
      </div>
    );
  }

  if (summary && !summary.items.length) {
    return (
      <div className="container-app py-20">
        <EmptyState
          icon="cart"
          title="Your cart is empty"
          message="Add a gift before heading to checkout."
          action={<Link to="/gifts" className="btn-primary">Browse gifts</Link>}
        />
      </div>
    );
  }

  const totals = summary?.totals;
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="container-app py-10">
      <h1 className="mb-1 font-display text-3xl font-semibold text-ink">Checkout</h1>
      <p className="mb-8 text-sm text-ink-muted">A few details and their gift is on its way.</p>

      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          {/* 1. Address */}
          <Section step="1" title="Delivery address">
            {addresses.length > 0 && (
              <div className="space-y-2.5">
                {addresses.map((a) => (
                  <button
                    key={a._id}
                    onClick={() => {
                      setAddressId(a._id);
                      setTier(null);
                    }}
                    className={`flex w-full items-start gap-3 rounded-xl border p-4 text-left transition ${
                      addressId === a._id ? 'border-rose-400 bg-rose-50' : 'border-line hover:border-rose-200'
                    }`}
                  >
                    <span
                      className={`mt-0.5 flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full border-2 ${
                        addressId === a._id ? 'border-rose-500 bg-rose-500 text-white' : 'border-line'
                      }`}
                    >
                      {addressId === a._id && <Check size={11} />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-bold text-ink">{a.name}</span>
                        <Badge tone="neutral" className="!text-[10px]">{a.label}</Badge>
                        {a.isDefault && <Badge tone="rose" className="!text-[10px]">Default</Badge>}
                      </span>
                      <span className="mt-1 block text-[13px] leading-relaxed text-ink-muted">
                        {a.house}, {a.street}
                        {a.landmark && `, near ${a.landmark}`}
                        <br />
                        {a.city}, {a.state} — {a.pincode}
                      </span>
                      <span className="mt-1 block text-xs text-ink-faint">{a.mobile}</span>
                    </span>
                  </button>
                ))}
              </div>
            )}

            {!showAddressForm ? (
              <button onClick={() => setShowAddressForm(true)} className="btn-ghost btn-sm mt-3">
                <Plus size={14} /> Add a new address
              </button>
            ) : (
              <form onSubmit={saveAddress} className="mt-4 space-y-3 rounded-xl bg-blush p-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Full name" required value={newAddress.name} onChange={(v) => setNewAddress({ ...newAddress, name: v })} />
                  <Field label="Mobile number" required value={newAddress.mobile} onChange={(v) => setNewAddress({ ...newAddress, mobile: v })} placeholder="+91 98200 00000" />
                  <Field label="PIN code" required value={newAddress.pincode} onChange={(v) => setNewAddress({ ...newAddress, pincode: v.replace(/\D/g, '').slice(0, 6) })} />
                  <Field label="House / Flat" required value={newAddress.house} onChange={(v) => setNewAddress({ ...newAddress, house: v })} />
                  <Field label="Street" value={newAddress.street} onChange={(v) => setNewAddress({ ...newAddress, street: v })} />
                  <Field label="Landmark" value={newAddress.landmark} onChange={(v) => setNewAddress({ ...newAddress, landmark: v })} />
                  <Field label="City" required value={newAddress.city} onChange={(v) => setNewAddress({ ...newAddress, city: v })} />
                  <Field label="State" required value={newAddress.state} onChange={(v) => setNewAddress({ ...newAddress, state: v })} />
                </div>

                <div>
                  <label className="label">Save as</label>
                  <div className="flex gap-2">
                    {['Home', 'Work', 'Other'].map((l) => (
                      <button
                        type="button"
                        key={l}
                        onClick={() => setNewAddress({ ...newAddress, label: l })}
                        className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition ${
                          newAddress.label === l ? 'border-rose-400 bg-white text-rose-600' : 'border-line text-ink-muted'
                        }`}
                      >
                        {l}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Maps picker is stubbed until a Google Maps key is configured. */}
                <div className="flex items-center gap-2.5 rounded-xl border border-dashed border-line bg-white px-3.5 py-3 text-[12px] text-ink-muted">
                  <MapPin size={15} className="shrink-0 text-rose-400" />
                  Pin the exact spot on Google Maps — enabled once a Maps API key is added.
                </div>

                <div className="flex gap-2">
                  <button disabled={savingAddress} className="btn-primary btn-sm">
                    {savingAddress ? <Spinner size={13} /> : <Check size={14} />} Save address
                  </button>
                  {addresses.length > 0 && (
                    <button type="button" onClick={() => setShowAddressForm(false)} className="btn-ghost btn-sm">
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            )}
          </Section>

          {/* 2. Delivery option */}
          <Section step="2" title="Delivery option">
            {!summary?.deliveryOptions?.length ? (
              <p className="flex items-center gap-2 rounded-xl bg-[#FEF6F5] px-4 py-3 text-sm text-[#B3261E]">
                <Warning size={15} /> No delivery options available for this address.
              </p>
            ) : (
              <div className="space-y-2.5">
                {summary.deliveryOptions.map((o) => (
                  <button
                    key={o.tier}
                    onClick={() => setTier(o.tier)}
                    className={`flex w-full items-center gap-3 rounded-xl border p-4 text-left transition ${
                      tier === o.tier ? 'border-rose-400 bg-rose-50' : 'border-line hover:border-rose-200'
                    }`}
                  >
                    <span
                      className={`flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full border-2 ${
                        tier === o.tier ? 'border-rose-500 bg-rose-500 text-white' : 'border-line'
                      }`}
                    >
                      {tier === o.tier && <Check size={11} />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-1.5 text-sm font-bold text-ink">
                        <TierIcon tier={o.tier} size={14} className="text-rose-500" />
                        {o.shippingName} — {o.label.replace('Deliver ', '')}
                      </span>
                      <span className="block text-xs text-ink-muted">{o.eta}</span>
                    </span>
                    <span className="shrink-0 text-sm font-bold text-ink">
                      {o.fee > 0 ? inr(o.fee) : <span className="text-[#1F6B45]">Free</span>}
                    </span>
                  </button>
                ))}
              </div>
            )}

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div>
                <label className="label">Preferred date</label>
                <input type="date" min={today} value={slotDate} onChange={(e) => setSlotDate(e.target.value)} className="input" />
              </div>
              <div>
                <label className="label">Preferred time</label>
                <select value={slotWindow} onChange={(e) => setSlotWindow(e.target.value)} className="input">
                  <option value="">As soon as possible</option>
                  {TIME_WINDOWS.map((w) => <option key={w} value={w}>{w}</option>)}
                </select>
              </div>
            </div>

            <div className="mt-3">
              <label className="label">Special instructions</label>
              <input
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="Leave with the security guard if nobody answers"
                className="input"
              />
            </div>
          </Section>

          {/* 3. Gift options */}
          <Section step="3" title="Gift options" icon={Gift}>
            <div className="space-y-2.5">
              <Toggle
                checked={giftOptions.giftWrap}
                onChange={(v) => setGiftOptions({ ...giftOptions, giftWrap: v })}
                title="Gift wrapping"
                sub="Premium paper, ribbon and a wax seal"
                price={summary?.giftOptionFees?.giftWrap}
              />
              <Toggle
                checked={giftOptions.greetingCard}
                onChange={(v) => setGiftOptions({ ...giftOptions, greetingCard: v })}
                title="Greeting card"
                sub="Handwritten by the seller"
                price={summary?.giftOptionFees?.greetingCard}
              />
              <Toggle
                checked={giftOptions.hidePrice}
                onChange={(v) => setGiftOptions({ ...giftOptions, hidePrice: v })}
                title="Hide price from recipient"
                sub="We leave the invoice out of the parcel"
              />
            </div>

            <div className="mt-4">
              <label className="label">Message on the card</label>
              <textarea
                rows={3}
                value={giftOptions.giftMessage}
                onChange={(e) => setGiftOptions({ ...giftOptions, giftMessage: e.target.value.slice(0, 200) })}
                placeholder="Happy anniversary, you two. Here's to many more."
                className="input resize-none"
              />
              <p className="mt-1 text-right text-[11px] text-ink-faint">{giftOptions.giftMessage.length}/200</p>
            </div>
          </Section>

          {/* 4. Payment */}
          <Section step="4" title="Payment" icon={Shield}>
            <div className="space-y-2.5">
              {PAYMENT_METHODS.map((m) => {
                const codBlocked = m.key === 'COD' && tier === 'EXPRESS_60';
                return (
                  <button
                    key={m.key}
                    disabled={codBlocked}
                    onClick={() => setPaymentMethod(m.key)}
                    className={`flex w-full items-center gap-3 rounded-xl border p-4 text-left transition disabled:opacity-40 ${
                      paymentMethod === m.key ? 'border-rose-400 bg-rose-50' : 'border-line hover:border-rose-200'
                    }`}
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blush text-ink-soft">
                      {(() => { const I = PAYMENT_ICONS[m.key] || CreditCard; return <I size={18} />; })()}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-bold text-ink">{m.label}</span>
                      <span className="block text-xs text-ink-muted">
                        {codBlocked ? 'Not available on express delivery' : m.sub}
                      </span>
                    </span>
                    <span
                      className={`flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full border-2 ${
                        paymentMethod === m.key ? 'border-rose-500 bg-rose-500 text-white' : 'border-line'
                      }`}
                    >
                      {paymentMethod === m.key && <Check size={11} />}
                    </span>
                  </button>
                );
              })}
            </div>

            <p className="mt-3 flex items-start gap-2 rounded-xl bg-blush px-3.5 py-3 text-[12px] leading-relaxed text-ink-muted">
              <Shield size={15} className="mt-0.5 shrink-0 text-rose-500" />
              Payments run in simulated mode in this environment. Add your Razorpay keys to
              <code className="mx-1 rounded bg-white px-1">server/.env</code> to process real payments.
            </p>
          </Section>
        </div>

        {/* Summary rail */}
        <aside className="lg:sticky lg:top-[190px] lg:self-start">
          <div className="card overflow-hidden">
            <div className="border-b border-line px-5 py-4">
              <h2 className="font-display text-lg font-semibold text-ink">
                {summary?.itemCount} item{summary?.itemCount === 1 ? '' : 's'}
              </h2>
            </div>

            <div className="max-h-56 space-y-3 overflow-y-auto border-b border-line px-5 py-4">
              {summary?.items.map((i) => (
                <div key={i._id} className="flex gap-3">
                  <Img
                    src={i.product.images?.[0]}
                    alt={i.product.name}
                    seed={i.product.slug}
                    className="h-12 w-12 shrink-0 rounded-lg object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-1 text-[13px] font-medium text-ink">{i.product.name}</p>
                    <p className="text-[11px] text-ink-muted">Qty {i.quantity}</p>
                  </div>
                  <p className="shrink-0 text-[13px] font-bold text-ink">{inr(i.lineTotal)}</p>
                </div>
              ))}
            </div>

            <div className="space-y-2.5 px-5 py-4">
              <Row label="Subtotal" value={inr(totals?.subtotal)} />
              {totals?.personalizationTotal > 0 && <Row label="Personalisation" value={inr(totals.personalizationTotal)} />}
              {totals?.giftOptionsTotal > 0 && <Row label="Gift options" value={inr(totals.giftOptionsTotal)} />}
              <Row
                label="Delivery"
                value={totals?.deliveryFee > 0 ? inr(totals.deliveryFee) : <span className="font-semibold text-[#1F6B45]">Free</span>}
              />
              {totals?.discount > 0 && (
                <Row label={`Coupon ${summary.coupon?.code || ''}`} value={<span className="font-semibold text-[#1F6B45]">− {inr(totals.discount)}</span>} />
              )}
              <div className="flex items-center justify-between border-t border-line pt-3">
                <span className="font-display text-lg font-semibold text-ink">Total</span>
                <span className="font-display text-2xl font-bold text-ink">{inr(totals?.total)}</span>
              </div>
            </div>

            <div className="border-t border-line px-5 py-4">
              <button
                onClick={placeOrder}
                disabled={placing || !summary?.canCheckout || !addressId || !tier}
                className="btn-primary w-full !py-3.5"
              >
                {placing ? <Spinner size={16} /> : <Gift size={17} />}
                {placing ? 'Placing your order…' : `Place order · ${inr(totals?.total)}`}
              </button>
              <p className="mt-2.5 text-center text-[11px] text-ink-faint">
                By placing this order you agree to our terms and refund policy.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Section({ step, title, icon: Icon, children }) {
  return (
    <section className="card p-5 sm:p-6">
      <h2 className="mb-4 flex items-center gap-2.5 font-display text-lg font-semibold text-ink">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-rose-500 text-xs font-bold text-white">
          {step}
        </span>
        {title}
        {Icon && <Icon size={17} className="text-rose-400" />}
      </h2>
      {children}
    </section>
  );
}

function Field({ label, value, onChange, required, placeholder }) {
  return (
    <div>
      <label className="label">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>
      <input
        value={value}
        required={required}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="input"
      />
    </div>
  );
}

function Toggle({ checked, onChange, title, sub, price }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`flex w-full items-center gap-3 rounded-xl border p-3.5 text-left transition ${
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
        <span className="block text-[13.5px] font-bold text-ink">{title}</span>
        <span className="block text-[11.5px] text-ink-muted">{sub}</span>
      </span>
      {price != null && (
        <span className="shrink-0 text-[13px] font-bold text-ink">{price > 0 ? `+${inr(price)}` : 'Free'}</span>
      )}
    </button>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-ink-muted">{label}</span>
      <span className="font-medium text-ink">{value}</span>
    </div>
  );
}
