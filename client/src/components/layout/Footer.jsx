import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../lib/api.js';
import { toast } from '../../store/toastStore.js';
import { Mail, Bolt, Shield, Truck, Store } from '../common/Icons.jsx';
import Logo from '../common/BrandMark.jsx';

const COLUMNS = [
  {
    title: 'Shop',
    links: [
      ['All gifts', '/gifts'],
      ['60-minute gifts', '/gifts?tier=EXPRESS_60'],
      ['Shop by occasion', '/occasions'],
      ['Personalised gifts', '/gifts?personalizable=true'],
      ['Local sellers', '/sellers'],
    ],
  },
  {
    title: 'Help',
    links: [
      ['How it works', '/how-it-works'],
      ['FAQs', '/faq'],
      ['Track an order', '/account/orders'],
      ['Delivery areas', '/delivery-areas'],
      ['Gift guides', '/gift-guides'],
    ],
  },
  {
    title: 'Upahaar',
    links: [
      ['Sell with us', '/sell-with-us'],
      ['Seller login', '/seller/login'],
      ['Blog', '/gift-guides'],
      ['Admin portal', '/admin/login'],
    ],
  },
];

const PROMISES = [
  { Icon: Bolt, title: '60-minute delivery', body: 'Where sellers are close enough to make it.' },
  { Icon: Store, title: 'Local sellers', body: 'Real bakers and florists near you.' },
  { Icon: Shield, title: 'Secure payments', body: 'UPI, cards, net banking and wallets.' },
  { Icon: Truck, title: 'Live tracking', body: 'From the kitchen to their door.' },
];

export default function Footer() {
  const [cities, setCities] = useState([]);
  const [email, setEmail] = useState('');

  useEffect(() => {
    api.get('/location/cities').then(({ data }) => setCities(data.cities)).catch(() => {});
  }, []);

  function subscribe(e) {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email)) return toast.error('Please enter a valid email address');
    // Newsletter capture is a stub until an email provider is wired up.
    toast.success("You're on the list. Gift ideas, once a week.");
    setEmail('');
  }

  return (
    <footer className="mt-20 border-t border-line bg-white">
      {/* Promise strip */}
      <div className="border-b border-line bg-blush">
        <div className="container-app grid grid-cols-2 gap-6 py-8 lg:grid-cols-4">
          {PROMISES.map(({ Icon, title, body }) => (
            <div key={title} className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-rose-500 shadow-soft">
                <Icon size={19} />
              </span>
              <span>
                <span className="block text-sm font-bold text-ink">{title}</span>
                <span className="block text-xs text-ink-muted">{body}</span>
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Newsletter */}
      <div className="container-app border-b border-line py-12">
        <div className="flex flex-col items-center gap-6 rounded-4xl bg-gradient-to-br from-rose-50 via-blush to-gold-50 px-6 py-10 text-center lg:flex-row lg:justify-between lg:px-12 lg:text-left">
          <div>
            <h3 className="font-display text-2xl font-semibold text-ink">Never miss a moment</h3>
            <p className="mt-1.5 max-w-md text-sm text-ink-muted">
              Gift ideas, seasonal edits and a nudge before the dates that matter.
            </p>
          </div>
          <form onSubmit={subscribe} className="flex w-full max-w-md gap-2">
            <div className="relative flex-1">
              <Mail size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-faint" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="input !rounded-full !py-3 pl-11"
              />
            </div>
            <button className="btn-primary !py-3 shrink-0">Subscribe</button>
          </form>
        </div>
      </div>

      {/* Links */}
      <div className="container-app grid gap-10 py-14 lg:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div>
          <Logo showTagline={false} />
          <p className="mt-4 max-w-xs font-display text-lg italic leading-snug text-ink-soft">
            "Don't just send a gift. Send a moment."
          </p>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-ink-muted">
            Upahaar is a local-first gifting marketplace. Enter your PIN code and we'll show you only what can
            genuinely reach you — sometimes within the hour.
          </p>
        </div>

        {COLUMNS.map((col) => (
          <div key={col.title}>
            <h4 className="mb-4 text-xs font-bold uppercase tracking-[0.15em] text-ink">{col.title}</h4>
            <ul className="space-y-2.5">
              {col.links.map(([label, to]) => (
                <li key={label}>
                  <Link to={to} className="text-sm text-ink-muted transition hover:text-rose-600">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Serviceable cities */}
      {cities.length > 0 && (
        <div className="container-app border-t border-line py-8">
          <h4 className="mb-3 text-xs font-bold uppercase tracking-[0.15em] text-ink-faint">We deliver across</h4>
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            {cities.map((c) => (
              <Link
                key={c.city}
                to="/delivery-areas"
                className="text-sm text-ink-muted transition hover:text-rose-600"
              >
                {c.city}
                <span className="ml-1.5 text-xs text-ink-faint">({c.pincodeCount} PIN codes)</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="border-t border-line">
        <div className="container-app flex flex-col items-center justify-between gap-3 py-6 text-xs text-ink-faint sm:flex-row">
          <p>© {new Date().getFullYear()} Upahaar. Made in India.</p>
          <p className="flex items-center gap-4">
            <span>Privacy</span>
            <span>Terms</span>
            <span>Refunds</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
