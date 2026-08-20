import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import AuthShell, { BrandAside } from './AuthShell.jsx';
import { useAuth } from '../../store/authStore.js';
import { toast } from '../../store/toastStore.js';
import { Spinner } from '../../components/common/ui.jsx';
import { Mail, Shield, User } from '../../components/common/Icons.jsx';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const login = useAuth((s) => s.login);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    try {
      const user = await login(email, password);
      toast.success(`Welcome back, ${user.name.split(' ')[0]}`);
      navigate(user.role === 'SELLER' ? '/seller' : location.state?.from || '/', { replace: true });
    } catch (err) {
      toast.error(err.message);
      setBusy(false);
    }
  }

  /** Demo credentials, so the app can be explored without reading the README. */
  function fill(demoEmail, demoPassword) {
    setEmail(demoEmail);
    setPassword(demoPassword);
  }

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to track your gifts, save occasions and check out faster."
      aside={
        <BrandAside
          quote={`"Don't just send a gift.\nSend a moment."`}
          points={[
            { icon: 'bolt', title: '60-minute delivery', body: 'From sellers a few streets away.' },
            { icon: 'calendar', title: 'Gift reminders', body: "We'll nudge you before the date sneaks up." },
            { icon: 'truck', title: 'Live tracking', body: 'Watch it travel from the kitchen to their door.' },
          ]}
        />
      }
    >
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="label">Email address</label>
          <div className="relative">
            <Mail size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-faint" />
            <input
              type="email"
              required
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="input pl-11"
            />
          </div>
        </div>

        <div>
          <label className="label">Password</label>
          <div className="relative">
            <Shield size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-faint" />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="input pl-11"
            />
          </div>
        </div>

        <button disabled={busy} className="btn-primary w-full !py-3">
          {busy ? <Spinner size={16} /> : <User size={16} />} Sign in
        </button>
      </form>

      <p className="mt-5 text-center text-[13px] text-ink-muted">
        New to Upahaar?{' '}
        <Link to="/signup" className="font-semibold text-rose-600 hover:underline">Create an account</Link>
      </p>

      <div className="mt-7 rounded-2xl border border-dashed border-line bg-white p-4">
        <p className="mb-2.5 text-[11px] font-bold uppercase tracking-[0.14em] text-ink-faint">Demo accounts</p>
        <div className="space-y-1.5">
          <button onClick={() => fill('ananya@upahaar.test', 'Test@123')} className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-[12.5px] transition hover:bg-blush">
            <span><span className="font-semibold text-ink">Customer</span> <span className="text-ink-muted">ananya@upahaar.test</span></span>
            <span className="text-ink-faint">Test@123</span>
          </button>
          <button onClick={() => fill('seller@upahaar.test', 'Test@123')} className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-[12.5px] transition hover:bg-blush">
            <span><span className="font-semibold text-ink">Seller</span> <span className="text-ink-muted">seller@upahaar.test</span></span>
            <span className="text-ink-faint">Test@123</span>
          </button>
        </div>
        <Link to="/admin/login" className="mt-2 block px-2.5 text-[12px] font-semibold text-rose-600 hover:underline">
          Admin sign in →
        </Link>
      </div>
    </AuthShell>
  );
}
