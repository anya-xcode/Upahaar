import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../lib/api.js';
import { useLocation as useLocationStore } from '../../store/locationStore.js';
import { Rating, Badge, EmptyState, Skeleton } from '../../components/common/ui.jsx';
import { MapPin, Clock, Store, ChevronRight } from '../../components/common/Icons.jsx';

export default function Sellers() {
  const { pincode, openPicker } = useLocationStore();
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [nearMeOnly, setNearMeOnly] = useState(true);

  useEffect(() => {
    setLoading(true);
    api
      .get('/catalog/sellers', {
        params: { pincode: nearMeOnly && pincode ? pincode : undefined, limit: 40 },
      })
      .then(({ data }) => setSellers(data.sellers))
      .catch(() => setSellers([]))
      .finally(() => setLoading(false));
  }, [pincode, nearMeOnly]);

  return (
    <div className="container-app py-10">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-semibold text-ink">Local sellers</h1>
          <p className="mt-2 max-w-2xl text-[15px] text-ink-muted">
            Bakers, florists and makers running real shops in real neighbourhoods. When you order from Upahaar,
            you're ordering from one of them.
          </p>
        </div>

        {pincode && (
          <div className="flex rounded-full border border-line bg-white p-1">
            <button
              onClick={() => setNearMeOnly(true)}
              className={`rounded-full px-4 py-1.5 text-[13px] font-semibold transition ${
                nearMeOnly ? 'bg-rose-500 text-white' : 'text-ink-muted hover:text-ink'
              }`}
            >
              Near {pincode}
            </button>
            <button
              onClick={() => setNearMeOnly(false)}
              className={`rounded-full px-4 py-1.5 text-[13px] font-semibold transition ${
                !nearMeOnly ? 'bg-rose-500 text-white' : 'text-ink-muted hover:text-ink'
              }`}
            >
              All sellers
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-56 w-full rounded-xl2" />)}
        </div>
      ) : !sellers.length ? (
        <EmptyState
          icon="store"
          title={pincode && nearMeOnly ? `No sellers serving ${pincode} yet` : 'No sellers to show'}
          message="Try browsing all sellers, or change your delivery PIN code."
          action={
            <div className="flex gap-2">
              <button onClick={() => setNearMeOnly(false)} className="btn-primary">Show all sellers</button>
              <button onClick={openPicker} className="btn-ghost">Change PIN code</button>
            </div>
          }
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {sellers.map((s) => (
            <Link
              key={s._id}
              to={`/store/${s.slug}`}
              className="group flex flex-col rounded-xl2 border border-line bg-white p-6 transition hover:-translate-y-1 hover:border-rose-200 hover:shadow-lift"
            >
              <div className="flex items-start justify-between gap-3">
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-100 to-gold-50 text-rose-500">
                  <Store size={24} />
                </span>
                <div className="flex flex-col items-end gap-1.5">
                  <Rating value={s.rating} count={s.reviewCount} />
                  {s.isFeatured && <Badge tone="amber" className="!text-[10px]">Featured</Badge>}
                </div>
              </div>

              <h2 className="mt-4 font-display text-lg font-semibold leading-snug text-ink transition group-hover:text-rose-600">
                {s.businessName}
              </h2>
              <p className="mt-1 text-[13px] text-ink-muted">{s.tagline}</p>
              {s.description && (
                <p className="mt-2.5 line-clamp-2 text-[12.5px] leading-relaxed text-ink-faint">{s.description}</p>
              )}

              <div className="mt-4 flex-1" />

              <div className="space-y-1.5 border-t border-line pt-4 text-[12px] text-ink-muted">
                <p className="flex items-center gap-1.5">
                  <MapPin size={12} className="text-rose-400" />
                  {s.address?.city} · delivers within {s.deliveryRadiusKm} km
                </p>
                <p className="flex items-center gap-1.5">
                  <Clock size={12} className="text-rose-400" />
                  Open {s.workingHours?.open} – {s.workingHours?.close}
                </p>
                <p className="flex items-center gap-1.5">
                  <Store size={12} className="text-rose-400" />
                  {s.totalOrders || 0} orders delivered
                </p>
              </div>

              <span className="mt-4 inline-flex items-center gap-1 text-[13px] font-semibold text-rose-600">
                Visit store <ChevronRight size={14} />
              </span>
            </Link>
          ))}
        </div>
      )}

      <section className="mt-14 rounded-4xl bg-ink px-6 py-10 text-center text-white sm:px-12">
        <h2 className="font-display text-2xl font-semibold sm:text-3xl">Run a gifting business?</h2>
        <p className="mx-auto mt-2.5 max-w-lg text-[15px] text-white/70">
          Join hundreds of local sellers reaching customers who want their gift today — not next week.
        </p>
        <Link to="/sell-with-us" className="btn mt-6 bg-white text-ink hover:bg-rose-50">
          Sell on Upahaar <ChevronRight size={15} />
        </Link>
      </section>
    </div>
  );
}
