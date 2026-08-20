import { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import api from '../../../lib/api.js';
import { useAuth } from '../../../store/authStore.js';
import { useShop } from '../../../store/shopStore.js';
import { initials } from '../../../lib/format.js';
import {
  User, Gift, MapPin, Heart, Calendar, Tag, Shield, Star, Bell, Logout, Settings,
} from '../../../components/common/Icons.jsx';

const NAV = [
  { to: '/account', end: true, icon: User, label: 'Overview' },
  { to: '/account/orders', icon: Gift, label: 'My orders' },
  { to: '/account/wishlist', icon: Heart, label: 'Wishlist' },
  { to: '/account/reminders', icon: Calendar, label: 'Gift reminders' },
  { to: '/account/addresses', icon: MapPin, label: 'Saved addresses' },
  { to: '/account/coupons', icon: Tag, label: 'Coupons & offers' },
  { to: '/account/payments', icon: Shield, label: 'Payment methods' },
  { to: '/account/reviews', icon: Star, label: 'My reviews' },
  { to: '/account/notifications', icon: Bell, label: 'Notifications' },
  { to: '/account/profile', icon: Settings, label: 'Profile settings' },
];

export default function AccountLayout() {
  const navigate = useNavigate();
  const user = useAuth((s) => s.user);
  const logout = useAuth((s) => s.logout);
  const reset = useShop((s) => s.reset);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    api.get('/account/notifications').then(({ data }) => setUnread(data.unread)).catch(() => {});
  }, []);

  function signOut() {
    logout();
    reset();
    navigate('/');
  }

  return (
    <div className="container-app py-8">
      <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
        {/* Sidebar */}
        <aside className="lg:sticky lg:top-[190px] lg:self-start">
          <div className="card mb-4 flex items-center gap-3.5 p-5">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-rose-500 to-rose-400 text-base font-bold text-white">
              {initials(user?.name)}
            </span>
            <div className="min-w-0">
              <p className="truncate font-display text-[16px] font-semibold text-ink">{user?.name}</p>
              <p className="truncate text-xs text-ink-muted">{user?.email}</p>
            </div>
          </div>

          {/* Horizontal on mobile, vertical from lg */}
          <nav className="hide-scrollbar -mx-4 flex gap-1.5 overflow-x-auto px-4 lg:mx-0 lg:flex-col lg:px-0">
            {NAV.map(({ to, end, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `flex shrink-0 items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-[13.5px] font-medium transition ${
                    isActive
                      ? 'bg-rose-50 font-semibold text-rose-700'
                      : 'text-ink-soft hover:bg-blush hover:text-ink'
                  }`
                }
              >
                <Icon size={17} />
                <span className="whitespace-nowrap">{label}</span>
                {to === '/account/notifications' && unread > 0 && (
                  <span className="ml-auto flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
                    {unread}
                  </span>
                )}
              </NavLink>
            ))}

            <button
              onClick={signOut}
              className="flex shrink-0 items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-[13.5px] font-medium text-ink-soft transition hover:bg-blush hover:text-[#B3261E] lg:mt-2 lg:border-t lg:border-line lg:pt-4"
            >
              <Logout size={17} />
              <span className="whitespace-nowrap">Sign out</span>
            </button>
          </nav>
        </aside>

        <div className="min-w-0">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
