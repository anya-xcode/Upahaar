import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import api from '../../lib/api.js';
import { useAuth } from '../../store/authStore.js';
import { useShop } from '../../store/shopStore.js';
import { useLocation as useLocationStore } from '../../store/locationStore.js';
import { Img } from '../common/ui.jsx';
import Logo from '../common/BrandMark.jsx';
import { inr, initials } from '../../lib/format.js';
import {
  Search, MapPin, Heart, Cart, User, ChevronDown, Menu, Close, Gift, Store, Shield, Logout, Bell, Grid, Bolt,
} from '../common/Icons.jsx';

export default function Header() {
  const navigate = useNavigate();
  const user = useAuth((s) => s.user);
  const logout = useAuth((s) => s.logout);
  const { cart, wishlistIds, reset } = useShop();
  const { pincode, info, openPicker } = useLocationStore();

  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggest, setShowSuggest] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const [unread, setUnread] = useState(0);
  const searchRef = useRef(null);

  useEffect(() => {
    api.get('/catalog/categories').then(({ data }) => setCategories(data.categories)).catch(() => {});
  }, []);

  useEffect(() => {
    if (user?.role !== 'CUSTOMER') return;
    api.get('/account/notifications').then(({ data }) => setUnread(data.unread)).catch(() => {});
  }, [user]);

  // Typeahead for the search field.
  useEffect(() => {
    if (query.trim().length < 2) return setSuggestions([]);
    const t = setTimeout(() => {
      api
        .get('/products/search/suggest', { params: { q: query } })
        .then(({ data }) => setSuggestions(data.suggestions))
        .catch(() => setSuggestions([]));
    }, 200);
    return () => clearTimeout(t);
  }, [query]);

  // Close the popovers on any outside click.
  useEffect(() => {
    function onClick(e) {
      if (searchRef.current && !searchRef.current.contains(e.target)) setShowSuggest(false);
      if (!e.target.closest?.('[data-account-menu]')) setAccountOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  function submitSearch(e) {
    e.preventDefault();
    if (!query.trim()) return;
    setShowSuggest(false);
    navigate(`/gifts?q=${encodeURIComponent(query.trim())}`);
  }

  function signOut() {
    logout();
    reset();
    setAccountOpen(false);
    setMenuOpen(false);
    navigate('/');
  }

  const cartCount = cart?.itemCount || 0;
  const featuredCategories = categories.filter((c) => c.isFeatured).slice(0, 6);

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-cream/85 backdrop-blur-xl">
      {/* Brand promise strip */}
      <div className="hidden bg-ink px-4 py-2 text-center caps !tracking-[0.18em] text-white/70 sm:block">
        Don't just send a gift. Send a moment. &nbsp;·&nbsp; Free delivery on next-day orders &nbsp;·&nbsp; Use{' '}
        <span className="font-bold text-rose-200">WELCOME10</span> for 10% off your first gift
      </div>

      <div className="container-app">
        <div className="flex h-[76px] items-center gap-4 sm:gap-7">
          <button
            className="rounded-xl p-2 text-ink-soft transition hover:bg-blush lg:hidden"
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
          >
            <Menu size={22} />
          </button>

          <Logo />

          {/* Search */}
          <div ref={searchRef} className="relative hidden flex-1 md:block">
            <form onSubmit={submitSearch}>
              <Search size={17} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-faint" />
              <input
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setShowSuggest(true);
                }}
                onFocus={() => setShowSuggest(true)}
                placeholder="Search for gifts..."
                className="input !rounded-full !py-2.5 pl-11 pr-4"
              />
            </form>

            {showSuggest && suggestions.length > 0 && (
              <div className="absolute inset-x-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-line bg-white py-2 shadow-lift animate-fade-up">
                {suggestions.map((s) => (
                  <Link
                    key={s._id}
                    to={`/gift/${s.slug}`}
                    onClick={() => setShowSuggest(false)}
                    className="flex items-center gap-3 px-4 py-2.5 transition hover:bg-blush"
                  >
                    <Img src={s.images?.[0]} alt={s.name} seed={s.slug} className="h-10 w-10 rounded-lg object-cover" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-ink">{s.name}</span>
                      <span className="block text-xs text-ink-muted">{inr(s.price)}</span>
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Location */}
          <button
            onClick={openPicker}
            className="hidden shrink-0 items-center gap-2 rounded-full border border-line bg-white px-3.5 py-2 text-left transition hover:border-rose-200 hover:bg-rose-50 sm:flex"
          >
            <MapPin size={16} className="text-rose-500" />
            <span className="leading-tight">
              <span className="block text-[10px] font-semibold uppercase tracking-wide text-ink-faint">
                Deliver to
              </span>
              <span className="block text-[13px] font-bold text-ink">
                {pincode || 'Set PIN code'}
              </span>
            </span>
            <ChevronDown size={14} className="text-ink-faint" />
          </button>

          <div className="ml-auto flex items-center gap-1 sm:gap-2">
            {user?.role === 'CUSTOMER' && (
              <Link
                to="/account/notifications"
                className="relative hidden rounded-full p-2.5 text-ink-soft transition hover:bg-blush hover:text-rose-600 sm:block"
                aria-label="Notifications"
              >
                <Bell size={20} />
                {unread > 0 && (
                  <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white">
                    {unread > 9 ? '9+' : unread}
                  </span>
                )}
              </Link>
            )}

            <Link
              to="/account/wishlist"
              className="relative rounded-full p-2.5 text-ink-soft transition hover:bg-blush hover:text-rose-600"
              aria-label="Wishlist"
            >
              <Heart size={20} />
              {wishlistIds.length > 0 && (
                <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white">
                  {wishlistIds.length}
                </span>
              )}
            </Link>

            <Link
              to="/cart"
              className="relative rounded-full p-2.5 text-ink-soft transition hover:bg-blush hover:text-rose-600"
              aria-label="Cart"
            >
              <Cart size={20} />
              {cartCount > 0 && (
                <span className="absolute right-1 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white">
                  {cartCount}
                </span>
              )}
            </Link>

            {user ? (
              <div className="relative" data-account-menu>
                <button
                  onClick={() => setAccountOpen((v) => !v)}
                  className="flex items-center gap-2 rounded-full border border-line bg-white py-1 pl-1 pr-2.5 transition hover:border-rose-200"
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-rose-100 text-[11px] font-bold text-rose-700">
                    {initials(user.name)}
                  </span>
                  <ChevronDown size={14} className="text-ink-faint" />
                </button>

                {accountOpen && (
                  <div className="absolute right-0 top-full z-50 mt-2 w-60 overflow-hidden rounded-2xl border border-line bg-white py-2 shadow-lift animate-fade-up">
                    <div className="border-b border-line px-4 pb-3 pt-2">
                      <p className="truncate text-sm font-semibold text-ink">{user.name}</p>
                      <p className="truncate text-xs text-ink-muted">{user.email}</p>
                    </div>

                    {user.role === 'CUSTOMER' && (
                      <>
                        <MenuLink to="/account" icon={User} label="My account" onClick={() => setAccountOpen(false)} />
                        <MenuLink to="/account/orders" icon={Gift} label="My orders" onClick={() => setAccountOpen(false)} />
                        <MenuLink to="/account/reminders" icon={Bell} label="Gift reminders" onClick={() => setAccountOpen(false)} />
                      </>
                    )}
                    {user.role === 'SELLER' && (
                      <MenuLink to="/seller" icon={Store} label="Seller dashboard" onClick={() => setAccountOpen(false)} />
                    )}
                    {user.role === 'ADMIN' && (
                      <MenuLink to="/admin" icon={Shield} label="Admin dashboard" onClick={() => setAccountOpen(false)} />
                    )}

                    <button
                      onClick={signOut}
                      className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-ink-soft transition hover:bg-blush"
                    >
                      <Logout size={16} /> Sign out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link to="/login" className="btn-primary btn-sm ml-1 hidden sm:inline-flex">
                <User size={15} /> Login
              </Link>
            )}
          </div>
        </div>

        {/* Category rail */}
        <nav className="hide-scrollbar -mx-4 flex items-center gap-7 overflow-x-auto border-t border-line px-4 py-3 lg:mx-0 lg:px-0">
          <NavLink
            to="/gifts"
            end
            className={({ isActive }) =>
              `shrink-0 caps transition-colors ${isActive ? 'text-rose-600' : 'text-ink-muted hover:text-ink'}`
            }
          >
            <Grid size={13} className="mr-1 inline" />
            All gifts
          </NavLink>
          {featuredCategories.map((c) => (
            <Link
              key={c._id}
              to={`/gifts?category=${c._id}`}
              className="shrink-0 caps text-ink-muted transition-colors hover:text-ink"
            >
              
              {c.name}
            </Link>
          ))}
          <Link to="/occasions" className="shrink-0 caps text-ink-muted transition-colors hover:text-ink">
            Occasions
          </Link>
          <Link to="/sellers" className="shrink-0 caps text-ink-muted transition-colors hover:text-ink">
            Local sellers
          </Link>
          {info?.tiers?.some((t) => t.tier === 'EXPRESS_60') && (
            <Link
              to="/gifts?tier=EXPRESS_60"
              className="ml-auto hidden shrink-0 caps text-rose-500 transition-colors hover:text-rose-700 lg:flex lg:items-center lg:gap-1.5"
            >
              <Bolt size={13} className="mr-1 inline" /> 60-minute gifts
            </Link>
          )}
        </nav>
      </div>

      {/* Mobile search */}
      <div className="border-t border-line px-4 py-2.5 md:hidden">
        <form onSubmit={submitSearch} className="relative">
          <Search size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-faint" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for gifts..."
            className="input !rounded-full !py-2.5 pl-11"
          />
        </form>
      </div>

      {menuOpen && <MobileMenu onClose={() => setMenuOpen(false)} categories={categories} user={user} onSignOut={signOut} />}
    </header>
  );
}

function MenuLink({ to, icon: Icon, label, onClick }) {
  return (
    <Link to={to} onClick={onClick} className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-ink-soft transition hover:bg-blush">
      <Icon size={16} /> {label}
    </Link>
  );
}

function MobileMenu({ onClose, categories, user, onSignOut }) {
  const { pincode, openPicker } = useLocationStore();

  return (
    <div className="fixed inset-0 z-[90] lg:hidden">
      <div className="absolute inset-0 bg-ink/30 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div className="absolute inset-y-0 left-0 w-[85%] max-w-sm animate-fade-in overflow-y-auto bg-white shadow-lift">
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <Logo />
          <button onClick={onClose} className="rounded-full p-2 text-ink-muted hover:bg-blush" aria-label="Close menu">
            <Close size={20} />
          </button>
        </div>

        <button
          onClick={() => {
            onClose();
            openPicker();
          }}
          className="flex w-full items-center gap-3 border-b border-line px-5 py-4 text-left"
        >
          <MapPin size={18} className="text-rose-500" />
          <span>
            <span className="block text-[10px] font-semibold uppercase tracking-wide text-ink-faint">Deliver to</span>
            <span className="block text-sm font-bold text-ink">{pincode || 'Set your PIN code'}</span>
          </span>
          <ChevronDown size={15} className="ml-auto text-ink-faint" />
        </button>

        <div className="px-5 py-4">
          <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.15em] text-ink-faint">Shop by category</p>
          <div className="grid grid-cols-2 gap-2">
            {categories.map((c) => (
              <Link
                key={c._id}
                to={`/gifts?category=${c._id}`}
                onClick={onClose}
                className="rounded-xl border border-line px-3 py-2.5 text-[13px] font-medium text-ink-soft transition hover:border-rose-200 hover:bg-rose-50"
              >
                <span className="mr-1.5">{c.emoji}</span>
                {c.name}
              </Link>
            ))}
          </div>
        </div>

        <div className="border-t border-line px-5 py-4">
          <div className="space-y-1">
            <Link to="/occasions" onClick={onClose} className="block py-2 text-sm font-medium text-ink-soft">Shop by occasion</Link>
            <Link to="/sellers" onClick={onClose} className="block py-2 text-sm font-medium text-ink-soft">Local sellers</Link>
            <Link to="/gift-guides" onClick={onClose} className="block py-2 text-sm font-medium text-ink-soft">Gift guides</Link>
            <Link to="/how-it-works" onClick={onClose} className="block py-2 text-sm font-medium text-ink-soft">How it works</Link>
          </div>
        </div>

        <div className="border-t border-line px-5 py-4">
          {user ? (
            <div className="space-y-1">
              {user.role === 'CUSTOMER' && <Link to="/account" onClick={onClose} className="block py-2 text-sm font-medium text-ink-soft">My account</Link>}
              {user.role === 'SELLER' && <Link to="/seller" onClick={onClose} className="block py-2 text-sm font-medium text-ink-soft">Seller dashboard</Link>}
              {user.role === 'ADMIN' && <Link to="/admin" onClick={onClose} className="block py-2 text-sm font-medium text-ink-soft">Admin dashboard</Link>}
              <button onClick={onSignOut} className="block py-2 text-sm font-medium text-rose-600">Sign out</button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Link to="/login" onClick={onClose} className="btn-primary flex-1">Login</Link>
              <Link to="/signup" onClick={onClose} className="btn-ghost flex-1">Sign up</Link>
            </div>
          )}
          <Link to="/sell-with-us" onClick={onClose} className="mt-4 block text-center text-xs font-semibold text-ink-muted">
            Sell on Upahaar
          </Link>
        </div>
      </div>
    </div>
  );
}
