import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthShell, { BrandAside } from './AuthShell.jsx';
import { useAuth } from '../../store/authStore.js';
import { toast } from '../../store/toastStore.js';
import { Spinner } from '../../components/common/ui.jsx';
import { Mail, Shield } from '../../components/common/Icons.jsx';

export default function AdminLogin() {
  const navigate = useNavigate();
  const adminLogin = useAuth((s) => s.adminLogin);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    try {
      await adminLogin(email, password);
      toast.success('Signed in to the admin portal');
      navigate('/admin', { replace: true });
    } catch (err) {
      toast.error(err.message);
      setBusy(false);
    }
  }

  return (
    <AuthShell
      tone="ink"
      title="Admin portal"
      subtitle="A separate door — storefront credentials will not work here."
      aside={
        <BrandAside
          dark
          quote={`"Every seller, every order,\nevery PIN code."`}
          points={[
            { icon: 'chart', title: 'Platform analytics', body: 'Revenue, commission, orders by tier and location.' },
            { icon: 'store', title: 'Seller approvals', body: 'KYC review, commission and coverage control.' },
            { icon: 'location', title: 'PIN code manager', body: 'Switch delivery tiers on and off per area.' },
          ]}
        />
      }
    >
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="label">Admin email</label>
          <div className="relative">
            <Mail size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-faint" />
            <input
              type="email"
              required
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@upahaar.test"
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

        <button disabled={busy} className="btn-dark w-full !py-3">
          {busy ? <Spinner size={16} /> : <Shield size={16} />} Sign in
        </button>
      </form>

      <div className="mt-7 rounded-2xl border border-dashed border-line bg-white p-4">
        <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-ink-faint">Demo admin</p>
        <button
          onClick={() => {
            setEmail('admin@upahaar.test');
            setPassword('Admin@123');
          }}
          className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-[12.5px] transition hover:bg-blush"
        >
          <span className="text-ink-muted">admin@upahaar.test</span>
          <span className="text-ink-faint">Admin@123</span>
        </button>
      </div>

      <p className="mt-5 text-center text-[13px] text-ink-muted">
        Not an admin?{' '}
        <Link to="/login" className="font-semibold text-rose-600 hover:underline">Customer sign in</Link>
        {' · '}
        <Link to="/seller/login" className="font-semibold text-rose-600 hover:underline">Seller sign in</Link>
      </p>
    </AuthShell>
  );
}
