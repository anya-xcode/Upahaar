import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../../lib/api.js';
import { useLocation as useLocationStore } from '../../../store/locationStore.js';
import { useShop } from '../../../store/shopStore.js';
import ProductCard from '../../../components/customer/ProductCard.jsx';
import { ProductCardSkeleton, EmptyState } from '../../../components/common/ui.jsx';

export default function Wishlist() {
  const { pincode } = useLocationStore();
  const wishlistIds = useShop((s) => s.wishlistIds);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api
      .get('/account/wishlist', { params: { pincode: pincode || undefined } })
      .then(({ data }) => setProducts(data.products))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [pincode]);

  // Reflect un-hearting immediately without a round trip.
  const visible = products.filter((p) => wishlistIds.includes(String(p._id)));

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-3xl font-semibold text-ink">Wishlist</h1>
        <p className="mt-1.5 text-sm text-ink-muted">
          {loading ? 'Loading…' : `${visible.length} gift${visible.length === 1 ? '' : 's'} saved for later.`}
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-x-6 gap-y-12 sm:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <ProductCardSkeleton key={i} />)}
        </div>
      ) : !visible.length ? (
        <EmptyState
          icon="heart"
          title="Nothing saved yet"
          message="Tap the heart on any gift to keep it here for later."
          action={<Link to="/gifts" className="btn-primary">Browse gifts</Link>}
        />
      ) : (
        <div className="grid grid-cols-2 gap-x-6 gap-y-12 sm:grid-cols-3">
          {visible.map((p) => (
            <ProductCard key={p._id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
