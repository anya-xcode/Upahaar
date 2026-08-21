import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import api from '../../lib/api.js';
import { PanelShell } from '../../components/common/panel.jsx';
import {
  Chart, Store, Users, Gift, Grid, Star, MapPin, Tag, Settings, Rupee,
} from '../../components/common/Icons.jsx';

export default function AdminLayout() {
  const { pathname } = useLocation();
  const [stats, setStats] = useState({});

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [pathname]);

  // Badges surface the two things an admin is expected to act on.
  useEffect(() => {
    const load = () => api.get('/admin/dashboard').then(({ data }) => setStats(data.stats)).catch(() => {});
    load();
    const interval = setInterval(load, 60000);
    return () => clearInterval(interval);
  }, []);

  const nav = [
    { to: '/admin', end: true, icon: Chart, label: 'Dashboard' },
    { to: '/admin/analytics', icon: Chart, label: 'Analytics' },
    { section: 'Marketplace' },
    { to: '/admin/sellers', icon: Store, label: 'Sellers', badge: stats.pendingSellers },
    { to: '/admin/orders', icon: Gift, label: 'Orders' },
    { to: '/admin/products', icon: Grid, label: 'Products', badge: stats.pendingProducts },
    { to: '/admin/users', icon: Users, label: 'Customers' },
    { to: '/admin/reviews', icon: Star, label: 'Reviews', badge: stats.pendingReviews },
    { section: 'Operations' },
    { to: '/admin/pincodes', icon: MapPin, label: 'PIN codes & zones' },
    { to: '/admin/payouts', icon: Rupee, label: 'Payouts' },
    { section: 'Content' },
    { to: '/admin/coupons', icon: Tag, label: 'Coupons & offers' },
    { to: '/admin/cms', icon: Settings, label: 'CMS' },
  ];

  return (
    <PanelShell
      nav={nav}
      accent="ink"
      brand={{ icon: 'shield', title: 'Upahaar Admin', subtitle: 'Platform control', to: '/admin' }}
    >
      <Outlet />
    </PanelShell>
  );
}
