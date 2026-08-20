import { useEffect, useState } from 'react';
import api from '../../lib/api.js';
import { toast } from '../../store/toastStore.js';
import { PageHeader, PanelCard, DataTable } from '../../components/common/panel.jsx';
import { Img, Badge, Modal, EmptyState, Spinner } from '../../components/common/ui.jsx';
import { Plus, Edit, Trash, Check, Bell } from '../../components/common/Icons.jsx';
import { formatDate } from '../../lib/format.js';

/**
 * One CMS screen with a tab per collection. Each tab declares its fields and
 * the shared editor renders them, so adding a managed collection is a data
 * change rather than another page.
 */
const RESOURCES = {
  banners: {
    label: 'Banners',
    endpoint: '/admin/banners',
    empty: { title: '', subtitle: '', image: '', ctaLabel: '', ctaLink: '', placement: 'HERO', displayOrder: 0, isActive: true },
    fields: [
      { key: 'title', label: 'Title', required: true },
      { key: 'subtitle', label: 'Subtitle' },
      { key: 'image', label: 'Image URL' },
      { key: 'ctaLabel', label: 'Button label' },
      { key: 'ctaLink', label: 'Button link' },
      { key: 'placement', label: 'Placement', type: 'select', options: ['HERO', 'STRIP', 'CATEGORY', 'OCCASION'] },
      { key: 'displayOrder', label: 'Display order', type: 'number' },
      { key: 'isActive', label: 'Active', type: 'bool' },
    ],
    columns: (item) => ({ primary: item.title, secondary: item.subtitle, meta: item.placement }),
  },
  categories: {
    label: 'Categories',
    endpoint: '/admin/categories',
    empty: { name: '', description: '', displayOrder: 0, isFeatured: false, isActive: true },
    fields: [
      { key: 'name', label: 'Name', required: true },
      { key: 'description', label: 'Description' },
      { key: 'displayOrder', label: 'Display order', type: 'number' },
      { key: 'isFeatured', label: 'Featured in the header', type: 'bool' },
      { key: 'isActive', label: 'Active', type: 'bool' },
    ],
    columns: (item) => ({ primary: `$${item.name}`, secondary: item.description, meta: `${item.productCount || 0} products` }),
  },
  occasions: {
    label: 'Occasions',
    endpoint: '/admin/occasions',
    empty: { name: '', tagline: '', month: '', day: '', displayOrder: 0, isActive: true },
    fields: [
      { key: 'name', label: 'Name', required: true },
      { key: 'tagline', label: 'Tagline' },
      { key: 'month', label: 'Month (1–12)', type: 'number' },
      { key: 'day', label: 'Day', type: 'number' },
      { key: 'displayOrder', label: 'Display order', type: 'number' },
      { key: 'isActive', label: 'Active', type: 'bool' },
    ],
    columns: (item) => ({ primary: `$${item.name}`, secondary: item.tagline, meta: item.month ? `${item.day}/${item.month}` : '—' }),
  },
  faqs: {
    label: 'FAQs',
    endpoint: '/admin/faqs',
    empty: { question: '', answer: '', category: 'General', displayOrder: 0, isActive: true },
    fields: [
      { key: 'question', label: 'Question', required: true },
      { key: 'answer', label: 'Answer', type: 'textarea', required: true },
      { key: 'category', label: 'Category', type: 'select', options: ['General', 'Delivery', 'Orders', 'Payments', 'Sellers'] },
      { key: 'displayOrder', label: 'Display order', type: 'number' },
      { key: 'isActive', label: 'Active', type: 'bool' },
    ],
    columns: (item) => ({ primary: item.question, secondary: item.answer, meta: item.category }),
  },
  posts: {
    label: 'Blog & guides',
    endpoint: '/admin/posts',
    empty: { title: '', excerpt: '', body: '', coverImage: '', kind: 'GIFT_GUIDE', readMinutes: 4, isPublished: true },
    fields: [
      { key: 'title', label: 'Title', required: true },
      { key: 'excerpt', label: 'Excerpt' },
      { key: 'body', label: 'Body', type: 'textarea', rows: 8 },
      { key: 'coverImage', label: 'Cover image URL' },
      { key: 'kind', label: 'Type', type: 'select', options: ['GIFT_GUIDE', 'BLOG'] },
      { key: 'readMinutes', label: 'Read time (minutes)', type: 'number' },
      { key: 'isPublished', label: 'Published', type: 'bool' },
    ],
    columns: (item) => ({ primary: item.title, secondary: item.excerpt, meta: item.kind === 'GIFT_GUIDE' ? 'Gift guide' : 'Blog' }),
  },
};

export default function Cms() {
  const [tab, setTab] = useState('banners');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [broadcast, setBroadcast] = useState(null);

  const resource = RESOURCES[tab];

  async function load() {
    setLoading(true);
    try {
      const { data } = await api.get(resource.endpoint);
      setItems(data.items);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [tab]);

  async function save(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...editing };
      resource.fields.forEach((f) => {
        if (f.type === 'number' && payload[f.key] !== '' && payload[f.key] != null) {
          payload[f.key] = Number(payload[f.key]);
        }
        if (f.type === 'number' && payload[f.key] === '') delete payload[f.key];
      });

      if (editing._id) await api.patch(`${resource.endpoint}/${editing._id}`, payload);
      else await api.post(resource.endpoint, payload);

      toast.success(editing._id ? 'Saved' : 'Created');
      setEditing(null);
      await load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function remove(item) {
    if (!window.confirm('Delete this item?')) return;
    try {
      await api.delete(`${resource.endpoint}/${item._id}`);
      toast.success('Deleted');
      await load();
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function sendBroadcast(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await api.post('/admin/notifications/broadcast', broadcast);
      toast.success(`Sent to ${data.sent} recipient(s)`);
      setBroadcast(null);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  }

  const columns = [
    {
      key: 'primary',
      header: 'Item',
      render: (item) => {
        const c = resource.columns(item);
        return (
          <div className="flex items-center gap-3">
            {(item.image || item.coverImage) && (
              <Img src={item.image || item.coverImage} alt={c.primary} seed={item._id} className="h-10 w-14 shrink-0 rounded-lg object-cover" />
            )}
            <div className="min-w-0">
              <p className="line-clamp-1 font-semibold text-ink">{c.primary}</p>
              {c.secondary && <p className="line-clamp-1 text-[11.5px] text-ink-faint">{c.secondary}</p>}
            </div>
          </div>
        );
      },
    },
    { key: 'meta', header: 'Type', render: (item) => <Badge tone="neutral">{resource.columns(item).meta}</Badge> },
    {
      key: 'status',
      header: 'Status',
      render: (item) => {
        const active = item.isActive ?? item.isPublished;
        return <Badge tone={active ? 'green' : 'neutral'}>{active ? 'Live' : 'Hidden'}</Badge>;
      },
    },
    { key: 'updatedAt', header: 'Updated', render: (item) => <span className="text-ink-muted">{formatDate(item.updatedAt)}</span> },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (item) => (
        <div className="flex justify-end gap-1">
          <button
            onClick={() => setEditing({ ...resource.empty, ...item })}
            className="rounded-lg p-2 text-ink-faint transition hover:bg-blush hover:text-rose-600"
          >
            <Edit size={15} />
          </button>
          <button onClick={() => remove(item)} className="rounded-lg p-2 text-ink-faint transition hover:bg-blush hover:text-[#B3261E]">
            <Trash size={15} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Content management"
        subtitle="Homepage banners, categories, occasions, FAQs and stories."
        action={
          <div className="flex gap-2">
            <button onClick={() => setBroadcast({ audience: 'CUSTOMER', title: '', body: '', icon: 'broadcast', link: '' })} className="btn-ghost btn-sm">
              <Bell size={14} /> Broadcast
            </button>
            <button onClick={() => setEditing({ ...resource.empty })} className="btn-primary btn-sm">
              <Plus size={14} /> New {resource.label.toLowerCase().replace(/s$/, '')}
            </button>
          </div>
        }
      />

      <div className="hide-scrollbar mb-4 -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        {Object.entries(RESOURCES).map(([key, r]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`shrink-0 rounded-full px-4 py-1.5 text-[13px] font-semibold transition ${
              tab === key ? 'bg-rose-500 text-white' : 'border border-line bg-white text-ink-muted hover:border-rose-200'
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      <PanelCard padded={false}>
        <DataTable
          columns={columns}
          rows={items}
          loading={loading}
          empty={
            <EmptyState
              icon="note"
              title={`No ${resource.label.toLowerCase()} yet`}
              action={<button onClick={() => setEditing({ ...resource.empty })} className="btn-primary">Create one</button>}
            />
          }
          mobileCard={(item) => {
            const c = resource.columns(item);
            const active = item.isActive ?? item.isPublished;
            return (
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="line-clamp-1 text-[13.5px] font-semibold text-ink">{c.primary}</p>
                    {c.secondary && <p className="line-clamp-2 text-[11.5px] text-ink-faint">{c.secondary}</p>}
                  </div>
                  <Badge tone={active ? 'green' : 'neutral'} className="!text-[10px]">{active ? 'Live' : 'Hidden'}</Badge>
                </div>
                <div className="mt-3 flex gap-2">
                  <button onClick={() => setEditing({ ...resource.empty, ...item })} className="btn-ghost btn-sm flex-1"><Edit size={13} /> Edit</button>
                  <button onClick={() => remove(item)} className="btn-ghost btn-sm !text-[#B3261E]"><Trash size={13} /></button>
                </div>
              </div>
            );
          }}
        />
      </PanelCard>

      {/* Generic editor */}
      <Modal
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        title={editing?._id ? `Edit ${resource.label.toLowerCase().replace(/s$/, '')}` : `New ${resource.label.toLowerCase().replace(/s$/, '')}`}
        width="max-w-xl"
      >
        {editing && (
          <form onSubmit={save} className="space-y-4">
            {resource.fields.map((f) => {
              if (f.type === 'bool') {
                return (
                  <button
                    type="button"
                    key={f.key}
                    onClick={() => setEditing({ ...editing, [f.key]: !editing[f.key] })}
                    className={`flex w-full items-center gap-3 rounded-lg border p-2.5 text-left transition ${
                      editing[f.key] ? 'border-rose-300 bg-rose-50' : 'border-line'
                    }`}
                  >
                    <span className={`flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded border-2 ${editing[f.key] ? 'border-rose-500 bg-rose-500 text-white' : 'border-line'}`}>
                      {editing[f.key] && <Check size={11} />}
                    </span>
                    <span className="text-[12.5px] font-semibold text-ink">{f.label}</span>
                  </button>
                );
              }

              return (
                <div key={f.key}>
                  <label className="label">
                    {f.label} {f.required && <span className="text-rose-500">*</span>}
                  </label>
                  {f.type === 'textarea' ? (
                    <textarea
                      rows={f.rows || 4}
                      required={f.required}
                      value={editing[f.key] ?? ''}
                      onChange={(e) => setEditing({ ...editing, [f.key]: e.target.value })}
                      className="input resize-none"
                    />
                  ) : f.type === 'select' ? (
                    <select
                      value={editing[f.key] ?? ''}
                      onChange={(e) => setEditing({ ...editing, [f.key]: e.target.value })}
                      className="input"
                    >
                      {f.options.map((o) => <option key={o} value={o}>{o}</option>)}
                    </select>
                  ) : (
                    <input
                      type={f.type === 'number' ? 'number' : 'text'}
                      required={f.required}
                      value={editing[f.key] ?? ''}
                      onChange={(e) => setEditing({ ...editing, [f.key]: e.target.value })}
                      className="input"
                    />
                  )}
                </div>
              );
            })}

            <div className="flex gap-2">
              <button disabled={saving} className="btn-primary flex-1">
                {saving ? <Spinner size={15} /> : <Check size={15} />} Save
              </button>
              <button type="button" onClick={() => setEditing(null)} className="btn-ghost">Cancel</button>
            </div>
          </form>
        )}
      </Modal>

      {/* Broadcast */}
      <Modal open={Boolean(broadcast)} onClose={() => setBroadcast(null)} title="Send a broadcast">
        {broadcast && (
          <form onSubmit={sendBroadcast} className="space-y-4">
            <div>
              <label className="label">Audience</label>
              <select value={broadcast.audience} onChange={(e) => setBroadcast({ ...broadcast, audience: e.target.value })} className="input">
                <option value="CUSTOMER">All customers</option>
                <option value="SELLER">All sellers</option>
              </select>
            </div>
            <div>
              <label className="label">Title <span className="text-rose-500">*</span></label>
              <input required value={broadcast.title} onChange={(e) => setBroadcast({ ...broadcast, title: e.target.value })} placeholder="Diwali gifting is live" className="input" />
            </div>
            <div>
              <label className="label">Message</label>
              <textarea rows={3} value={broadcast.body} onChange={(e) => setBroadcast({ ...broadcast, body: e.target.value })} className="input resize-none" />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="label">Icon</label>
                <select value={broadcast.icon} onChange={(e) => setBroadcast({ ...broadcast, icon: e.target.value })} className="input">
                  {['broadcast', 'promo', 'gift', 'store', 'bolt', 'calendar'].map((k) => <option key={k} value={k}>{k}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Link</label>
                <input value={broadcast.link} onChange={(e) => setBroadcast({ ...broadcast, link: e.target.value })} placeholder="/gifts?category=…" className="input" />
              </div>
            </div>
            <button disabled={saving} className="btn-primary w-full">
              {saving ? <Spinner size={15} /> : <Bell size={15} />} Send broadcast
            </button>
          </form>
        )}
      </Modal>
    </div>
  );
}
