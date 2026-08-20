import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../../lib/api.js';
import { toast } from '../../../store/toastStore.js';
import { Badge, Skeleton, EmptyState } from '../../../components/common/ui.jsx';
import { Tag, Check } from '../../../components/common/Icons.jsx';
import { inr, formatDate } from '../../../lib/format.js';

export default function Coupons() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState('');

  useEffect(() => {
    api
      .get('/account/coupons')
      .then(({ data }) => setCoupons(data.coupons))
      .catch(() => setCoupons([]))
      .finally(() => setLoading(false));
  }, []);

  function copy(code) {
    navigator.clipboard?.writeText(code);
    setCopied(code);
    toast.success(`${code} copied`);
    setTimeout(() => setCopied(''), 2000);
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-3xl font-semibold text-ink">Coupons &amp; offers</h1>
        <p className="mt-1.5 text-sm text-ink-muted">Apply any of these at checkout.</p>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-36 w-full rounded-xl2" />)}
        </div>
      ) : !coupons.length ? (
        <EmptyState icon="tag" title="No offers right now" message="Check back — we run new offers most weeks." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {coupons.map((c) => (
            <div
              key={c._id}
              className={`relative overflow-hidden rounded-xl2 border p-5 ${
                c.isUsable ? 'border-rose-200 bg-gradient-to-br from-rose-50 to-gold-50' : 'border-line bg-white opacity-60'
              }`}
            >
              {/* Punched ticket notches */}
              <span className="absolute -left-2.5 top-1/2 h-5 w-5 -translate-y-1/2 rounded-full bg-cream" />
              <span className="absolute -right-2.5 top-1/2 h-5 w-5 -translate-y-1/2 rounded-full bg-cream" />

              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-display text-xl font-semibold text-ink">{c.title}</p>
                  <p className="mt-1 text-[13px] text-ink-muted">{c.description}</p>
                </div>
                <span className="shrink-0 rounded-xl bg-white px-3 py-2 text-center">
                  <span className="block font-display text-xl font-bold text-rose-600">
                    {c.type === 'PERCENT' ? `${c.value}%` : inr(c.value)}
                  </span>
                  <span className="block text-[10px] font-bold uppercase tracking-wide text-ink-faint">off</span>
                </span>
              </div>

              <div className="mt-3 space-y-1 text-[11.5px] text-ink-muted">
                {c.minOrderValue > 0 && <p>• Minimum order {inr(c.minOrderValue)}</p>}
                {c.maxDiscount > 0 && <p>• Up to {inr(c.maxDiscount)} off</p>}
                {c.firstOrderOnly && <p>• First order only</p>}
                {c.expiresAt && <p>• Valid until {formatDate(c.expiresAt)}</p>}
              </div>

              <div className="mt-4 flex items-center gap-2">
                <button
                  onClick={() => copy(c.code)}
                  disabled={!c.isUsable}
                  className="flex-1 rounded-xl border-2 border-dashed border-rose-300 bg-white px-4 py-2.5 font-display text-base font-bold tracking-wider text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed"
                >
                  {copied === c.code ? <><Check size={14} className="mr-1 inline" /> Copied</> : c.code}
                </button>
                {c.isUsable ? (
                  <Link to="/gifts" className="btn-primary btn-sm shrink-0">Shop</Link>
                ) : (
                  <Badge tone="neutral" className="shrink-0">Used</Badge>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
