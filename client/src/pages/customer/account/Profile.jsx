import { useState } from 'react';
import api from '../../../lib/api.js';
import { useAuth } from '../../../store/authStore.js';
import { useLocation as useLocationStore } from '../../../store/locationStore.js';
import { toast } from '../../../store/toastStore.js';
import { Spinner } from '../../../components/common/ui.jsx';
import { Check, MapPin, Shield } from '../../../components/common/Icons.jsx';
import { initials } from '../../../lib/format.js';

export default function Profile() {
  const user = useAuth((s) => s.user);
  const updateProfile = useAuth((s) => s.updateProfile);
  const { pincode, openPicker } = useLocationStore();

  const [form, setForm] = useState({ name: user?.name || '', mobile: user?.mobile || '' });
  const [saving, setSaving] = useState(false);

  const [pwd, setPwd] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [changing, setChanging] = useState(false);

  async function saveProfile(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await updateProfile(form);
      toast.success('Profile updated');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function changePassword(e) {
    e.preventDefault();
    if (pwd.newPassword !== pwd.confirm) return toast.error('New passwords do not match');
    setChanging(true);
    try {
      await api.patch('/auth/password', {
        currentPassword: pwd.currentPassword,
        newPassword: pwd.newPassword,
      });
      toast.success('Password updated');
      setPwd({ currentPassword: '', newPassword: '', confirm: '' });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setChanging(false);
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold text-ink">Profile settings</h1>
        <p className="mt-1.5 text-sm text-ink-muted">Your details and how we reach you.</p>
      </div>

      <section className="card p-6">
        <div className="mb-6 flex items-center gap-4">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-rose-500 to-rose-400 text-xl font-bold text-white">
            {initials(user?.name)}
          </span>
          <div>
            <p className="font-display text-lg font-semibold text-ink">{user?.name}</p>
            <p className="text-[13px] text-ink-muted">{user?.email}</p>
          </div>
        </div>

        <form onSubmit={saveProfile} className="space-y-4">
          <div>
            <label className="label">Full name</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input" />
          </div>

          <div>
            <label className="label">Mobile number</label>
            <input
              value={form.mobile}
              onChange={(e) => setForm({ ...form, mobile: e.target.value })}
              placeholder="+91 98200 00000"
              className="input"
            />
          </div>

          <div>
            <label className="label">Email address</label>
            <input value={user?.email || ''} disabled className="input cursor-not-allowed bg-blush" />
            <p className="mt-1 text-[11px] text-ink-faint">Contact support to change the email on your account.</p>
          </div>

          <button disabled={saving} className="btn-primary">
            {saving ? <Spinner size={15} /> : <Check size={15} />} Save changes
          </button>
        </form>
      </section>

      <section className="card p-6">
        <h2 className="mb-1 flex items-center gap-2 font-display text-lg font-semibold text-ink">
          <MapPin size={17} className="text-rose-500" /> Default delivery location
        </h2>
        <p className="mb-4 text-[13px] text-ink-muted">
          We use this to decide which gifts you see and how fast they can arrive.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-xl border-2 border-dashed border-rose-200 bg-rose-50 px-5 py-2.5 font-display text-lg font-bold tracking-wider text-rose-700">
            {pincode || 'Not set'}
          </span>
          <button onClick={openPicker} className="btn-ghost btn-sm">Change PIN code</button>
        </div>
      </section>

      <section className="card p-6">
        <h2 className="mb-1 flex items-center gap-2 font-display text-lg font-semibold text-ink">
          <Shield size={17} className="text-rose-500" /> Change password
        </h2>
        <p className="mb-4 text-[13px] text-ink-muted">Use at least 6 characters.</p>

        <form onSubmit={changePassword} className="space-y-4">
          <div>
            <label className="label">Current password</label>
            <input
              type="password"
              required
              value={pwd.currentPassword}
              onChange={(e) => setPwd({ ...pwd, currentPassword: e.target.value })}
              className="input"
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="label">New password</label>
              <input
                type="password"
                required
                minLength={6}
                value={pwd.newPassword}
                onChange={(e) => setPwd({ ...pwd, newPassword: e.target.value })}
                className="input"
              />
            </div>
            <div>
              <label className="label">Confirm new password</label>
              <input
                type="password"
                required
                value={pwd.confirm}
                onChange={(e) => setPwd({ ...pwd, confirm: e.target.value })}
                className="input"
              />
            </div>
          </div>
          <button disabled={changing} className="btn-dark">
            {changing ? <Spinner size={15} /> : <Shield size={15} />} Update password
          </button>
        </form>
      </section>
    </div>
  );
}
