import { useEffect, useState } from 'react';
import api from '../../../lib/api.js';
import { toast } from '../../../store/toastStore.js';
import { Badge, Modal, Skeleton, EmptyState, Spinner } from '../../../components/common/ui.jsx';
import { Plus, Edit, Trash, MapPin, Check } from '../../../components/common/Icons.jsx';

const EMPTY = { label: 'Home', name: '', mobile: '', pincode: '', house: '', street: '', landmark: '', city: '', state: '', isDefault: false };

export default function Addresses() {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  async function load() {
    try {
      const { data } = await api.get('/account/addresses');
      setAddresses(data.addresses);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function save(e) {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing._id) await api.patch(`/account/addresses/${editing._id}`, editing);
      else await api.post('/account/addresses', editing);
      toast.success(editing._id ? 'Address updated' : 'Address added');
      setEditing(null);
      await load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function remove(id) {
    if (!window.confirm('Remove this address?')) return;
    try {
      await api.delete(`/account/addresses/${id}`);
      toast.success('Address removed');
      await load();
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function makeDefault(a) {
    try {
      await api.patch(`/account/addresses/${a._id}`, { isDefault: true });
      await load();
    } catch (err) {
      toast.error(err.message);
    }
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold text-ink">Saved addresses</h1>
          <p className="mt-1.5 text-sm text-ink-muted">Where your gifts get delivered.</p>
        </div>
        <button onClick={() => setEditing({ ...EMPTY })} className="btn-primary btn-sm">
          <Plus size={15} /> Add address
        </button>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-44 w-full rounded-xl2" />)}
        </div>
      ) : !addresses.length ? (
        <EmptyState
          icon="location"
          title="No addresses saved"
          message="Add one so checkout takes seconds next time."
          action={<button onClick={() => setEditing({ ...EMPTY })} className="btn-primary">Add your first address</button>}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {addresses.map((a) => (
            <div key={a._id} className={`card p-5 ${a.isDefault ? 'border-rose-200 bg-rose-50/40' : ''}`}>
              <div className="mb-3 flex items-center gap-2">
                <Badge tone="neutral">{a.label}</Badge>
                {a.isDefault && <Badge tone="rose">Default</Badge>}
              </div>

              <p className="text-[15px] font-bold text-ink">{a.name}</p>
              <p className="mt-1.5 text-[13px] leading-relaxed text-ink-muted">
                {a.house}, {a.street}
                {a.landmark && `, near ${a.landmark}`}
                <br />
                {a.city}, {a.state} — {a.pincode}
              </p>
              <p className="mt-1.5 text-[12px] text-ink-faint">{a.mobile}</p>

              <div className="mt-4 flex flex-wrap gap-2 border-t border-line pt-4">
                <button onClick={() => setEditing(a)} className="btn-ghost btn-sm"><Edit size={13} /> Edit</button>
                {!a.isDefault && (
                  <>
                    <button onClick={() => makeDefault(a)} className="btn-ghost btn-sm"><Check size={13} /> Set default</button>
                    <button onClick={() => remove(a._id)} className="btn-ghost btn-sm !text-[#B3261E]"><Trash size={13} /></button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        title={editing?._id ? 'Edit address' : 'Add a new address'}
      >
        {editing && (
          <form onSubmit={save} className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Full name" required value={editing.name} onChange={(v) => setEditing({ ...editing, name: v })} />
              <Field label="Mobile number" required value={editing.mobile} onChange={(v) => setEditing({ ...editing, mobile: v })} />
              <Field label="PIN code" required value={editing.pincode} onChange={(v) => setEditing({ ...editing, pincode: v.replace(/\D/g, '').slice(0, 6) })} />
              <Field label="House / Flat" required value={editing.house} onChange={(v) => setEditing({ ...editing, house: v })} />
              <Field label="Street" value={editing.street} onChange={(v) => setEditing({ ...editing, street: v })} />
              <Field label="Landmark" value={editing.landmark} onChange={(v) => setEditing({ ...editing, landmark: v })} />
              <Field label="City" required value={editing.city} onChange={(v) => setEditing({ ...editing, city: v })} />
              <Field label="State" required value={editing.state} onChange={(v) => setEditing({ ...editing, state: v })} />
            </div>

            <div>
              <label className="label">Save as</label>
              <div className="flex gap-2">
                {['Home', 'Work', 'Other'].map((l) => (
                  <button
                    type="button"
                    key={l}
                    onClick={() => setEditing({ ...editing, label: l })}
                    className={`rounded-full border px-4 py-1.5 text-xs font-semibold transition ${
                      editing.label === l ? 'border-rose-400 bg-rose-50 text-rose-600' : 'border-line text-ink-muted'
                    }`}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>

            <label className="flex cursor-pointer items-center gap-2.5">
              <input
                type="checkbox"
                checked={editing.isDefault}
                onChange={(e) => setEditing({ ...editing, isDefault: e.target.checked })}
                className="h-4 w-4 accent-rose-500"
              />
              <span className="text-[13px] text-ink-soft">Make this my default address</span>
            </label>

            <div className="flex items-center gap-2.5 rounded-xl border border-dashed border-line bg-blush px-3.5 py-3 text-[12px] text-ink-muted">
              <MapPin size={15} className="shrink-0 text-rose-400" />
              Exact map pin available once a Google Maps API key is configured.
            </div>

            <div className="flex gap-2">
              <button disabled={saving} className="btn-primary flex-1">
                {saving ? <Spinner size={15} /> : <Check size={15} />} Save address
              </button>
              <button type="button" onClick={() => setEditing(null)} className="btn-ghost">Cancel</button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}

function Field({ label, value, onChange, required }) {
  return (
    <div>
      <label className="label">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>
      <input value={value || ''} required={required} onChange={(e) => onChange(e.target.value)} className="input" />
    </div>
  );
}
