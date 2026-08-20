import { useEffect, useState } from 'react';
import api from '../../lib/api.js';
import { toast } from '../../store/toastStore.js';
import { PageHeader, PanelCard, DataTable, SearchInput, FilterTabs } from '../../components/common/panel.jsx';
import { Badge, Pagination, EmptyState } from '../../components/common/ui.jsx';
import { MapPin } from '../../components/common/Icons.jsx';
import { initials, formatDate, timeAgo } from '../../lib/format.js';

const ROLE_FILTERS = [
  ['CUSTOMER', 'Customers'],
  ['SELLER', 'Sellers'],
  ['ADMIN', 'Admins'],
  ['', 'Everyone'],
];

export default function Users() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState('CUSTOMER');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);

  async function load() {
    setLoading(true);
    try {
      const { data: d } = await api.get('/admin/users', {
        params: { role: role || undefined, q: q || undefined, page, limit: 20 },
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
  }, [role, q, page]);

  async function toggle(user) {
    const action = user.isActive ? 'deactivate' : 'reactivate';
    if (!window.confirm(`Are you sure you want to ${action} ${user.name}?`)) return;
    try {
      await api.patch(`/admin/users/${user._id}/toggle`);
      toast.success(`${user.name} ${user.isActive ? 'deactivated' : 'reactivated'}`);
      await load();
    } catch (err) {
      toast.error(err.message);
    }
  }

  const columns = [
    {
      key: 'name',
      header: 'User',
      render: (u) => (
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-rose-100 text-[11px] font-bold text-rose-700">
            {initials(u.name)}
          </span>
          <div className="min-w-0">
            <p className="font-semibold text-ink">{u.name}</p>
            <p className="text-[11.5px] text-ink-faint">{u.email}</p>
          </div>
        </div>
      ),
    },
    { key: 'mobile', header: 'Mobile', render: (u) => <span className="text-ink-soft">{u.mobile || '—'}</span> },
    {
      key: 'defaultPincode',
      header: 'Location',
      render: (u) => (
        u.defaultPincode ? (
          <span className="flex items-center gap-1 text-[12.5px] text-ink-soft">
            <MapPin size={11} className="text-rose-400" /> {u.defaultPincode}
          </span>
        ) : <span className="text-ink-faint">—</span>
      ),
    },
    { key: 'role', header: 'Role', render: (u) => (
      <Badge tone={u.role === 'ADMIN' ? 'ink' : u.role === 'SELLER' ? 'rose' : 'neutral'}>{u.role}</Badge>
    ) },
    { key: 'createdAt', header: 'Joined', render: (u) => <span className="text-ink-muted">{formatDate(u.createdAt)}</span> },
    { key: 'lastLoginAt', header: 'Last seen', render: (u) => (
      <span className="text-ink-muted">{u.lastLoginAt ? timeAgo(u.lastLoginAt) : 'never'}</span>
    ) },
    {
      key: 'isActive',
      header: 'Status',
      align: 'right',
      render: (u) => (
        <button onClick={() => toggle(u)} disabled={u.role === 'ADMIN'} className="disabled:cursor-not-allowed">
          <Badge tone={u.isActive ? 'green' : 'red'}>{u.isActive ? 'Active' : 'Deactivated'}</Badge>
        </button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Users"
        subtitle={data ? `${data.total} account${data.total === 1 ? '' : 's'}` : 'Everyone on the platform'}
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <SearchInput value={q} onChange={(v) => { setQ(v); setPage(1); }} placeholder="Search by name, email or mobile…" className="w-full sm:w-72" />
        <FilterTabs options={ROLE_FILTERS} value={role} onChange={(v) => { setRole(v); setPage(1); }} />
      </div>

      <PanelCard padded={false}>
        <DataTable
          columns={columns}
          rows={data?.users}
          loading={loading}
          empty={<EmptyState icon="users" title="No users match" message="Try another search or filter." />}
          mobileCard={(u) => (
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-100 text-[12px] font-bold text-rose-700">
                {initials(u.name)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[13.5px] font-semibold text-ink">{u.name}</p>
                <p className="truncate text-[11.5px] text-ink-faint">{u.email}</p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  <Badge tone={u.role === 'ADMIN' ? 'ink' : u.role === 'SELLER' ? 'rose' : 'neutral'} className="!text-[10px]">{u.role}</Badge>
                  <Badge tone={u.isActive ? 'green' : 'red'} className="!text-[10px]">{u.isActive ? 'Active' : 'Off'}</Badge>
                  {u.defaultPincode && <Badge tone="neutral" className="!text-[10px]"><MapPin size={10} /> {u.defaultPincode}</Badge>}
                </div>
              </div>
            </div>
          )}
        />
      </PanelCard>

      <Pagination page={data?.page} pages={data?.pages} onChange={setPage} className="mt-6" />
    </div>
  );
}
