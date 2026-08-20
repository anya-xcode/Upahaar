import { Link } from 'react-router-dom';
import { useLocation as useLocationStore } from '../../store/locationStore.js';
import { Badge } from '../../components/common/ui.jsx';
import { ChevronRight, Check, Bolt, MapPin } from '../../components/common/Icons.jsx';
import { resolveIcon, TierIcon } from '../../lib/glyphs.jsx';

const JOURNEY = [
  { icon: 'location', title: 'Enter your PIN code', body: "We check which sellers are open right now, hold the item in stock, and sit close enough to reach you. Nothing you can't actually receive is shown." },
  { icon: 'bolt', title: 'See gifts grouped by speed', body: 'Everything is bucketed into 60 minutes, 3 hours, tomorrow, or 2–3 days. The badge on each card is a promise, not a guess.' },
  { icon: 'confetti', title: 'Pick the occasion', body: "Birthday, anniversary, Diwali, or no reason at all — filter down to gifts that suit the moment." },
  { icon: 'personalise', title: 'Make it personal', body: 'Add a name, a photo, a handwritten card, gift wrap, and the exact delivery date and time slot.' },
  { icon: 'card', title: 'Pay how you like', body: 'UPI, cards, net banking, wallets — or cash on delivery in most areas.' },
  { icon: 'truck', title: 'Track it to their door', body: 'Watch it move from the seller through the rider to the moment it lands. We message you at each step.' },
];

const TIERS = [
  { tier: 'EXPRESS_60', badge: '60 MIN', title: 'Deliver in 60 Minutes', body: 'Nearby sellers with the item in stock and a short prep time. Cakes, flowers, chocolates, small hampers.', fee: '₹99', tone: 'rose' },
  { tier: 'PRIORITY_3H', badge: '3 HOURS', title: 'Deliver in 3 Hours', body: 'Sellers a short ride away, or gifts that need real preparation — custom cakes, larger arrangements.', fee: '₹49', tone: 'amber' },
  { tier: 'NEXT_DAY', badge: 'TOMORROW', title: 'Deliver Tomorrow', body: 'Regional sellers and made-to-order personalised gifts. Free delivery.', fee: 'Free', tone: 'blue' },
  { tier: 'STANDARD_2_3D', badge: '2–3 DAYS', title: 'Deliver in 2–3 Days', body: 'Handcrafted and artisan pieces shipped from another city. Worth the little wait.', fee: 'Free', tone: 'neutral' },
];

const FACTORS = [
  'Which sellers cover your PIN code',
  'How far the seller is from you',
  'Whether the item is actually in stock',
  "The seller's working hours right now",
  'How long the gift takes to prepare',
  'Whether riders are on shift in your area',
];

export default function HowItWorks() {
  const { openPicker, pincode } = useLocationStore();

  return (
    <div>
      {/* Hero */}
      <section className="border-b border-line bg-gradient-to-br from-rose-50 via-blush to-gold-50 py-16">
        <div className="container-app max-w-3xl text-center">
          <Badge tone="rose" className="mb-5">How Upahaar works</Badge>
          <h1 className="font-display text-4xl font-semibold leading-tight text-ink sm:text-5xl">
            Find the perfect gift near you
            <br />
            and get it delivered when you need it.
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-[17px] leading-relaxed text-ink-soft">
            Most gifting sites show you a catalogue and work out delivery afterwards. We do it the other way
            round — location first, so every gift you see is one that can actually arrive in time.
          </p>
          <button onClick={openPicker} className="btn-primary mt-7 !py-3.5">
            <MapPin size={16} /> {pincode ? `Change PIN code (${pincode})` : 'Enter your PIN code'}
          </button>
        </div>
      </section>

      <div className="container-app space-y-20 py-16">
        {/* Journey */}
        <section>
          <div className="mb-10 text-center">
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-rose-500">The journey</p>
            <h2 className="font-display text-3xl font-semibold text-ink">From "oh no, I forgot" to "they loved it"</h2>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {JOURNEY.map((s, i) => (
              <div key={s.title} className="relative rounded-xl2 border border-line bg-white p-6">
                <span className="absolute right-5 top-5 font-display text-4xl font-bold text-rose-100">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-rose-50 text-rose-500">
              {(() => { const I = resolveIcon(s.icon); return <I size={21} />; })()}
            </span>
                <h3 className="text-[16px] font-bold text-ink">{s.title}</h3>
                <p className="mt-2 text-[13.5px] leading-relaxed text-ink-muted">{s.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Tiers explained */}
        <section>
          <div className="mb-10 text-center">
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-rose-500">Delivery speeds</p>
            <h2 className="font-display text-3xl font-semibold text-ink">What the badges actually mean</h2>
            <p className="mx-auto mt-3 max-w-xl text-[15px] text-ink-muted">
              Every product carries one of four badges. They are calculated per gift, per PIN code, at the moment
              you look.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            {TIERS.map((t) => (
              <div key={t.badge} className="rounded-xl2 border border-line bg-white p-6">
                <div className="flex items-start justify-between gap-4">
                  <Badge tone={t.tone} className="!px-3 !py-1.5 font-bold uppercase tracking-wide">
                    <TierIcon tier={t.tier} size={13} /> {t.badge}
                  </Badge>
                  <span className="shrink-0 text-sm font-bold text-ink">{t.fee}</span>
                </div>
                <h3 className="mt-4 font-display text-lg font-semibold text-ink">{t.title}</h3>
                <p className="mt-1.5 text-[13.5px] leading-relaxed text-ink-muted">{t.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* The engine */}
        <section className="rounded-4xl bg-ink px-6 py-12 text-white sm:px-12">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
            <div>
              <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-rose-300">Under the hood</p>
              <h2 className="font-display text-3xl font-semibold leading-tight">
                Why we'd rather show you fewer gifts
              </h2>
              <p className="mt-4 text-[15px] leading-relaxed text-white/70">
                A delivery estimate is only worth anything if it holds. So instead of one blanket promise, we
                work out an answer for every single gift, using six live signals.
              </p>
              <p className="mt-4 text-[15px] leading-relaxed text-white/70">
                If the maths doesn't land under an hour, you don't see the express badge. We'd rather show you a
                three-hour gift that arrives than a sixty-minute one that doesn't.
              </p>
            </div>

            <div className="space-y-2.5">
              {FACTORS.map((f) => (
                <div key={f} className="flex items-center gap-3 rounded-xl bg-white/10 px-4 py-3 backdrop-blur">
                  <Check size={16} className="shrink-0 text-rose-300" />
                  <span className="text-[14px]">{f}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="rounded-4xl bg-gradient-to-br from-rose-50 to-gold-50 px-6 py-12 text-center sm:px-12">
          <span className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-2xl shadow-soft">
            <Bolt size={26} className="text-rose-500" />
          </span>
          <h2 className="font-display text-3xl font-semibold text-ink">Don't just send a gift. Send a moment.</h2>
          <p className="mx-auto mt-3 max-w-lg text-[15px] text-ink-muted">
            Enter your PIN code and see what could be at their door within the hour.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link to="/gifts" className="btn-primary">Browse gifts <ChevronRight size={15} /></Link>
            <Link to="/faq" className="btn-ghost">Read the FAQs</Link>
          </div>
        </section>
      </div>
    </div>
  );
}
