import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useShop } from '../../store/shopStore.js';
import { useAuth } from '../../store/authStore.js';
import { useLocation as useLocationStore } from '../../store/locationStore.js';
import { toast } from '../../store/toastStore.js';
import { Img, EmptyState, Badge, DeliveryBadge, Spinner, Skeleton } from '../../components/common/ui.jsx';
import { Trash, Plus, Minus, MapPin, Tag, Close, Warning, ChevronRight, Gift } from '../../components/common/Icons.jsx';
import { inr } from '../../lib/format.js';

export default function Cart() {
  const navigate = useNavigate();
  const user = useAuth((s) => s.user);
  const { cart, loading, hydrated, loadCart, updateItem, removeItem, applyCoupon, removeCoupon } = useShop();
  const { pincode, openPicker } = useLocationStore();
  const [couponCode, setCouponCode] = useState('');
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    if (user?.role === 'CUSTOMER') loadCart();
  }, [user, pincode, loadCart]);

  if (!user) {
    return (
      <div className="container-app py-20">
        <EmptyState
          icon="cart"
          title="Sign in to see your cart"
          message="Your cart follows you across devices once you're signed in."
          action={
            <div className="flex gap-2">
              <Link to="/login" state={{ from: '/cart' }} className="btn-primary">Sign in</Link>
              <Link to="/signup" className="btn-ghost">Create account</Link>
            </div>
          }
        />
      </div>
    );
  }

  if (!hydrated || (loading && !cart)) {
    return (
      <div className="container-app grid gap-8 py-10 lg:grid-cols-[1fr_380px]">
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-36 w-full rounded-xl2" />)}
        </div>
        <Skeleton className="h-96 w-full rounded-xl2" />
      </div>
    );
  }

  if (!cart?.items?.length) {
    return (
      <div className="container-app py-20">
        <EmptyState
          icon="gift"
          title="Your cart is waiting for something lovely"
          message="Find a gift that arrives exactly when you need it."
          action={<Link to="/gifts" className="btn-primary">Browse gifts</Link>}
        />
      </div>
    );
  }

  const { totals, coupon, blocked } = cart;

  async function handleCoupon(e) {
    e.preventDefault();
    setApplying(true);
    try {
      await applyCoupon(couponCode);
      setCouponCode('');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setApplying(false);
    }
  }

  return (
    <div className="container-app py-10">
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold text-ink">Your cart</h1>
          <p className="mt-1.5 text-sm text-ink-muted">
            {cart.itemCount} item{cart.itemCount === 1 ? '' : 's'}
            {cart.location && ` · delivering to ${cart.location.code}, ${cart.location.city}`}
          </p>
        </div>
        <button onClick={openPicker} className="btn-ghost btn-sm">
          <MapPin size={14} /> {pincode || 'Set PIN code'}
        </button>
      </div>

      {blocked?.length > 0 && (
        <div className="mb-6 rounded-2xl border border-[#F8D7D5] bg-[#FEF6F5] p-4">
          <p className="flex items-center gap-2 text-sm font-bold text-[#B3261E]">
            <Warning size={16} /> {blocked.length} item{blocked.length === 1 ? '' : 's'} can't be delivered to {pincode}
          </p>
          <p className="mt-1 pl-6 text-[13px] text-[#B3261E]/80">
            Remove them, or change your delivery PIN code, to continue to checkout.
          </p>
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        <div className="space-y-4">
          {cart.items.map((item) => (
            <CartLine
              key={item._id}
              item={item}
              onQuantity={(q) => updateItem(item._id, { quantity: q })}
              onRemove={() => removeItem(item._id)}
            />
          ))}

          <Link to="/gifts" className="btn-ghost btn-sm">
            <Plus size={14} /> Add another gift
          </Link>
        </div>

        {/* Summary */}
        <aside className="lg:sticky lg:top-[190px] lg:self-start">
          <div className="card overflow-hidden">
            <div className="border-b border-line px-5 py-4">
              <h2 className="font-display text-lg font-semibold text-ink">Order summary</h2>
            </div>

            <div className="space-y-3 px-5 py-4">
              <Row label={`Subtotal (${cart.itemCount} items)`} value={inr(totals.subtotal)} />
              {totals.personalizationTotal > 0 && (
                <Row label="Personalisation" value={inr(totals.personalizationTotal)} />
              )}
              {totals.deliveryFee > 0 ? (
                <Row label="Delivery" value={inr(totals.deliveryFee)} />
              ) : (
                <Row label="Delivery" value={<span className="font-semibold text-[#1F6B45]">Free</span>} />
              )}
              {totals.discount > 0 && (
                <Row
                  label={`Coupon ${coupon?.code || ''}`}
                  value={<span className="font-semibold text-[#1F6B45]">− {inr(totals.discount)}</span>}
                />
              )}

              <div className="flex items-center justify-between border-t border-line pt-3">
                <span className="font-display text-lg font-semibold text-ink">Total</span>
                <span className="font-display text-2xl font-bold text-ink">{inr(totals.total)}</span>
              </div>

              {totals.savings > 0 && (
                <p className="rounded-xl bg-[#F2FBF6] px-3 py-2 text-center text-[13px] font-semibold text-[#1F6B45]">
                  You're saving {inr(totals.savings)} on this order
                </p>
              )}
            </div>

            {/* Coupon */}
            <div className="border-t border-line px-5 py-4">
              {coupon?.code && !coupon.error ? (
                <div className="flex items-center justify-between rounded-xl bg-[#F2FBF6] px-3.5 py-2.5">
                  <span className="flex items-center gap-2 text-[13px] font-bold text-[#1F6B45]">
                    <Tag size={14} /> {coupon.code} applied
                  </span>
                  <button onClick={removeCoupon} className="text-[#1F6B45] opacity-60 hover:opacity-100" aria-label="Remove coupon">
                    <Close size={14} />
                  </button>
                </div>
              ) : (
                <form onSubmit={handleCoupon} className="flex gap-2">
                  <input
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    placeholder="Coupon code"
                    className="input !py-2.5 text-[13px] uppercase"
                  />
                  <button disabled={applying || !couponCode} className="btn-ghost btn-sm shrink-0">
                    {applying ? <Spinner size={13} /> : 'Apply'}
                  </button>
                </form>
              )}
              {coupon?.error && <p className="mt-2 text-xs font-medium text-[#B3261E]">{coupon.error}</p>}
              <Link to="/account/coupons" className="mt-2.5 block text-xs font-semibold text-rose-600 hover:underline">
                View available offers
              </Link>
            </div>

            <div className="border-t border-line px-5 py-4">
              <button
                onClick={() => navigate('/checkout')}
                disabled={!cart.canCheckout}
                className="btn-primary w-full !py-3.5"
              >
                Proceed to checkout <ChevronRight size={16} />
              </button>
              {!cart.canCheckout && (
                <p className="mt-2.5 text-center text-xs text-ink-muted">
                  {!cart.serviceable
                    ? 'Set a serviceable PIN code to continue'
                    : 'Resolve the flagged items to continue'}
                </p>
              )}
            </div>
          </div>

          <div className="mt-4 flex items-start gap-2.5 rounded-2xl bg-blush p-4 text-[12px] leading-relaxed text-ink-muted">
            <Gift size={16} className="mt-0.5 shrink-0 text-rose-500" />
            Gift wrapping, a greeting card and the option to hide the price are all available at checkout.
          </div>
        </aside>
      </div>
    </div>
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

function CartLine({ item, onQuantity, onRemove }) {
  const [busy, setBusy] = useState(false);
  const p = item.product;
  const problem = item.issue || (item.outOfStock ? 'Not enough stock left' : null);

  async function change(delta) {
    setBusy(true);
    try {
      await onQuantity(item.quantity + delta);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={`card flex gap-4 p-4 ${problem ? 'border-[#F8D7D5] bg-[#FEFAFA]' : ''}`}>
      <Link to={`/gift/${p.slug}`} className="shrink-0">
        <Img
          src={p.images?.[0]}
          alt={p.name}
          icon={p.category?.slug}
          seed={p.slug}
          className="h-24 w-24 rounded-xl object-cover sm:h-28 sm:w-28"
        />
      </Link>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint">
              {p.seller?.businessName}
            </p>
            <Link to={`/gift/${p.slug}`} className="line-clamp-2 text-[15px] font-semibold text-ink hover:text-rose-600">
              {p.name}
            </Link>
            {item.variant && <p className="mt-0.5 text-xs text-ink-muted">Option: {item.variant}</p>}
          </div>
          <button onClick={onRemove} className="shrink-0 rounded-lg p-1.5 text-ink-faint transition hover:bg-blush hover:text-[#B3261E]" aria-label="Remove">
            <Trash size={16} />
          </button>
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-2">
          {p.tier && <DeliveryBadge tier={p.tier} meta={p.tierMeta} />}
          {item.personalization?.message && <Badge tone="rose">Personalised</Badge>}
        </div>

        {item.personalization?.message && (
          <p className="mt-2 line-clamp-1 rounded-lg bg-blush px-2.5 py-1.5 text-[12px] italic text-ink-muted">
            "{item.personalization.message}"
          </p>
        )}

        {problem && (
          <p className="mt-2 flex items-center gap-1.5 text-[12px] font-semibold text-[#B3261E]">
            <Warning size={13} /> {problem}
          </p>
        )}

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex items-center rounded-xl border border-line">
            <button onClick={() => change(-1)} disabled={item.quantity <= 1 || busy} className="px-3 py-1.5 text-ink-muted transition hover:text-rose-600 disabled:opacity-30">
              <Minus size={14} />
            </button>
            <span className="w-8 text-center text-sm font-bold text-ink">{busy ? '…' : item.quantity}</span>
            <button onClick={() => change(1)} disabled={busy} className="px-3 py-1.5 text-ink-muted transition hover:text-rose-600 disabled:opacity-30">
              <Plus size={14} />
            </button>
          </div>

          <div className="text-right">
            <p className="text-[17px] font-bold text-ink">{inr(item.lineTotal + item.personalizationFee)}</p>
            {p.mrp > p.price && (
              <p className="text-xs text-ink-faint line-through">{inr(p.mrp * item.quantity)}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
