import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../../lib/api.js';
import { toast } from '../../store/toastStore.js';
import { PageHeader, PanelCard, StatCard } from '../../components/common/panel.jsx';
import { Badge, Rating, Skeleton, EmptyState, Spinner } from '../../components/common/ui.jsx';
import {
  ChevronLeft, Check, Close, MapPin, Clock, Shield, Rupee, Star, Package, Store,
} from '../../components/common/Icons.jsx';
import { inr, formatDate, formatDateTime } from '../../lib/format.js';

const STATUS_TONES = { ACTIVE: 'green', PENDING: 'amber', SUSPENDED: 'red', REJECTED: 'red' };
const KYC_TONES = { VERIFIED: 'green', PENDING: 'amber', REJECTED: 'red', NOT_SUBMITTED: 'neutral' };
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function AdminSellerDetail() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [commission, setCommission] = useState('');
  const [saving, setSaving] = useState(false);

  async function load() {
    try {
      const { data: d } = await api.get(`/admin/sellers/${id}`);
      setData(d);
      setCommission(String(d.seller.commissionRate));
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [id]);

  async function setStatus(next, promptReason) {
    let reason;
    if (promptReason) {
      reason = window.prompt(`Reason for ${next.toLowerCase()}?`);
      if (reason === null) return;
    }
    try {
      await api.patch(`/admin/sellers/${id}/status`, { status: next, reason });
      toast.success(`Seller ${next.toLowerCase()}`);
      await load();
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function setKyc(kycStatus) {
    const note = kycStatus === 'REJECTED' ? window.prompt('What needs fixing?') : undefined;
    if (kycStatus === 'REJECTED' && note === null) return;
    try {
      await api.patch(`/admin/sellers/${id}/kyc`, { kycStatus, note });
      toast.success(`KYC ${kycStatus.toLowerCase()}`);
      await load();
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function saveCommission() {
    setSaving(true);
    try {
      await api.patch(`/admin/sellers/${id}`, { commissionRate: Number(commission) });
      toast.success('Commission updated');
      await load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function toggleFeatured() {
    try {
      await api.patch(`/admin/sellers/${id}`, { isFeatured: !data.seller.isFeatured });
      await load();
    } catch (err) {
      toast.error(err.message);
    }
  }

  if (loading) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full rounded-xl2" />
      </div>
    );
  }

  if (!data) {
    return <EmptyState icon="store" title="Seller not found" action={<Link to="/admin/sellers" className="btn-primary">All sellers</Link>} />;
  }

  const { seller, productCount, orderStats, reviews, payouts } = data;
  const delivered = orderStats.find((o) => o._id === 'DELIVERED');
  const cancelled = orderStats.find((o) => o._id === 'CANCELLED');
  const totalRevenue = orderStats.reduce((n, o) => (o._id === 'CANCELLED' ? n : n + o.revenue), 0);

  return (
    <div>
      <Link to="/admin/sellers" className="mb-4 inline-flex items-center gap-1 text-[13px] font-semibold text-ink-muted transition hover:text-rose-600">
        <ChevronLeft size={15} /> All sellers
      </Link>

      <PageHeader
        title={
          <span className="flex flex-wrap items-center gap-3">
            {seller.businessName}
            <Badge tone={STATUS_TONES[seller.status]}>{seller.status}</Badge>
            {seller.isFeatured && <Badge tone="amber">Featured</Badge>}
          </span>
        }
        subtitle={`${seller.tagline || ''} · joined ${formatDate(seller.joinedAt)}`}
        action={
          <div className="flex flex-wrap gap-2">
            <Link to={`/store/${seller.slug}`} className="btn-ghost btn-sm"><Store size={13} /> View storefront</Link>
            <button onClick={toggleFeatured} className="btn-ghost btn-sm">
              {seller.isFeatured ? 'Unfeature' : 'Feature'}
            </button>
            {seller.status === 'PENDING' && (
              <>
                <button onClick={() => setStatus('REJECTED', true)} className="btn-ghost btn-sm !text-[#B3261E]"><Close size={13} /> Reject</button>
                <button onClick={() => setStatus('ACTIVE')} className="btn-primary btn-sm"><Check size={14} /> Approve seller</button>
              </>
            )}
            {seller.status === 'ACTIVE' && (
              <button onClick={() => setStatus('SUSPENDED', true)} className="btn-ghost btn-sm !text-[#B3261E]">Suspend</button>
            )}
            {['SUSPENDED', 'REJECTED'].includes(seller.status) && (
              <button onClick={() => setStatus('ACTIVE')} className="btn-primary btn-sm"><Check size={14} /> Reinstate</button>
            )}
          </div>
        }
      />

      <div className="mb-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Rupee} label="Revenue" value={inr(totalRevenue)} sub="excluding cancellations" tone="green" />
        <StatCard icon={Package} label="Delivered" value={delivered?.count || 0} sub={`${cancelled?.count || 0} cancelled`} tone="blue" />
        <StatCard icon={Store} label="Products" value={productCount} sub="in catalogue" tone="ink" />
        <StatCard icon={Star} label="Rating" value={seller.rating?.toFixed(1) || '—'} sub={`${seller.reviewCount} reviews`} tone="gold" />
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
        <div className="space-y-5">
          <PanelCard title="Business details">
            <div className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
              <Row label="Owner" value={seller.ownerName} />
              <Row label="Email" value={seller.email} />
              <Row label="Mobile" value={seller.mobile} />
              <Row label="Store slug" value={<span className="font-mono text-[11.5px]">/store/{seller.slug}</span>} />
              <Row label="GST" value={seller.gstNumber || '—'} />
              <Row label="PAN" value={seller.panNumber || '—'} />
            </div>

            <div className="mt-4 border-t border-line pt-4">
              <p className="label">Registered address</p>
              <p className="text-[13px] leading-relaxed text-ink-soft">
                {seller.address?.line1}, {seller.address?.street}
                <br />
                {seller.address?.city}, {seller.address?.state} — {seller.address?.pincode}
              </p>
            </div>

            {seller.description && (
              <div className="mt-4 border-t border-line pt-4">
                <p className="label">About</p>
                <p className="text-[13px] leading-relaxed text-ink-soft">{seller.description}</p>
              </div>
            )}
          </PanelCard>

          <PanelCard title="KYC & compliance" action={<Badge tone={KYC_TONES[seller.kycStatus]}>{seller.kycStatus.replace('_', ' ')}</Badge>}>
            <div className="space-y-3">
              {seller.kycDocuments?.length ? (
                seller.kycDocuments.map((d, i) => (
                  <div key={i} className="flex items-center gap-3 rounded-xl border border-line p-3">
                    <Shield size={16} className="shrink-0 text-rose-500" />
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-semibold text-ink">{d.type}</p>
                      <p className="text-[11px] text-ink-faint">Uploaded {formatDate(d.uploadedAt)}</p>
                    </div>
                    <a href={d.url} target="_blank" rel="noreferrer" className="btn-ghost btn-sm shrink-0">View</a>
                  </div>
                ))
              ) : (
                <EmptyState icon="note" title="No documents uploaded" />
              )}

              {seller.bankDetails?.accountNumber && (
                <div className="rounded-xl bg-blush p-4">
                  <p className="mb-2 text-[12px] font-bold uppercase tracking-wide text-ink-faint">Payout account</p>
                  <div className="grid gap-x-6 gap-y-1.5 text-[12.5px] sm:grid-cols-2">
                    <Row label="Holder" value={seller.bankDetails.accountHolder} />
                    <Row label="Bank" value={seller.bankDetails.bankName} />
                    <Row label="Account" value={`••••${String(seller.bankDetails.accountNumber).slice(-4)}`} />
                    <Row label="IFSC" value={seller.bankDetails.ifsc} />
                  </div>
                </div>
              )}

              {seller.kycStatus !== 'VERIFIED' && (
                <div className="flex gap-2">
                  <button onClick={() => setKyc('VERIFIED')} className="btn-primary btn-sm"><Check size={14} /> Verify KYC</button>
                  <button onClick={() => setKyc('REJECTED')} className="btn-ghost btn-sm !text-[#B3261E]">Reject KYC</button>
                </div>
              )}
            </div>
          </PanelCard>

          <PanelCard title={`Recent reviews (${reviews.length})`} padded={false}>
            {reviews.length ? (
              <div className="divide-y divide-line">
                {reviews.map((r) => (
                  <div key={r._id} className="px-5 py-3.5">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} size={12} filled={i < r.sellerRating} className={i < r.sellerRating ? 'text-gold-400' : 'text-line'} />
                        ))}
                      </div>
                      <span className="text-[11px] text-ink-faint">{formatDate(r.createdAt)}</span>
                    </div>
                    {r.title && <p className="mt-1.5 text-[13px] font-semibold text-ink">"{r.title}"</p>}
                    <p className="text-[12px] text-ink-muted">{r.comment}</p>
                    <p className="mt-1 text-[11px] text-ink-faint">— {r.userName}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-5"><EmptyState icon="star" title="No reviews yet" /></div>
            )}
          </PanelCard>
        </div>

        <aside className="space-y-5">
          <PanelCard title="Delivery capability">
            <div className="space-y-3">
              <Row label="Radius" value={`${seller.deliveryRadiusKm} km`} />
              <Row label="Hours" value={`${seller.workingHours?.open} – ${seller.workingHours?.close}`} />
              <Row
                label="Open days"
                value={
                  <span className="flex gap-0.5">
                    {DAYS.map((d, i) => (
                      <span
                        key={d}
                        className={`flex h-5 w-5 items-center justify-center rounded text-[9px] font-bold ${
                          seller.workingDays?.includes(i) ? 'bg-rose-100 text-rose-700' : 'bg-blush text-ink-faint'
                        }`}
                      >
                        {d[0]}
                      </span>
                    ))}
                  </span>
                }
              />
              <Row label="Dispatch buffer" value={`${seller.dispatchBufferMinutes} min`} />
              <Row label="Express" value={<Badge tone={seller.acceptsExpress ? 'green' : 'neutral'}>{seller.acceptsExpress ? 'Enabled' : 'Off'}</Badge>} />
            </div>

            <div className="mt-4 border-t border-line pt-4">
              <p className="label"><MapPin size={11} className="mr-1 inline" /> Serves {seller.servedPincodes?.length || 0} PIN codes</p>
              <div className="flex max-h-40 flex-wrap gap-1.5 overflow-y-auto">
                {seller.servedPincodes?.map((code) => (
                  <span key={code} className="chip bg-blush text-ink-muted">{code}</span>
                ))}
              </div>
            </div>
          </PanelCard>

          <PanelCard title="Commission">
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <label className="label">Rate (%)</label>
                <input
                  type="number"
                  min={0}
                  max={50}
                  value={commission}
                  onChange={(e) => setCommission(e.target.value)}
                  className="input"
                />
              </div>
              <button onClick={saveCommission} disabled={saving} className="btn-primary btn-sm mb-0.5">
                {saving ? <Spinner size={13} /> : <Check size={14} />}
              </button>
            </div>
            <p className="mt-2 text-[11.5px] text-ink-faint">
              Applied to new orders. Existing commission records keep the rate that was live at the time.
            </p>
          </PanelCard>

          <PanelCard title="Payout history" padded={false}>
            {payouts.length ? (
              <div className="divide-y divide-line">
                {payouts.map((p) => (
                  <div key={p._id} className="flex items-center justify-between gap-3 px-5 py-3">
                    <div className="min-w-0">
                      <p className="text-[12.5px] font-semibold text-ink">{inr(p.netPayable)}</p>
                      <p className="text-[11px] text-ink-faint">{formatDate(p.paidAt || p.createdAt)} · {p.orderCount} orders</p>
                    </div>
                    <Badge tone={p.status === 'PAID' ? 'green' : 'amber'} className="!text-[10px]">{p.status}</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-5"><EmptyState icon="money" title="No payouts yet" /></div>
            )}
          </PanelCard>

          {seller.statusReason && (
            <PanelCard title="Status note">
              <p className="text-[13px] leading-relaxed text-ink-muted">{seller.statusReason}</p>
            </PanelCard>
          )}
        </aside>
      </div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-[12.5px] text-ink-muted">{label}</span>
      <span className="text-right text-[12.5px] font-semibold text-ink">{value}</span>
    </div>
  );
}
