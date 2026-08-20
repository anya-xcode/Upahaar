import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Img, Rating, DeliveryBadge, Spinner } from '../common/ui.jsx';
import { Heart, Cart, MapPin, Store } from '../common/Icons.jsx';
import { inr } from '../../lib/format.js';
import { useShop } from '../../store/shopStore.js';
import { useAuth } from '../../store/authStore.js';
import { useLocation as useLocationStore } from '../../store/locationStore.js';
import { toast } from '../../store/toastStore.js';

/**
 * The product card.
 *
 * Delivery time is deliberately the loudest element after the photo — it is
 * the reason a customer chooses Upahaar over a generic gifting site, so the
 * badge sits over the image rather than buried in the metadata.
 */
export default function ProductCard({ product, compact = false }) {
  const navigate = useNavigate();
  const [adding, setAdding] = useState(false);
  const { isWishlisted, toggleWishlist, addToCart } = useShop();
  const user = useAuth((s) => s.user);
  const pincode = useLocationStore((s) => s.pincode);

  const wishlisted = isWishlisted(product._id);
  const availability = product.availability || {};
  const discount = product.discountPercent || 0;
  const soldOut = product.stock <= 0;

  function requireCustomer(action) {
    if (!user) {
      navigate('/login', { state: { from: `/gift/${product.slug}` } });
      return false;
    }
    if (user.role !== 'CUSTOMER') {
      toast.info(`${action} is a customer feature — sign in with a customer account.`);
      return false;
    }
    return true;
  }

  async function onAdd() {
    if (!requireCustomer('Adding to cart')) return;

    // Personalised items need the detail page, not a one-tap add.
    if (product.personalizable) {
      navigate(`/gift/${product.slug}`);
      return;
    }

    setAdding(true);
    try {
      await addToCart({ productId: product._id, quantity: 1 });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setAdding(false);
    }
  }

  function onWishlist() {
    if (!requireCustomer('The wishlist')) return;
    toggleWishlist(product._id);
  }

  return (
    /**
     * The whole card is a link target, but the wishlist and cart buttons are
     * real buttons — so the link is a stretched overlay rather than a wrapper.
     * Nesting a <button> inside an <a> would be invalid markup and breaks
     * keyboard navigation.
     */
    <article className="group relative flex flex-col overflow-hidden rounded-xl2 border border-line bg-white shadow-soft transition-all duration-300 hover:-translate-y-1 hover:border-rose-200 hover:shadow-lift focus-within:border-rose-300">
      <Link
        to={`/gift/${product.slug}`}
        className="absolute inset-0 z-10 rounded-xl2 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
      >
        <span className="sr-only">View {product.name}</span>
      </Link>

      <div className="relative aspect-[4/5] overflow-hidden bg-blush">
        <Img
          src={product.images?.[0]}
          alt={product.name}
          icon={product.category?.slug}
          seed={product.slug || product.name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {/* Delivery promise — the headline of the card. */}
        {availability.tier && (
          <div className="absolute left-3 top-3">
            <DeliveryBadge tier={availability.tier} meta={product.tierMeta} />
          </div>
        )}

        {discount > 0 && (
          <div className="absolute right-3 top-3 rounded-full bg-ink px-2.5 py-1 text-[11px] font-bold text-white">
            {discount}% OFF
          </div>
        )}

        <button
          type="button"
          onClick={onWishlist}
          aria-label={wishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
          className={`absolute bottom-3 right-3 z-20 flex h-9 w-9 items-center justify-center rounded-full backdrop-blur transition-all ${
            wishlisted
              ? 'bg-rose-500 text-white shadow-glow'
              : 'bg-white/90 text-ink-muted hover:bg-white hover:text-rose-500'
          }`}
        >
          <Heart size={17} filled={wishlisted} />
        </button>

        {soldOut && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/70 backdrop-blur-[2px]">
            <span className="rounded-full bg-ink px-4 py-1.5 text-xs font-bold uppercase tracking-wide text-white">
              Sold out
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        {!compact && product.seller?.businessName && (
          <p className="mb-1.5 flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-ink-faint">
            <Store size={11} />
            <span className="truncate">{product.seller.businessName}</span>
          </p>
        )}

        <h3 className="line-clamp-2 text-[15px] font-semibold leading-snug text-ink transition group-hover:text-rose-600">
          {product.name}
        </h3>

        <div className="mt-2 flex items-center gap-2">
          <Rating value={product.rating} count={product.reviewCount} />
        </div>

        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-lg font-bold text-ink">{inr(product.price)}</span>
          {product.mrp > product.price && (
            <span className="text-sm text-ink-faint line-through">{inr(product.mrp)}</span>
          )}
        </div>

        {/* The reassurance line: this specific gift reaches this specific PIN code. */}
        <div className="mt-2.5 space-y-1 text-[11.5px]">
          {availability.etaText && (
            <p className="font-semibold text-rose-600">{availability.etaText}</p>
          )}
          {pincode && availability.deliverable && (
            <p className="flex items-center gap-1 text-ink-muted">
              <MapPin size={11} />
              Available in your area · {pincode}
            </p>
          )}
        </div>

        <div className="mt-4 flex-1" />

        <button
          type="button"
          onClick={onAdd}
          disabled={soldOut || adding}
          className="btn-ghost relative z-20 w-full !py-2 text-[13px] group-hover:border-rose-300 group-hover:bg-rose-500 group-hover:text-white"
        >
          {adding ? <Spinner size={14} /> : <Cart size={15} />}
          {product.personalizable ? 'Personalise' : soldOut ? 'Sold out' : 'Add to Cart'}
        </button>
      </div>
    </article>
  );
}
