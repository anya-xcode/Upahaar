import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import api from '../../lib/api.js';
import { useLocation as useLocationStore } from '../../store/locationStore.js';
import { useAuth } from '../../store/authStore.js';
import { useShop } from '../../store/shopStore.js';
import { toast } from '../../store/toastStore.js';
import ProductCard from '../../components/customer/ProductCard.jsx';
import { Img, Rating, DeliveryBadge, Badge, EmptyState, Spinner, Skeleton, SectionHeader } from '../../components/common/ui.jsx';
import {
  MapPin, Heart, Cart, Star, Plus, Minus, Check, Store, Clock, Truck, Shield, Upload, Calendar, Warning, ChevronRight, Engrave,
} from '../../components/common/Icons.jsx';
import { inr, formatDate } from '../../lib/format.js';

/** Delivery windows offered for scheduled (non-express) orders. */
const TIME_WINDOWS = [
  '9:00 AM – 12:00 PM',
  '12:00 PM – 3:00 PM',
  '3:00 PM – 6:00 PM',
  '6:00 PM – 9:00 PM',
];

export default function ProductDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { pincode, openPicker } = useLocationStore();
  const user = useAuth((s) => s.user);
  const { addToCart, isWishlisted, toggleWishlist } = useShop();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [variant, setVariant] = useState('');
  const [message, setMessage] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [deliveryWindow, setDeliveryWindow] = useState('');
  const [instructions, setInstructions] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setLoading(true);
    setActiveImage(0);
    setQuantity(1);
    api
      .get(`/products/${slug}`, { params: { pincode: pincode || undefined } })
      .then(({ data: d }) => {
        setData(d);
        setVariant(d.product.variants?.[0]?.name || '');
      })
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [slug, pincode]);

  if (loading) return <ProductSkeleton />;

  if (!data?.product) {
    return (
      <div className="container-app py-20">
        <EmptyState
          icon="search"
          title="We couldn't find that gift"
          message="It may have been removed by the seller, or the link is out of date."
          action={<Link to="/gifts" className="btn-primary">Browse all gifts</Link>}
        />
      </div>
    );
  }

  const { product, reviews, related } = data;
  const availability = product.availability || {};
  const selectedVariant = product.variants?.find((v) => v.name === variant);
  const unitPrice = product.price + (selectedVariant?.priceDelta || 0);
  const personalised = Boolean(message || photoUrl);
  const personalisationFee = personalised ? product.personalizationFee || 0 : 0;
  const total = unitPrice * quantity + personalisationFee * quantity;
  const wishlisted = isWishlisted(product._id);
  const soldOut = product.stock <= 0;
  const canBuy = !soldOut && availability.deliverable !== false && Boolean(pincode);

  async function handleAdd(buyNow = false) {
    if (!user) return navigate('/login', { state: { from: `/gift/${slug}` } });
    if (user.role !== 'CUSTOMER') return toast.info('Sign in with a customer account to shop.');
    if (!pincode) return openPicker();

    setBusy(true);
    try {
      await addToCart({
        productId: product._id,
        quantity,
        variant: variant || undefined,
        personalization: personalised ? { message, photoUrl } : undefined,
        deliveryDate: deliveryDate || undefined,
        deliveryWindow: deliveryWindow || undefined,
        specialInstructions: instructions || undefined,
      });
      if (buyNow) navigate('/checkout');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  }

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="container-app py-8">
      <nav className="mb-5 flex flex-wrap items-center gap-1.5 text-xs text-ink-faint">
        <Link to="/" className="hover:text-rose-600">Home</Link>
        <span>/</span>
        <Link to="/gifts" className="hover:text-rose-600">Gifts</Link>
        <span>/</span>
        <Link to={`/gifts?category=${product.category?._id}`} className="hover:text-rose-600">
          {product.category?.emoji} {product.category?.name}
        </Link>
        <span>/</span>
        <span className="truncate text-ink-muted">{product.name}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-2">
        {/* Gallery */}
        <div className="lg:sticky lg:top-[190px] lg:self-start">
          <div className="relative overflow-hidden rounded-4xl border border-line bg-blush">
            <Img
              src={product.images?.[activeImage]}
              alt={product.name}
              icon={product.category?.slug}
              seed={`${product.slug}-${activeImage}`}
              className="aspect-square w-full object-cover"
            />
            {availability.tier && (
              <div className="absolute left-4 top-4">
                <DeliveryBadge tier={availability.tier} meta={product.tierMeta} size="lg" />
              </div>
            )}
            {product.discountPercent > 0 && (
              <div className="absolute right-4 top-4 rounded-full bg-ink px-3 py-1.5 text-xs font-bold text-white">
                {product.discountPercent}% OFF
              </div>
            )}
          </div>

          {product.images?.length > 1 && (
            <div className="mt-3 flex gap-3">
              {product.images.map((img, i) => (
                <button
                  key={img + i}
                  onClick={() => setActiveImage(i)}
                  className={`overflow-hidden rounded-2xl border-2 transition ${
                    i === activeImage ? 'border-rose-400' : 'border-line hover:border-rose-200'
                  }`}
                >
                  <Img src={img} alt={`${product.name} ${i + 1}`} seed={`${product.slug}-${i}`} className="h-20 w-20 object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div>
          <Link
            to={`/store/${product.seller?.slug}`}
            className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-rose-600 hover:underline"
          >
            <Store size={13} /> {product.seller?.businessName}
          </Link>

          <h1 className="mt-2.5 font-display text-3xl font-semibold leading-tight text-ink sm:text-4xl">
            {product.name}
          </h1>

          <div className="mt-3.5 flex flex-wrap items-center gap-3">
            <Rating value={product.rating} count={product.reviewCount} size="lg" />
            {product.isBestSeller && <Badge tone="amber">Best seller</Badge>}
            {product.personalizable && <Badge tone="rose">Personalisable</Badge>}
            {product.isLowStock && <Badge tone="red">Only {product.stock} left</Badge>}
          </div>

          <div className="mt-5 flex flex-wrap items-baseline gap-3">
            <span className="font-display text-4xl font-bold text-ink">{inr(unitPrice)}</span>
            {product.mrp > product.price && (
              <>
                <span className="text-xl text-ink-faint line-through">{inr(product.mrp)}</span>
                <span className="rounded-full bg-[#EAF7F0] px-2.5 py-1 text-xs font-bold text-[#1F6B45]">
                  You save {inr(product.mrp - product.price)}
                </span>
              </>
            )}
          </div>
          <p className="mt-1 text-xs text-ink-faint">Inclusive of all taxes</p>

          {/* Delivery availability — the panel that answers "will it get here in time?" */}
          <DeliveryPanel
            availability={availability}
            product={product}
            pincode={pincode}
            openPicker={openPicker}
          />

          {product.description && (
            <p className="mt-6 text-[15px] leading-relaxed text-ink-soft">{product.description}</p>
          )}

          {product.highlights?.length > 0 && (
            <ul className="mt-4 space-y-2">
              {product.highlights.map((h) => (
                <li key={h} className="flex items-start gap-2.5 text-sm text-ink-soft">
                  <Check size={15} className="mt-0.5 shrink-0 text-rose-500" />
                  {h}
                </li>
              ))}
            </ul>
          )}

          {/* Options */}
          <div className="mt-7 space-y-5 rounded-2xl border border-line bg-white p-5">
            {product.variants?.length > 0 && (
              <div>
                <label className="label">Choose an option</label>
                <div className="flex flex-wrap gap-2">
                  {product.variants.map((v) => (
                    <button
                      key={v.name}
                      onClick={() => setVariant(v.name)}
                      disabled={v.stock <= 0}
                      className={`rounded-xl border px-4 py-2 text-sm font-semibold transition disabled:opacity-40 ${
                        variant === v.name
                          ? 'border-rose-400 bg-rose-50 text-rose-700'
                          : 'border-line text-ink-soft hover:border-rose-200'
                      }`}
                    >
                      {v.name}
                      {v.priceDelta > 0 && <span className="ml-1.5 text-xs text-ink-faint">+{inr(v.priceDelta)}</span>}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className="label">Quantity</label>
              <div className="inline-flex items-center rounded-xl border border-line">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="px-3.5 py-2.5 text-ink-muted transition hover:text-rose-600 disabled:opacity-30"
                  disabled={quantity <= 1}
                >
                  <Minus size={15} />
                </button>
                <span className="w-10 text-center text-sm font-bold text-ink">{quantity}</span>
                <button
                  onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                  className="px-3.5 py-2.5 text-ink-muted transition hover:text-rose-600 disabled:opacity-30"
                  disabled={quantity >= product.stock}
                >
                  <Plus size={15} />
                </button>
              </div>
              {product.stock > 0 && <span className="ml-3 text-xs text-ink-faint">{product.stock} in stock</span>}
            </div>

            {/* Personalisation */}
            {product.personalizable && (
              <div className="rounded-xl bg-blush p-4">
                <p className="mb-1 flex items-center gap-1.5 text-[13px] font-bold text-ink">
                  <Engrave size={14} className="text-rose-500" /> Make it personal
                  {product.personalizationFee > 0 && (
                    <span className="font-medium text-ink-muted">(+{inr(product.personalizationFee)} per item)</span>
                  )}
                </p>
                {product.personalizationNote && (
                  <p className="mb-3 text-xs text-ink-muted">{product.personalizationNote}</p>
                )}

                <label className="label">Your message</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value.slice(0, 140))}
                  rows={2}
                  placeholder="Happy 60th, Amma. Thank you for everything."
                  className="input resize-none"
                />
                <p className="mt-1 text-right text-[11px] text-ink-faint">{message.length}/140</p>

                {product.allowsPhotoUpload && (
                  <div className="mt-3">
                    <label className="label">Photo to print</label>
                    <div className="relative">
                      <Upload size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint" />
                      <input
                        value={photoUrl}
                        onChange={(e) => setPhotoUrl(e.target.value)}
                        placeholder="Paste an image link"
                        className="input pl-10"
                      />
                    </div>
                    {photoUrl && (
                      <Img src={photoUrl} alt="Your upload" seed="upload" className="mt-2 h-24 w-24 rounded-xl object-cover" />
                    )}
                    <p className="mt-1.5 text-[11px] text-ink-faint">
                      Direct file upload arrives with the Cloudinary integration — a link works today.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Delivery slot */}
            <div>
              <label className="label">
                <Calendar size={12} className="mr-1 inline" /> Delivery date &amp; time
              </label>
              <div className="grid gap-2 sm:grid-cols-2">
                <input
                  type="date"
                  min={today}
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                  className="input"
                />
                <select value={deliveryWindow} onChange={(e) => setDeliveryWindow(e.target.value)} className="input">
                  <option value="">
                    {availability.tier === 'EXPRESS_60' ? 'As soon as possible' : 'Any time'}
                  </option>
                  {TIME_WINDOWS.map((w) => (
                    <option key={w} value={w}>{w}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="label">Special instructions (optional)</label>
              <input
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="Ring the bell twice, it's a surprise"
                className="input"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <button onClick={() => handleAdd(false)} disabled={!canBuy || busy} className="btn-ghost flex-1 !py-3.5">
              {busy ? <Spinner size={16} /> : <Cart size={17} />} Add to Cart
            </button>
            <button onClick={() => handleAdd(true)} disabled={!canBuy || busy} className="btn-primary flex-1 !py-3.5">
              Buy Now · {inr(total)}
            </button>
            <button
              onClick={() => (user ? toggleWishlist(product._id) : navigate('/login'))}
              className={`btn h-[50px] w-[50px] shrink-0 border ${
                wishlisted ? 'border-rose-300 bg-rose-50 text-rose-600' : 'border-line bg-white text-ink-muted hover:text-rose-500'
              }`}
              aria-label="Wishlist"
            >
              <Heart size={19} filled={wishlisted} />
            </button>
          </div>

          {!pincode && (
            <p className="mt-3 flex items-center gap-2 rounded-xl bg-gold-50 px-4 py-2.5 text-sm text-gold-600">
              <Warning size={15} />
              <button onClick={openPicker} className="font-semibold underline">Enter your PIN code</button>
              to check if we can deliver this.
            </p>
          )}

          {/* Trust row */}
          <div className="mt-6 grid grid-cols-3 gap-3 border-t border-line pt-6">
            {[
              { Icon: Truck, label: 'Live tracking', sub: 'Door to door' },
              { Icon: Shield, label: 'Secure payment', sub: 'UPI · Cards · COD' },
              { Icon: Store, label: 'Local seller', sub: product.seller?.address?.city },
            ].map(({ Icon, label, sub }) => (
              <div key={label} className="text-center">
                <Icon size={19} className="mx-auto mb-1.5 text-rose-500" />
                <p className="text-[12px] font-bold text-ink">{label}</p>
                <p className="text-[11px] text-ink-faint">{sub}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Reviews */}
      <section className="mt-16">
        <SectionHeader title={`Reviews (${product.reviewCount || 0})`} eyebrow="From verified orders" />
        {reviews?.length ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {reviews.map((r) => (
              <div key={r._id} className="card p-5">
                <div className="mb-2.5 flex items-center justify-between">
                  <div className="flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} size={14} filled={i < r.productRating} className={i < r.productRating ? 'text-gold-400' : 'text-line'} />
                    ))}
                  </div>
                  <span className="text-[11px] text-ink-faint">{formatDate(r.createdAt)}</span>
                </div>
                {r.title && <p className="font-display text-[15px] font-semibold text-ink">{r.title}</p>}
                <p className="mt-1.5 text-[13px] leading-relaxed text-ink-muted">{r.comment}</p>
                <p className="mt-3 flex items-center gap-2 border-t border-line pt-3 text-[11px] text-ink-faint">
                  <span className="font-semibold text-ink-soft">{r.userName}</span>
                  {r.isVerifiedPurchase && <Badge tone="green" className="!text-[10px]"><Check size={10} /> Verified</Badge>}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState icon="star" title="No reviews yet" message="Be the first to tell everyone how it went." />
        )}
      </section>

      {/* Related */}
      {related?.length > 0 && (
        <section className="mt-16">
          <SectionHeader
            title="You might also like"
            action={
              <Link to={`/gifts?category=${product.category?._id}`} className="btn-ghost btn-sm">
                More in {product.category?.name} <ChevronRight size={14} />
              </Link>
            }
          />
          <div className="grid grid-cols-2 gap-x-6 gap-y-12 lg:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function DeliveryPanel({ availability, product, pincode, openPicker }) {
  if (!pincode) {
    return (
      <div className="mt-6 rounded-2xl border border-dashed border-line bg-blush p-4">
        <p className="flex items-center gap-2 text-sm font-semibold text-ink">
          <MapPin size={16} className="text-rose-500" /> Check delivery availability
        </p>
        <button onClick={openPicker} className="btn-primary btn-sm mt-3">Enter your PIN code</button>
      </div>
    );
  }

  if (availability.deliverable === false) {
    return (
      <div className="mt-6 rounded-2xl border border-[#F8D7D5] bg-[#FEF6F5] p-4">
        <p className="flex items-center gap-2 text-sm font-bold text-[#B3261E]">
          <Warning size={16} /> Not deliverable to {pincode}
        </p>
        <p className="mt-1.5 pl-6 text-[13px] text-[#B3261E]/80">{availability.reason}</p>
        <button onClick={openPicker} className="btn-ghost btn-sm mt-3">Try another PIN code</button>
      </div>
    );
  }

  return (
    <div className="mt-6 rounded-2xl border border-rose-100 bg-gradient-to-br from-rose-50 to-blush p-4">
      <p className="flex items-center gap-2 text-sm font-bold text-ink">
        <MapPin size={16} className="text-rose-500" /> Delivering to {pincode}
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <DeliveryBadge tier={availability.tier} meta={product.tierMeta} size="lg" />
        <span className="flex items-center gap-1.5 text-[13px] font-semibold text-ink-soft">
          <Clock size={14} className="text-rose-500" /> {availability.etaText}
        </span>
      </div>

      <div className="mt-3 space-y-1 pl-0.5 text-[12px] text-ink-muted">
        <p className="flex items-center gap-1.5">
          <Check size={12} className="text-rose-500" />
          Prepared in {product.prepTimeMinutes} min by {product.seller?.businessName}
        </p>
        {availability.distanceKm != null && (
          <p className="flex items-center gap-1.5">
            <Check size={12} className="text-rose-500" />
            {availability.isLocal ? `${availability.distanceKm} km from you` : 'Shipped from another city'}
          </p>
        )}
        <p className="flex items-center gap-1.5">
          <Check size={12} className="text-rose-500" />
          {availability.deliveryFee > 0 ? `Delivery fee ${inr(availability.deliveryFee)}` : 'Free delivery'}
        </p>
      </div>

      <button onClick={openPicker} className="mt-3 text-xs font-semibold text-rose-600 hover:underline">
        Change PIN code
      </button>
    </div>
  );
}

function ProductSkeleton() {
  return (
    <div className="container-app grid gap-10 py-8 lg:grid-cols-2">
      <Skeleton className="aspect-square w-full rounded-4xl" />
      <div className="space-y-4">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-28 w-full rounded-2xl" />
        <Skeleton className="h-52 w-full rounded-2xl" />
      </div>
    </div>
  );
}
