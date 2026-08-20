import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../../lib/api.js';
import { toast } from '../../../store/toastStore.js';
import { Badge, Modal, Skeleton, EmptyState, Spinner } from '../../../components/common/ui.jsx';
import { Plus, Edit, Trash, Calendar, Check, Gift } from '../../../components/common/Icons.jsx';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const RELATIONS = ['Mother', 'Father', 'Spouse', 'Sibling', 'Child', 'Friend', 'Colleague', 'Other'];

const EMPTY = { title: '', relation: 'Friend', occasionName: 'Birthday', month: new Date().getMonth() + 1, day: new Date().getDate(), remindDaysBefore: 7, notes: '' };

export default function Reminders() {
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  async function load() {
    try {
      const { data } = await api.get('/account/reminders');
      setReminders(data.reminders);
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
      const payload = { ...editing, month: Number(editing.month), day: Number(editing.day) };
      if (editing._id) await api.patch(`/account/reminders/${editing._id}`, payload);
      else await api.post('/account/reminders', payload);
      toast.success(editing._id ? 'Reminder updated' : "Saved — we'll nudge you.");
      setEditing(null);
      await load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function remove(id) {
    if (!window.confirm('Delete this reminder?')) return;
    try {
      await api.delete(`/account/reminders/${id}`);
      toast.success('Reminder removed');
      await load();
    } catch (err) {
      toast.error(err.message);
    }
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold text-ink">Gift reminders</h1>
          <p className="mt-1.5 max-w-lg text-sm text-ink-muted">
            Save the dates you can't afford to forget. We'll message you ahead of time with ideas that still
            arrive in time.
          </p>
        </div>
        <button onClick={() => setEditing({ ...EMPTY })} className="btn-primary btn-sm">
          <Plus size={15} /> Add reminder
        </button>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-40 w-full rounded-xl2" />)}
        </div>
      ) : !reminders.length ? (
        <EmptyState
          icon="cakes"
          title="No reminders yet"
          message="Add Mom's birthday, your anniversary, or anything else that sneaks up on you."
          action={<button onClick={() => setEditing({ ...EMPTY })} className="btn-primary">Add your first reminder</button>}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {reminders.map((r) => (
            <div key={r._id} className={`card p-5 ${r.isDue ? 'border-rose-300 bg-rose-50/50' : ''}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="font-display text-lg font-semibold text-ink">{r.title}</h2>
                  <p className="mt-0.5 text-[12.5px] text-ink-muted">
                    {r.relation} · {r.occasionName || 'Occasion'}
                  </p>
                </div>
                <Badge tone={r.isDue ? 'rose' : 'neutral'}>
                  {r.daysUntil === 0 ? 'Today' : `in ${r.daysUntil} day${r.daysUntil === 1 ? '' : 's'}`}
                </Badge>
              </div>

              <p className="mt-3 flex items-center gap-1.5 text-[13px] font-semibold text-ink-soft">
                <Calendar size={14} className="text-rose-500" />
                {r.day} {MONTHS[r.month - 1]}
              </p>

              {r.notes && (
                <p className="mt-2 rounded-lg bg-blush px-3 py-2 text-[12px] italic text-ink-muted">{r.notes}</p>
              )}

              <p className="mt-2 text-[11.5px] text-ink-faint">
                Reminder {r.remindDaysBefore} days before
              </p>

              {r.isDue && (
                <div className="mt-3 rounded-xl bg-white p-3">
                  <p className="text-[13px] font-semibold text-ink">{r.message}</p>
                  <Link to="/gifts" className="btn-primary btn-sm mt-2.5">
                    <Gift size={13} /> Find a gift
                  </Link>
                </div>
              )}

              <div className="mt-4 flex gap-2 border-t border-line pt-4">
                <button onClick={() => setEditing(r)} className="btn-ghost btn-sm"><Edit size={13} /> Edit</button>
                <button onClick={() => remove(r._id)} className="btn-ghost btn-sm !text-[#B3261E]"><Trash size={13} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={Boolean(editing)} onClose={() => setEditing(null)} title={editing?._id ? 'Edit reminder' : 'New gift reminder'}>
        {editing && (
          <form onSubmit={save} className="space-y-4">
            <div>
              <label className="label">What's the occasion? <span className="text-rose-500">*</span></label>
              <input
                required
                value={editing.title}
                onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                placeholder="Mom's Birthday"
                className="input"
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="label">Who is it for?</label>
                <select value={editing.relation} onChange={(e) => setEditing({ ...editing, relation: e.target.value })} className="input">
                  {RELATIONS.map((r) => <option key={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Occasion type</label>
                <input
                  value={editing.occasionName || ''}
                  onChange={(e) => setEditing({ ...editing, occasionName: e.target.value })}
                  placeholder="Birthday"
                  className="input"
                />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="sm:col-span-2">
                <label className="label">Month</label>
                <select value={editing.month} onChange={(e) => setEditing({ ...editing, month: e.target.value })} className="input">
                  {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Day</label>
                <input
                  type="number"
                  min={1}
                  max={31}
                  value={editing.day}
                  onChange={(e) => setEditing({ ...editing, day: e.target.value })}
                  className="input"
                />
              </div>
            </div>

            <div>
              <label className="label">Remind me this many days before</label>
              <select
                value={editing.remindDaysBefore}
                onChange={(e) => setEditing({ ...editing, remindDaysBefore: Number(e.target.value) })}
                className="input"
              >
                {[1, 3, 5, 7, 10, 14, 21, 30].map((d) => <option key={d} value={d}>{d} days</option>)}
              </select>
            </div>

            <div>
              <label className="label">Notes (what do they like?)</label>
              <input
                value={editing.notes || ''}
                onChange={(e) => setEditing({ ...editing, notes: e.target.value })}
                placeholder="She loves tulips, not roses"
                className="input"
              />
            </div>

            <div className="flex gap-2">
              <button disabled={saving} className="btn-primary flex-1">
                {saving ? <Spinner size={15} /> : <Check size={15} />} Save reminder
              </button>
              <button type="button" onClick={() => setEditing(null)} className="btn-ghost">Cancel</button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
