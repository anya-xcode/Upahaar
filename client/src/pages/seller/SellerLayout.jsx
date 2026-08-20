import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import api from '../../lib/api.js';
import { useAuth } from '../../store/authStore.js';
import { PanelShell } from '../../components/common/panel.jsx';
import { Badge } from '../../components/common/ui.jsx';
import {
  Chart, Gift, Package, Star, Rupee, Settings, Grid, Warning,
} from '../../components/common/Icons.jsx';

export default function SellerLayout() {
  const user = useAuth((s) => s.user);
  const { pathname } = useLocation();
  const [pending, setPending] = useState(0);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [pathname]);

  // The order badge is the one number a seller checks constantly.
  useEffect(() => {
    if (user?.seller?.status !== 'ACTIVE') return undefined;
    const load = () =>
      api
        .get('/seller/dashboard')
        .then(({ data }) => setPending(data.stats.pendingOrders))
        .catch(() => {});
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const nav = [
    { to: '/seller', end: true, icon: Chart, label: 'Dashboard' },
    { section: 'Selling' },
    { to: '/seller/orders', icon: Gift, label: 'Orders', badge: pending },
    { to: '/seller/products', icon: Grid, label: 'Products' },
    { to: '/seller/inventory', icon: Package, label: 'Inventory' },
    { section: 'Business' },
    { to: '/seller/reviews', icon: Star, label: 'Reviews' },
    { to: '/seller/payouts', icon: Rupee, label: 'Payouts' },
    { to: '/seller/profile', icon: Settings, label: 'Store & delivery' },
  ];

  const status = user?.seller?.status;

  return (
    <PanelShell
      nav={nav}
      brand={{ icon: 'store', title: user?.seller?.businessName || 'Your store', subtitle: 'Seller panel', to: '/seller' }}
    >
      {/* Approval state is impossible to miss — a pending seller can't trade. */}
      {status && status !== 'ACTIVE' && (
        <div
          className={`mb-6 flex flex-wrap items-center gap-3 rounded-xl2 border p-4 ${
            status === 'PENDING' ? 'border-gold-200 bg-gold-50' : 'border-[#F8D7D5] bg-[#FEF6F5]'
          }`}
        >
          <Warning size={18} className={status === 'PENDING' ? 'text-gold-600' : 'text-[#B3261E]'} />
          <div className="min-w-0 flex-1">
            <p className={`text-sm font-bold ${status === 'PENDING' ? 'text-gold-600' : 'text-[#B3261E]'}`}>
              {status === 'PENDING' ? 'Your store is awaiting approval' : 'Your store is suspended'}
            </p>
            <p className="mt-0.5 text-[12.5px] text-ink-muted">
              {status === 'PENDING'
                ? 'You can complete your store details and KYC now. Products and orders unlock once an admin approves you.'
                : 'Please contact Upahaar support to restore your store.'}
            </p>
          </div>
          <Badge tone={status === 'PENDING' ? 'amber' : 'red'}>{status}</Badge>
        </div>
      )}

      <Outlet />
    </PanelShell>
  );
}
