import { useEffect, useState } from 'react';
import api from '../../lib/api.js';
import { useLocation as useLocationStore } from '../../store/locationStore.js';
import { Badge, Skeleton, Spinner } from '../../components/common/ui.jsx';
import { MapPin, Search, Bolt, Check, Warning } from '../../components/common/Icons.jsx';
import { TierIcon } from '../../lib/glyphs.jsx';

export default function DeliveryAreas() {
  const { check, checking } = useLocationStore();
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [result, setResult] = useState(null);

  useEffect(() => {
    api
      .get('/location/cities')
      .then(({ data }) => setCities(data.cities))
      .catch(() => setCities([]))
      .finally(() => setLoading(false));
  }, []);

  async function lookup(e) {
    e.preventDefault();
    if (query.length !== 6) return;
    const { data } = await api.get('/location/check', { params: { pincode: query } }).catch(() => ({ data: null }));
    setResult(data);
  }

  const totalPincodes = cities.reduce((n, c) => n + c.pincodeCount, 0);
  const totalExpress = cities.reduce((n, c) => n + c.expressPincodes, 0);

  return (
    <div className="container-app py-12">
      <div className="mb-10 text-center">
        <h1 className="font-display text-4xl font-semibold text-ink">Where we deliver</h1>
        <p className="mx-auto mt-2.5 max-w-2xl text-[15px] text-ink-muted">
          {totalPincodes} PIN codes across {cities.length} cities, {totalExpress} of them with 60-minute express
          delivery. Check yours below.
        </p>
      </div>

      {/* Checker */}
      <form onSubmit={lookup} className="mx-auto mb-12 max-w-md">
        <div className="flex gap-2 rounded-2xl border border-line bg-white p-2 shadow-soft">
          <div className="relative flex-1">
            <MapPin size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-rose-400" />
            <input
              inputMode="numeric"
              maxLength={6}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value.replace(/\D/g, ''));
                setResult(null);
              }}
              placeholder="Check a PIN code"
              className="w-full border-0 bg-transparent py-2.5 pl-10 text-[15px] focus:outline-none"
            />
          </div>
          <button disabled={query.length !== 6} className="btn-primary btn-sm shrink-0">
            {checking ? <Spinner size={13} /> : <Search size={14} />} Check
          </button>
        </div>

        {result && (
          <div
            className={`mt-3 rounded-2xl border p-4 ${
              result.serviceable ? 'border-[#D3EDDF] bg-[#F2FBF6]' : 'border-[#F8D7D5] bg-[#FEF6F5]'
            }`}
          >
            <p className={`flex items-center gap-2 text-sm font-bold ${result.serviceable ? 'text-[#1F6B45]' : 'text-[#B3261E]'}`}>
              {result.serviceable ? <Check size={16} /> : <Warning size={16} />}
              {result.message}
            </p>
            {result.serviceable && (
              <>
                <p className="mt-1 pl-6 text-[13px] text-ink-muted">
                  {result.area}, {result.city} · {result.sellerCount} sellers
                </p>
                <div className="mt-3 flex flex-wrap gap-2 pl-6">
                  {result.tiers?.map((t) => (
                    <Badge key={t.tier} tone={t.tier === 'EXPRESS_60' ? 'rose' : 'neutral'} className="!text-[10px]">
                      <TierIcon tier={t.tier} size={11} /> {t.badge} · {t.productCount} gifts
                    </Badge>
                  ))}
                </div>
                <button
                  onClick={() => check(result.pincode)}
                  className="mt-3 pl-6 text-[12px] font-semibold text-rose-600 hover:underline"
                >
                  Shop this area →
                </button>
              </>
            )}
          </div>
        )}
      </form>

      {/* City grid */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 9 }).map((_, i) => <Skeleton key={i} className="h-32 w-full rounded-xl2" />)}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cities.map((c) => (
            <div key={c.city} className="rounded-xl2 border border-line bg-white p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-display text-xl font-semibold text-ink">{c.city}</h2>
                  <p className="mt-0.5 text-[12.5px] text-ink-muted">{c.state}</p>
                </div>
                {c.expressPincodes > 0 && (
                  <Badge tone="rose" className="!text-[10px]">
                    <Bolt size={10} /> Express
                  </Badge>
                )}
              </div>

              <div className="mt-5 flex gap-6">
                <div>
                  <p className="font-display text-2xl font-bold text-ink">{c.pincodeCount}</p>
                  <p className="text-[11px] uppercase tracking-wide text-ink-faint">PIN codes</p>
                </div>
                <div>
                  <p className="font-display text-2xl font-bold text-rose-500">{c.expressPincodes}</p>
                  <p className="text-[11px] uppercase tracking-wide text-ink-faint">60-min ready</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="mt-10 text-center text-[13px] text-ink-muted">
        Not seeing your city? We're expanding every month — check back soon.
      </p>
    </div>
  );
}
