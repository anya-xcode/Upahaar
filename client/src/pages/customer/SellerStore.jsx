import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../../lib/api.js';
import { useLocation as useLocationStore } from '../../store/locationStore.js';
import ProductCard from '../../components/customer/ProductCard.jsx';
import { Rating, Badge, EmptyState, Skeleton, SectionHeader } from '../../components/common/ui.jsx';
import { MapPin, Clock, Star, Truck, Package, Store } from '../../components/common/Icons.jsx';
import { formatDate } from '../../lib/format.js';

export default function SellerStore() {
  const { slug } = useParams();
  const { pincode, openPicker } = useLocationStore();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api
      .get(`/catalog/sellers/${slug}`, { params: { pincode: pincode || undefined } })
      .then(({ data: d }) => setData(d))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [slug, pincode]);

  if (loading) {
    return (
      <div className="container-app space-y-6 py-10">
        <Skeleton className="h-52 w-full rounded-4xl" />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-72 w-full rounded-xl2" />)}
        </div>
      </div>
    );
  }

  if (!data?.seller) {
    return (
      <div className="container-app py-20">
        <EmptyState icon="store" title="Store not found" action={<Link to="/sellers" className="btn-primary">All sellers</Link>} />
      </div>
    );
  }

  const { seller, products, reviews } = data;
  const servesYou = pincode ? seller.servedPincodes?.includes(pincode) : null;

  return (
    <div className="container-app py-10">
      {/* Store header */}
      <header className="overflow-hidden rounded-4xl bg-gradient-to-br from-rose-50 via-blush to-gold-50 p-6 sm:p-10">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-5">
            <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-3xl bg-white text-rose-500 shadow-soft">
              <Store size={34} />
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="font-display text-3xl font-semibold text-ink">{seller.businessName}</h1>
                {seller.isFeatured && <Badge tone="amber">Featured seller</Badge>}
              </div>
              <p className="mt-1.5 text-[15px] text-ink-soft">{seller.tagline}</p>
              {seller.description && (
                <p className="mt-2.5 max-w-2xl text-[13.5px] leading-relaxed text-ink-muted">{seller.description}</p>
              )}

              <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-[12.5px] text-ink-muted">
                <Rating value={seller.rating} count={seller.reviewCount} size="lg" />
                <span className="flex items-center gap-1.5">
                  <MapPin size={13} className="text-rose-400" />
                  {seller.address?.city} · {seller.deliveryRadiusKm} km radius
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock size={13} className="text-rose-400" />
                  {seller.workingHours?.open} – {seller.workingHours?.close}
                </span>
                <span className="flex items-center gap-1.5">
                  <Package size={13} className="text-rose-400" />
                  {seller.totalOrders || 0} orders delivered
                </span>
              </div>
            </div>
          </div>

          {/* Does this store reach the customer? */}
          <div className="shrink-0 rounded-2xl bg-white/80 p-4 backdrop-blur lg:w-64">
            {!pincode ? (
              <>
                <p className="text-[13px] font-semibold text-ink">Do they deliver to you?</p>
                <button onClick={openPicker} className="btn-primary btn-sm mt-2.5 w-full">
                  Check your PIN code
                </button>
              </>
            ) : servesYou ? (
              <>
                <p className="flex items-center gap-2 text-[13px] font-bold text-[#1F6B45]">
                  <Truck size={15} /> Delivers to {pincode}
                </p>
                <p className="mt-1 text-[12px] text-ink-muted">
                  Serving {seller.servedPincodes.length} PIN codes around {seller.address?.city}.
                </p>
              </>
            ) : (
              <>
                <p className="text-[13px] font-bold text-ink">Not in your area</p>
                <p className="mt-1 text-[12px] text-ink-muted">
                  Shippable items can still reach {pincode} in 2–3 days.
                </p>
                <button onClick={openPicker} className="mt-2.5 text-[12px] font-semibold text-rose-600 hover:underline">
                  Change PIN code
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Products */}
      <section className="mt-12">
        <SectionHeader
          title={`Gifts from ${seller.businessName}`}
          subtitle={pincode ? `Showing what can reach ${pincode}.` : 'Set your PIN code to see delivery times.'}
        />
        {products?.length ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {products.map((p) => (
              <ProductCard key={p._id} product={p} compact />
            ))}
          </div>
        ) : (
          <EmptyState
            icon="box"
            title="Nothing available for your area"
            message={
              pincode
                ? `This store can't currently deliver to ${pincode}.`
                : 'Enter a PIN code to see what this store can deliver.'
            }
            action={<button onClick={openPicker} className="btn-primary">Change PIN code</button>}
          />
        )}
      </section>

      {/* Reviews */}
      {reviews?.length > 0 && (
        <section className="mt-14">
          <SectionHeader title="What customers say" eyebrow={`${seller.reviewCount} reviews`} />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {reviews.map((r) => (
              <div key={r._id} className="card p-5">
                <div className="mb-2.5 flex items-center justify-between">
                  <div className="flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} size={14} filled={i < r.sellerRating} className={i < r.sellerRating ? 'text-gold-400' : 'text-line'} />
                    ))}
                  </div>
                  <span className="text-[11px] text-ink-faint">{formatDate(r.createdAt)}</span>
                </div>
                {r.title && <p className="font-display text-[15px] font-semibold text-ink">{r.title}</p>}
                <p className="mt-1.5 text-[13px] leading-relaxed text-ink-muted">{r.comment}</p>
                <p className="mt-3 border-t border-line pt-3 text-[12px] font-semibold text-ink-soft">{r.userName}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
