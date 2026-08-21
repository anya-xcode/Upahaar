import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Img, Spinner } from '../common/ui.jsx';
import { Heart, Cart, Star } from '../common/Icons.jsx';
import { TierIcon } from '../../lib/glyphs.jsx';
import { inr } from '../../lib/format.js';
import { useShop } from '../../store/shopStore.js';
import { useAuth } from '../../store/authStore.js';
import { toast } from '../../store/toastStore.js';

/**
 * The product card, composed editorially.
 *
 * The photograph carries the card — no border, no shadow, no box. Everything
 * else is quiet type underneath it, and the actions only surface on hover so
 * a grid of these reads as a gallery rather than a control panel.
 *
 * The one thing that stays loud is the delivery promise: it is the reason
 * someone chooses Upahaar, so it sits over the image where the eye lands
 * first, and the 60-minute tier is the only element on the card allowed a
 * solid fill.
 */
export default function ProductCard({ product, compact = false }) {
  const navigate = useNavigate();
  const [adding, setAdding] = useState(false);
  const { isWishlisted, toggleWishlist, addToCart } = useShop();
  const user = useAuth((s) => s.user);

  const wishlisted = isWishlisted(product._id);
  const availability = product.availability || {};
  const discount = product.discountPercent || 0;
  const soldOut = product.stock <= 0;
  const isExpress = availability.tier === 'EXPRESS_60';

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
    if (product.personalizable) return navigate(`/gift/${product.slug}`);

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
    <article className="group relative flex flex-col">
      {/* Stretched link keeps the whole card clickable without nesting
          buttons inside an anchor. */}
      <Link
        to={`/gift/${product.slug}`}
        className="absolute inset-0 z-10 rounded-[1.15rem] focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:ring-offset-4 focus-visible:ring-offset-cream"
      >
        <span className="sr-only">View {product.name}</span>
      </Link>

      <div className="frame relative aspect-[4/5]">
        <Img
          src={product.images?.[0]}
          alt={product.name}
          icon={product.category?.slug}
          seed={product.slug || product.name}
          className="h-full w-full object-cover transition-transform duration-[900ms] ease-out group-hover:scale-[1.04]"
        />

        {/* Delivery promise — the headline of the card. */}
        {availability.tier && product.tierMeta && (
          <span
            className={`absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 caps backdrop-blur-sm ${
              isExpress
                ? 'bg-rose-500/95 text-white'
                : 'bg-white/85 text-ink-soft ring-1 ring-inset ring-ink/5'
            }`}
          >
            <TierIcon tier={availability.tier} size={11} />
            {product.tierMeta.badge}
          </span>
        )}

        {discount > 0 && (
          <span className="absolute right-3 top-3 caps rounded-full bg-white/85 px-2.5 py-1 text-ink-soft backdrop-blur-sm ring-1 ring-inset ring-ink/5">
            {discount}% off
          </span>
        )}

        {/* Actions surface on hover; always visible on touch. */}
        <div className="absolute inset-x-3 bottom-3 z-20 flex items-center gap-2 opacity-100 transition-all duration-300 lg:translate-y-2 lg:opacity-0 lg:group-hover:translate-y-0 lg:group-hover:opacity-100">
          {!soldOut && (
            <button
              type="button"
              onClick={onAdd}
              disabled={adding}
              className="flex-1 rounded-full bg-white/95 px-4 py-2.5 text-[12.5px] font-semibold text-ink shadow-soft backdrop-blur transition hover:bg-ink hover:text-white"
            >
              {adding ? (
                <Spinner size={13} className="mx-auto" />
              ) : product.personalizable ? (
                'Personalise'
              ) : (
                <span className="inline-flex items-center gap-1.5"><Cart size={14} /> Add to cart</span>
              )}
            </button>
          )}
          <button
            type="button"
            onClick={onWishlist}
            aria-label={wishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full backdrop-blur transition ${
              wishlisted ? 'bg-rose-500 text-white' : 'bg-white/95 text-ink-soft hover:text-rose-600'
            }`}
          >
            <Heart size={16} filled={wishlisted} />
          </button>
        </div>

        {soldOut && (
          <div className="absolute inset-0 flex items-center justify-center bg-cream/70 backdrop-blur-[1px]">
            <span className="caps rounded-full bg-ink px-3.5 py-1.5 text-white">Sold out</span>
          </div>
        )}
      </div>

      {/* Metadata: quiet, typographic, generously spaced. */}
      <div className="pt-4">
        {!compact && product.seller?.businessName && (
          <p className="mb-1.5 truncate caps text-ink-faint">{product.seller.businessName}</p>
        )}

        <h3 className="font-display text-[17px] font-semibold leading-snug text-ink transition-colors group-hover:text-rose-700">
          {product.name}
        </h3>

        <div className="mt-2 flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
          <span className="tabular text-[16px] font-semibold text-ink">{inr(product.price)}</span>
          {product.mrp > product.price && (
            <span className="tabular text-[13px] text-ink-faint line-through">{inr(product.mrp)}</span>
          )}
          {product.rating > 0 && (
            <span className="ml-auto inline-flex items-center gap-1 text-[12.5px] text-ink-muted">
              <Star size={11} className="text-gold-400" />
              <span className="tabular">{Number(product.rating).toFixed(1)}</span>
            </span>
          )}
        </div>

        {availability.etaText && (
          <p className="mt-2 text-[12.5px] text-ink-muted">{availability.etaText}</p>
        )}
      </div>
    </article>
  );
}
