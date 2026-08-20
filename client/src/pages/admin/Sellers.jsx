import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../lib/api.js';
import { toast } from '../../store/toastStore.js';
import { PageHeader, PanelCard, DataTable, SearchInput, FilterTabs } from '../../components/common/panel.jsx';
import { Badge, Pagination, EmptyState, Rating } from '../../components/common/ui.jsx';
import { Check, Close, MapPin, ChevronRight, Warning } from '../../components/common/Icons.jsx';
import { formatDate } from '../../lib/format.js';

const STATUS_FILTERS = [
  ['', 'All'],
  ['PENDING', 'Pending'],
  ['ACTIVE', 'Active'],
  ['SUSPENDED', 'Suspended'],
  ['REJECTED', 'Rejected'],
];

const STATUS_TONES = { ACTIVE: 'green', PENDING: 'amber', SUSPENDED: 'red', REJECTED: 'red' };
const KYC_TONES = { VERIFIED: 'green', PENDING: 'amber', REJECTED: 'red', NOT_SUBMITTED: 'neutral' };

export default function AdminSellers() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);

  const status = params.get('status') || '';
  const kyc = params.get('kyc') || '';

  async function load() {
    setLoading(true);
    try {
      const { data: d } = await api.get('/admin/sellers', {
        params: { status: status || undefined, kyc: kyc || undefined, q: q || undefined, page, limit: 20 },
      });
      setData(d);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const t = setTimeout(load, q ? 300 : 0);
    return () => clearTimeout(t);
  }, [status, kyc, q, page]);

  async function setStatus(seller, next, promptReason) {
    let reason;
    if (promptReason) {
      reason = window.prompt(`Reason for ${next.toLowerCase()}?`);
      if (reason === null) return;
    }
    try {
      await api.patch(`/admin/sellers/${seller._id}/status`, { status: next, reason });
      toast.success(`${seller.businessName} → ${next}`);
      await load();
    } catch (err) {
      toast.error(err.message);
    }
  }

  const columns = [
    {
      key: 'businessName',
      header: 'Seller',
      render: (s) => (
        <div className="min-w-0">
          <p className="font-semibold text-ink">{s.businessName}</p>
          <p className="text-[11.5px] text-ink-faint">{s.ownerName} · {s.email}</p>
        </div>
      ),
    },
    {
      key: 'location',
      header: 'Coverage',
      render: (s) => (
        <div>
          <p className="flex items-center gap-1 text-[12.5px] text-ink-soft">
            <MapPin size={11} className="text-rose-400" /> {s.address?.city || '—'}
          </p>
          <p className="text-[11px] text-ink-faint">{s.servedPincodes?.length || 0} PIN codes · {s.deliveryRadiusKm} km</p>
        </div>
      ),
    },
    {
      key: 'rating',
      header: 'Rating',
      render: (s) => <Rating value={s.rating} count={s.reviewCount} />,
    },
    {
      key: 'commissionRate',
      header: 'Commission',
      render: (s) => <span className="font-semibold text-ink">{s.commissionRate}%</span>,
    },
    {
      key: 'kycStatus',
      header: 'KYC',
      render: (s) => <Badge tone={KYC_TONES[s.kycStatus]}>{s.kycStatus.replace('_', ' ')}</Badge>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (s) => <Badge tone={STATUS_TONES[s.status]}>{s.status}</Badge>,
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (s) => (
        <div className="flex justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          {s.status === 'PENDING' && (
            <>
              <button onClick={() => setStatus(s, 'ACTIVE')} className="btn-ghost btn-sm !border-[#D3EDDF] !text-[#1F6B45]">
                <Check size={13} /> Approve
              </button>
              <button onClick={() => setStatus(s, 'REJECTED', true)} className="btn-ghost btn-sm !text-[#B3261E]">
                <Close size={13} />
              </button>
            </>
          )}
          {s.status === 'ACTIVE' && (
            <button onClick={() => setStatus(s, 'SUSPENDED', true)} className="btn-ghost btn-sm !text-[#B3261E]">
              Suspend
            </button>
          )}
          {['SUSPENDED', 'REJECTED'].includes(s.status) && (
            <button onClick={() => setStatus(s, 'ACTIVE')} className="btn-ghost btn-sm !border-[#D3EDDF] !text-[#1F6B45]">
              <Check size={13} /> Reinstate
            </button>
          )}
          <button onClick={() => navigate(`/admin/sellers/${s._id}`)} className="rounded-lg p-2 text-ink-faint transition hover:bg-blush hover:text-rose-600">
            <ChevronRight size={15} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Sellers"
        subtitle={data ? `${data.total} seller${data.total === 1 ? '' : 's'} on the platform` : 'Manage the marketplace'}
      />

      {data?.counts?.PENDING > 0 && !status && (
        <div className="mb-4 flex items-center gap-3 rounded-xl2 border border-gold-200 bg-gold-50 p-4">
          <Warning size={18} className="shrink-0 text-gold-600" />
          <p className="flex-1 text-[13px] font-semibold text-gold-600">
            {data.counts.PENDING} seller application(s) are waiting for your review.
          </p>
          <button
            onClick={() => setParams(new URLSearchParams({ status: 'PENDING' }))}
            className="btn-ghost btn-sm shrink-0"
          >
            Review now
          </button>
        </div>
      )}

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <SearchInput value={q} onChange={(v) => { setQ(v); setPage(1); }} placeholder="Search sellers…" className="w-full sm:w-64" />
        <FilterTabs
          options={STATUS_FILTERS}
          value={status}
          counts={data?.counts}
          onChange={(v) => {
            const next = new URLSearchParams(params);
            if (v) next.set('status', v);
            else next.delete('status');
            setParams(next);
            setPage(1);
          }}
        />
      </div>

      <PanelCard padded={false}>
        <DataTable
          columns={columns}
          rows={data?.sellers}
          loading={loading}
          onRowClick={(s) => navigate(`/admin/sellers/${s._id}`)}
          empty={<EmptyState icon="store" title="No sellers match" message="Try another filter or search term." />}
          mobileCard={(s) => (
            <div>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[14px] font-semibold text-ink">{s.businessName}</p>
                  <p className="text-[11.5px] text-ink-faint">{s.ownerName}</p>
                </div>
                <Badge tone={STATUS_TONES[s.status]} className="!text-[10px]">{s.status}</Badge>
              </div>
              <p className="mt-2 flex items-center gap-1 text-[12px] text-ink-muted">
                <MapPin size={11} className="text-rose-400" /> {s.address?.city} · {s.servedPincodes?.length || 0} PIN codes
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Rating value={s.rating} count={s.reviewCount} />
                <Badge tone={KYC_TONES[s.kycStatus]} className="!text-[10px]">KYC {s.kycStatus.replace('_', ' ')}</Badge>
              </div>
              {s.status === 'PENDING' && (
                <div className="mt-3 flex gap-2" onClick={(e) => e.stopPropagation()}>
                  <button onClick={() => setStatus(s, 'ACTIVE')} className="btn-primary btn-sm flex-1"><Check size={13} /> Approve</button>
                  <button onClick={() => setStatus(s, 'REJECTED', true)} className="btn-ghost btn-sm !text-[#B3261E]">Reject</button>
                </div>
              )}
            </div>
          )}
        />
      </PanelCard>

      <Pagination page={data?.page} pages={data?.pages} onChange={setPage} className="mt-6" />
    </div>
  );
}
