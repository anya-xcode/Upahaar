import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthShell, { BrandAside } from './AuthShell.jsx';
import { useAuth } from '../../store/authStore.js';
import { toast } from '../../store/toastStore.js';
import { Spinner } from '../../components/common/ui.jsx';
import { Mail, Shield, Store } from '../../components/common/Icons.jsx';

export default function SellerLogin() {
  const navigate = useNavigate();
  const login = useAuth((s) => s.login);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    try {
      const user = await login(email, password);
      if (user.role !== 'SELLER') {
        toast.info('That is a customer account — taking you to the storefront.');
        return navigate('/', { replace: true });
      }
      toast.success(`Welcome back, ${user.seller?.businessName || user.name}`);
      navigate('/seller', { replace: true });
    } catch (err) {
      toast.error(err.message);
      setBusy(false);
    }
  }

  return (
    <AuthShell
      title="Seller sign in"
      subtitle="Manage your orders, products and delivery coverage."
      aside={
        <BrandAside
          quote={`"Your shop, everyone's\nfavourite gift."`}
          points={[
            { icon: 'bell', title: 'Live order queue', body: 'Accept, prepare and dispatch in a couple of taps.' },
            { icon: 'location', title: 'You set the coverage', body: 'Your PIN codes, radius, hours and prep times.' },
            { icon: 'money', title: 'Transparent payouts', body: 'Commission shown per order, settled on a cycle.' },
          ]}
        />
      }
    >
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="label">Business email</label>
          <div className="relative">
            <Mail size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-faint" />
            <input type="email" required autoFocus value={email} onChange={(e) => setEmail(e.target.value)} placeholder="store@example.com" className="input pl-11" />
          </div>
        </div>

        <div>
          <label className="label">Password</label>
          <div className="relative">
            <Shield size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-faint" />
            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="input pl-11" />
          </div>
        </div>

        <button disabled={busy} className="btn-primary w-full !py-3">
          {busy ? <Spinner size={16} /> : <Store size={16} />} Sign in to your store
        </button>
      </form>

      <p className="mt-5 text-center text-[13px] text-ink-muted">
        Don't have a store yet?{' '}
        <Link to="/seller/signup" className="font-semibold text-rose-600 hover:underline">Apply to sell</Link>
      </p>

      <div className="mt-7 rounded-2xl border border-dashed border-line bg-white p-4">
        <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-ink-faint">Demo seller</p>
        <button
          onClick={() => {
            setEmail('seller@upahaar.test');
            setPassword('Test@123');
          }}
          className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-[12.5px] transition hover:bg-blush"
        >
          <span><span className="font-semibold text-ink">Blooms &amp; Bakes</span> <span className="text-ink-muted">seller@upahaar.test</span></span>
          <span className="text-ink-faint">Test@123</span>
        </button>
      </div>

      <p className="mt-4 text-center text-[13px] text-ink-muted">
        Shopping instead?{' '}
        <Link to="/login" className="font-semibold text-rose-600 hover:underline">Customer sign in</Link>
      </p>
    </AuthShell>
  );
}
