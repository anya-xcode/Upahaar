import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthShell, { BrandAside } from './AuthShell.jsx';
import { useAuth } from '../../store/authStore.js';
import { useLocation as useLocationStore } from '../../store/locationStore.js';
import { toast } from '../../store/toastStore.js';
import { Spinner } from '../../components/common/ui.jsx';
import { Mail, Shield, User, MapPin, Phone, Gift } from '../../components/common/Icons.jsx';

export default function Signup() {
  const navigate = useNavigate();
  const register = useAuth((s) => s.register);
  const { pincode, check } = useLocationStore();

  const [form, setForm] = useState({
    name: '', email: '', mobile: '', password: '', pincode: pincode || '', referredBy: '',
  });
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    try {
      const user = await register(form);
      if (form.pincode) await check(form.pincode);
      toast.success(`Welcome to Upahaar, ${user.name.split(' ')[0]}`);
      navigate('/', { replace: true });
    } catch (err) {
      toast.error(err.message);
      setBusy(false);
    }
  }

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <AuthShell
      title="Create your account"
      subtitle="Save occasions, track gifts and check out in seconds."
      aside={
        <BrandAside
          quote={`"Find the perfect gift near you\nand get it delivered when\nyou need it."`}
          points={[
            { icon: 'gift', title: '₹150 off your first order', body: 'Use WELCOME10 or FIRSTGIFT at checkout.' },
            { icon: 'store', title: '500+ local sellers', body: 'Real bakers and florists, not a warehouse.' },
            { icon: 'heart', title: 'Never forget a date', body: 'Set reminders for the people who matter.' },
          ]}
        />
      }
    >
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="label">Full name</label>
          <div className="relative">
            <User size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-faint" />
            <input required autoFocus value={form.name} onChange={set('name')} placeholder="Ananya Gupta" className="input pl-11" />
          </div>
        </div>

        <div>
          <label className="label">Email address</label>
          <div className="relative">
            <Mail size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-faint" />
            <input type="email" required value={form.email} onChange={set('email')} placeholder="you@example.com" className="input pl-11" />
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label">Mobile</label>
            <div className="relative">
              <Phone size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-faint" />
              <input value={form.mobile} onChange={set('mobile')} placeholder="+91 98200 00000" className="input pl-11" />
            </div>
          </div>
          <div>
            <label className="label">PIN code</label>
            <div className="relative">
              <MapPin size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-rose-400" />
              <input
                inputMode="numeric"
                maxLength={6}
                value={form.pincode}
                onChange={(e) => setForm({ ...form, pincode: e.target.value.replace(/\D/g, '') })}
                placeholder="400001"
                className="input pl-11"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="label">Password</label>
          <div className="relative">
            <Shield size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-faint" />
            <input
              type="password"
              required
              minLength={6}
              value={form.password}
              onChange={set('password')}
              placeholder="At least 6 characters"
              className="input pl-11"
            />
          </div>
        </div>

        <div>
          <label className="label">Referral code (optional)</label>
          <input value={form.referredBy} onChange={set('referredBy')} placeholder="GIFT1234" className="input uppercase" />
        </div>

        <button disabled={busy} className="btn-primary w-full !py-3">
          {busy ? <Spinner size={16} /> : <Gift size={16} />} Create account
        </button>

        <p className="text-center text-[11.5px] leading-relaxed text-ink-faint">
          By creating an account you agree to our terms of service and privacy policy.
        </p>
      </form>

      <p className="mt-5 text-center text-[13px] text-ink-muted">
        Already have an account?{' '}
        <Link to="/login" className="font-semibold text-rose-600 hover:underline">Sign in</Link>
      </p>

      <p className="mt-2 text-center text-[13px] text-ink-muted">
        Want to sell?{' '}
        <Link to="/seller/signup" className="font-semibold text-rose-600 hover:underline">Create a seller account</Link>
      </p>
    </AuthShell>
  );
}
