import { useEffect, useState } from 'react';
import api from '../../../lib/api.js';
import { toast } from '../../../store/toastStore.js';
import { Badge, Modal, Skeleton, EmptyState, Spinner } from '../../../components/common/ui.jsx';
import { Plus, Trash, Shield, Check, Wallet } from '../../../components/common/Icons.jsx';
import { PAYMENT_ICONS } from '../../../lib/glyphs.jsx';

const METHOD_META = {
  UPI: { label: 'UPI' },
  CARD: { label: 'Card' },
  NETBANKING: { label: 'Net Banking' },
  WALLET: { label: 'Wallet' },
};

export default function Payments() {
  const [methods, setMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ label: '', method: 'UPI', maskedValue: '', isDefault: false });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api
      .get('/account/payments')
      .then(({ data }) => setMethods(data.methods))
      .catch(() => setMethods([]))
      .finally(() => setLoading(false));
  }, []);

  async function save(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await api.post('/account/payments', form);
      setMethods(data.methods);
      setForm({ label: '', method: 'UPI', maskedValue: '', isDefault: false });
      setAdding(false);
      toast.success('Payment method saved');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function remove(id) {
    if (!window.confirm('Remove this payment method?')) return;
    try {
      const { data } = await api.delete(`/account/payments/${id}`);
      setMethods(data.methods);
      toast.success('Removed');
    } catch (err) {
      toast.error(err.message);
    }
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold text-ink">Payment methods</h1>
          <p className="mt-1.5 text-sm text-ink-muted">Saved for faster checkout.</p>
        </div>
        <button onClick={() => setAdding(true)} className="btn-primary btn-sm">
          <Plus size={15} /> Add method
        </button>
      </div>

      <div className="mb-6 flex items-start gap-3 rounded-xl2 border border-line bg-blush p-4">
        <Shield size={18} className="mt-0.5 shrink-0 text-rose-500" />
        <p className="text-[13px] leading-relaxed text-ink-muted">
          Only a masked reference is stored here — never a full card number, CVV or UPI PIN. Real card
          tokenisation arrives with the Razorpay integration.
        </p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-xl2" />)}
        </div>
      ) : !methods.length ? (
        <EmptyState
          icon="card"
          title="No saved methods"
          message="Add one to skip typing it in at checkout."
          action={<button onClick={() => setAdding(true)} className="btn-primary">Add a method</button>}
        />
      ) : (
        <div className="space-y-3">
          {methods.map((m) => {
            const meta = METHOD_META[m.method] || { label: m.method };
            const MethodIcon = PAYMENT_ICONS[m.method] || Wallet;
            return (
              <div key={m._id} className="card flex items-center gap-4 p-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blush text-ink-soft">
                  <MethodIcon size={19} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-bold text-ink">{m.label || meta.label}</p>
                    {m.isDefault && <Badge tone="rose" className="!text-[10px]">Default</Badge>}
                  </div>
                  <p className="mt-0.5 font-mono text-[13px] text-ink-muted">{m.maskedValue}</p>
                </div>
                <button onClick={() => remove(m._id)} className="shrink-0 rounded-lg p-2 text-ink-faint transition hover:bg-blush hover:text-[#B3261E]">
                  <Trash size={16} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      <Modal open={adding} onClose={() => setAdding(false)} title="Add a payment method">
        <form onSubmit={save} className="space-y-4">
          <div>
            <label className="label">Type</label>
            <select value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value })} className="input">
              {Object.entries(METHOD_META).map(([key, m]) => (
                <option key={key} value={key}>{m.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Nickname</label>
            <input
              value={form.label}
              onChange={(e) => setForm({ ...form, label: e.target.value })}
              placeholder="HDFC Credit Card"
              className="input"
            />
          </div>

          <div>
            <label className="label">
              {form.method === 'UPI' ? 'UPI ID' : 'Last 4 digits'} <span className="text-rose-500">*</span>
            </label>
            <input
              required
              value={form.maskedValue}
              onChange={(e) => setForm({ ...form, maskedValue: e.target.value })}
              placeholder={form.method === 'UPI' ? 'you@okhdfc' : '•••• 4242'}
              className="input"
            />
          </div>

          <label className="flex cursor-pointer items-center gap-2.5">
            <input
              type="checkbox"
              checked={form.isDefault}
              onChange={(e) => setForm({ ...form, isDefault: e.target.checked })}
              className="h-4 w-4 accent-rose-500"
            />
            <span className="text-[13px] text-ink-soft">Use this by default</span>
          </label>

          <button disabled={saving} className="btn-primary w-full">
            {saving ? <Spinner size={15} /> : <Check size={15} />} Save method
          </button>
        </form>
      </Modal>
    </div>
  );
}
