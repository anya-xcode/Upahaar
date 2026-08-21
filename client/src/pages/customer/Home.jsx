import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../lib/api.js';
import { useLocation as useLocationStore } from '../../store/locationStore.js';
import { useAuth } from '../../store/authStore.js';
import ProductCard from '../../components/customer/ProductCard.jsx';
import { SectionHeader, Img, EmptyState, Spinner, ProductCardSkeleton } from '../../components/common/ui.jsx';
import { MapPin, Search, ChevronRight, Check, Star, Calendar } from '../../components/common/Icons.jsx';
import { OccasionGlyph, TierIcon, resolveIcon } from '../../lib/glyphs.jsx';

/**
 * The homepage, composed as an editorial cover.
 *
 * Seven sections, not seventeen. Each one is given room to land, and the
 * delivery tiers — the reason the product exists — get the most of it.
 */
export default function Home() {
  const { pincode, info, check, checking, error, openPicker } = useLocationStore();
  const user = useAuth((s) => s.user);

  const [feed, setFeed] = useState(null);
  const [occasions, setOccasions] = useState([]);
  const [sellers, setSellers] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pinInput, setPinInput] = useState('');

  useEffect(() => {
    api.get('/catalog/occasions').then(({ data }) => setOccasions(data.occasions)).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get('/products/feed', { params: { pincode: pincode || undefined, perTier: 8 } }),
      api.get('/catalog/sellers', { params: { pincode: pincode || undefined, limit: 6 } }),
    ])
      .then(([f, s]) => {
        setFeed(f.data);
        setSellers(s.data.sellers);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [pincode]);

  useEffect(() => {
    if (user?.role !== 'CUSTOMER') return setReminders([]);
    api.get('/account/reminders').then(({ data }) => setReminders(data.due || [])).catch(() => {});
  }, [user]);

  return (
    <>
      {/* 1 — Hero */}
      <Hero
        pincode={pincode}
        info={info}
        pinInput={pinInput}
        setPinInput={setPinInput}
        onSubmit={(e) => {
          e.preventDefault();
          check(pinInput);
        }}
        checking={checking}
        error={error}
        openPicker={openPicker}
      />

      {reminders.length > 0 && <ReminderStrip reminder={reminders[0]} />}

      <div className="container-app space-y-24 py-20 sm:space-y-32 sm:py-28">
        {/* 2 — Delivery tiers: the heart of the page */}
        {loading && !feed ? (
          <div className="grid grid-cols-2 gap-x-6 gap-y-10 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => <ProductCardSkeleton key={i} />)}
          </div>
        ) : (
          <TierSections feed={feed} pincode={pincode} openPicker={openPicker} />
        )}

        {/* 3 — Occasions */}
        {occasions.length > 0 && <Occasions occasions={occasions} />}

        {/* 4 — The edit */}
        {feed?.featured?.length > 0 && (
          <section>
            <SectionHeader
              eyebrow="The edit"
              title="Chosen by us, this week"
              subtitle="A small, considered selection — the pieces we would send ourselves."
              action={<Link to="/gifts?featured=true" className="link-underline text-[13.5px]">See the edit <ChevronRight size={14} /></Link>}
            />
            <div className="grid grid-cols-2 gap-x-6 gap-y-12 lg:grid-cols-4">
              {feed.featured.slice(0, 4).map((p) => <ProductCard key={p._id} product={p} />)}
            </div>
          </section>
        )}

        {/* 5 — Local sellers */}
        {sellers.length > 0 && <LocalSellers sellers={sellers} pincode={pincode} />}

        {/* 6 — How it works */}
        <HowItWorks />

        {/* 7 — Gift reminders */}
        <GiftReminderCta user={user} />
      </div>
    </>
  );
}

/* --------------------------------- Hero ---------------------------------- */

function Hero({ pincode, info, pinInput, setPinInput, onSubmit, checking, error, openPicker }) {
  const serviceable = info?.serviceable && pincode;

  return (
    <section className="relative isolate min-h-[72vh] overflow-hidden bg-ink sm:min-h-[80vh]">
      {/* Full-bleed photograph, dimmed just enough to hold type. */}
      <Img
        src="https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=2000&q=85&auto=format&fit=crop"
        alt=""
        icon="flowers"
        seed="hero"
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-ink/85 via-ink/60 to-ink/25" />
      <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-transparent to-transparent" />

      <div className="container-app relative flex min-h-[72vh] flex-col justify-end pb-16 pt-28 sm:min-h-[80vh] sm:pb-24">
        <div className="max-w-3xl">
          <p className="caps mb-6 text-rose-200">Local gifting · 9 cities</p>

          <h1 className="display-xl text-white">
            Make every
            <br />
            moment special
          </h1>

          <p className="mt-7 max-w-lg text-[17px] leading-relaxed text-white/70">
            Beautiful gifts, delivered exactly when you need them. Tell us where you are and we'll show
            you only what can genuinely reach you.
          </p>

          <div id="find-gifts" className="mt-10 max-w-xl scroll-mt-32">
            {serviceable ? (
              <div>
                <p className="flex items-center gap-2.5 text-[15px] font-semibold text-white">
                  <Check size={17} className="text-rose-300" />
                  We deliver to {pincode} — {info.area}, {info.city}
                </p>

                <div className="mt-6 flex flex-wrap gap-x-8 gap-y-4 border-t border-white/15 pt-6">
                  {info.tiers?.map((t) => (
                    <a key={t.tier} href={`#tier-${t.tier}`} className="group/tier">
                      <span className="flex items-center gap-2 text-white transition group-hover/tier:text-rose-200">
                        <TierIcon tier={t.tier} size={15} />
                        <span className="caps">{t.badge}</span>
                      </span>
                      <span className="mt-1 block tabular text-[13px] text-white/50">
                        {t.productCount} gifts
                      </span>
                    </a>
                  ))}
                </div>

                <button onClick={openPicker} className="mt-6 caps text-white/60 transition hover:text-white">
                  Change PIN code
                </button>
              </div>
            ) : (
              <form onSubmit={onSubmit}>
                <label className="caps mb-3 block text-white/60">Enter your PIN code</label>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <div className="relative flex-1">
                    <MapPin size={18} className="pointer-events-none absolute left-0 top-1/2 -translate-y-1/2 text-rose-300" />
                    <input
                      inputMode="numeric"
                      maxLength={6}
                      value={pinInput}
                      onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
                      placeholder="400001"
                      className="w-full border-0 border-b border-white/25 bg-transparent py-3 pl-7 text-[19px] tabular text-white placeholder:text-white/30 focus:border-rose-300 focus:outline-none focus:ring-0"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={checking}
                    className="btn shrink-0 bg-white !py-3 text-ink hover:bg-rose-50"
                  >
                    {checking ? <Spinner size={15} /> : <Search size={15} />}
                    Find gifts near me
                  </button>
                </div>
              </form>
            )}

            {error && !serviceable && <p className="mt-4 text-sm text-rose-200">{error}</p>}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ----------------------------- Delivery tiers ---------------------------- */

function TierSections({ feed, pincode, openPicker }) {
  if (!pincode) {
    return (
      <EmptyState
        icon="location"
        title="Tell us where to deliver"
        message="Enter your PIN code and we'll group every gift by how fast it can reach you — from sixty minutes to a few days."
        action={<button onClick={openPicker} className="btn-primary">Enter your PIN code</button>}
      />
    );
  }

  if (!feed?.groups?.length) {
    return (
      <EmptyState
        icon="map"
        title={`We're not in ${pincode} yet`}
        message="We're expanding quickly. Try a nearby PIN code, or see where we currently deliver."
        action={
          <div className="flex flex-wrap justify-center gap-2.5">
            <button onClick={openPicker} className="btn-primary">Try another PIN code</button>
            <Link to="/delivery-areas" className="btn-ghost">Delivery areas</Link>
          </div>
        }
      />
    );
  }

  return (
    <div className="space-y-24 sm:space-y-32">
      {feed.groups.map((group) => (
        <section key={group.tier} id={`tier-${group.tier}`} className="scroll-mt-32">
          <SectionHeader
            eyebrow={group.tier === 'EXPRESS_60' ? 'Fastest near you' : `${group.count} gifts`}
            title={
              <span className="flex flex-wrap items-center gap-4">
                <TierIcon tier={group.tier} size={30} className="text-rose-500" />
                {group.label}
              </span>
            }
            subtitle={`${group.tagline} · ${group.eta}`}
            action={
              <Link to={`/gifts?tier=${group.tier}`} className="link-underline text-[13.5px]">
                All {group.count} <ChevronRight size={14} />
              </Link>
            }
          />
          <div className="grid grid-cols-2 gap-x-6 gap-y-12 lg:grid-cols-4">
            {group.products.slice(0, 4).map((p) => <ProductCard key={p._id} product={p} />)}
          </div>
        </section>
      ))}
    </div>
  );
}

/* ------------------------------- Occasions ------------------------------- */

function Occasions({ occasions }) {
  return (
    <section>
      <SectionHeader
        eyebrow="Start here"
        title="What are you gifting for?"
        subtitle="Pick the moment and we'll narrow the catalogue to what suits it — and what can arrive in time."
        action={<Link to="/occasions" className="link-underline text-[13.5px]">All occasions <ChevronRight size={14} /></Link>}
      />
      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl2 bg-line sm:grid-cols-4 lg:grid-cols-8">
        {occasions.slice(0, 8).map((o) => (
          <Link
            key={o._id}
            to={`/gifts?occasion=${o._id}`}
            className="group flex flex-col items-center gap-3 bg-cream px-3 py-8 text-center transition-colors hover:bg-white"
          >
            <OccasionGlyph occasion={o} size={26} className="text-ink-muted transition-colors group-hover:text-rose-500" />
            <span className="text-[12.5px] font-semibold leading-tight text-ink">{o.name}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

/* ----------------------------- Local sellers ----------------------------- */

function LocalSellers({ sellers, pincode }) {
  const [lead, ...rest] = sellers;

  return (
    <section>
      <SectionHeader
        eyebrow="Close to you"
        title={pincode ? `The makers near ${pincode}` : 'Meet our makers'}
        subtitle="Real bakers, florists and craftspeople in your neighbourhood — not a warehouse three states away."
        action={<Link to="/sellers" className="link-underline text-[13.5px]">All sellers <ChevronRight size={14} /></Link>}
      />

      <div className="grid gap-x-6 gap-y-10 lg:grid-cols-2">
        {/* The lead maker gets a full editorial treatment. */}
        <Link to={`/store/${lead.slug}`} className="group">
          <div className="frame aspect-[16/11]">
            <Img
              src={lead.storeImages?.[0]}
              alt={lead.businessName}
              icon="store"
              seed={lead.slug}
              className="h-full w-full object-cover transition-transform duration-[900ms] group-hover:scale-[1.04]"
            />
          </div>
          <p className="mt-5 caps text-ink-faint">{lead.address?.city}</p>
          <h3 className="mt-2 font-display text-[26px] font-semibold leading-tight text-ink transition-colors group-hover:text-rose-700">
            {lead.businessName}
          </h3>
          <p className="mt-2 max-w-md text-[14.5px] leading-relaxed text-ink-muted">{lead.tagline}</p>
          <p className="mt-3 flex items-center gap-1.5 text-[13px] text-ink-muted">
            <Star size={12} className="text-gold-400" />
            <span className="tabular">{lead.rating?.toFixed(1)}</span>
            <span className="text-ink-faint">· {lead.reviewCount} reviews · {lead.deliveryRadiusKm} km radius</span>
          </p>
        </Link>

        {/* The rest as a quiet list. */}
        <div className="flex flex-col justify-center divide-y divide-line">
          {rest.slice(0, 5).map((s) => (
            <Link key={s._id} to={`/store/${s.slug}`} className="group flex items-center gap-5 py-5">
              <div className="frame h-16 w-16 shrink-0">
                <Img src={s.storeImages?.[0]} alt={s.businessName} icon="store" seed={s.slug} className="h-full w-full object-cover" />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="truncate text-[15px] font-semibold text-ink transition-colors group-hover:text-rose-700">
                  {s.businessName}
                </h4>
                <p className="truncate text-[12.5px] text-ink-muted">{s.tagline}</p>
              </div>
              <span className="hidden shrink-0 items-center gap-1 tabular text-[12.5px] text-ink-muted sm:flex">
                <Star size={11} className="text-gold-400" /> {s.rating?.toFixed(1)}
              </span>
              <ChevronRight size={16} className="shrink-0 text-ink-faint transition group-hover:translate-x-0.5 group-hover:text-rose-500" />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------ How it works ----------------------------- */

const STEPS = [
  { n: '01', icon: 'location', title: 'Tell us where', body: 'We check which sellers are open, stocked and close enough to reach you.' },
  { n: '02', icon: 'gift', title: 'Choose the gift', body: 'Every piece is labelled with how fast it can genuinely arrive.' },
  { n: '03', icon: 'personalise', title: 'Make it yours', body: 'Add a message, a photograph, gift wrap and the exact delivery slot.' },
  { n: '04', icon: 'truck', title: 'Watch it arrive', body: 'Track it from the maker to the rider to the moment it lands.' },
];

function HowItWorks() {
  return (
    <section>
      <SectionHeader
        eyebrow="How it works"
        title="Four steps, one very good day"
        action={<Link to="/how-it-works" className="link-underline text-[13.5px]">Read more <ChevronRight size={14} /></Link>}
      />
      <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map((s) => {
          const Icon = resolveIcon(s.icon);
          return (
            <div key={s.n} className="border-t border-line pt-6">
              <div className="flex items-baseline justify-between">
                <span className="font-display tabular text-[15px] font-semibold text-rose-500">{s.n}</span>
                <Icon size={20} className="text-ink-faint" />
              </div>
              <h3 className="mt-5 font-display text-[19px] font-semibold text-ink">{s.title}</h3>
              <p className="mt-2 text-[13.5px] leading-relaxed text-ink-muted">{s.body}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* ------------------------------- Reminders ------------------------------- */

function ReminderStrip({ reminder }) {
  return (
    <div className="border-b border-line bg-blush">
      <div className="container-app flex flex-wrap items-center gap-4 py-4">
        <Calendar size={17} className="shrink-0 text-rose-500" />
        <p className="flex-1 text-[14px] text-ink">{reminder.message}</p>
        <Link to="/gifts" className="link-underline text-[13px]">Find a gift <ChevronRight size={13} /></Link>
      </div>
    </div>
  );
}

function GiftReminderCta({ user }) {
  return (
    <section className="grid items-center gap-x-16 gap-y-10 border-t border-line pt-16 lg:grid-cols-2">
      <div>
        <p className="eyebrow mb-4">Never forget again</p>
        <h2 className="display-lg text-ink">
          Set a reminder.
          <br />
          We'll nudge you in time.
        </h2>
        <p className="mt-5 max-w-md text-[15px] leading-relaxed text-ink-muted">
          Save the birthdays and anniversaries you can't afford to miss. We'll message you a week
          ahead with gifts that can still arrive on the day.
        </p>
        <Link to={user ? '/account/reminders' : '/signup'} className="btn-dark mt-8">
          <Calendar size={15} /> {user ? 'Manage reminders' : 'Set a reminder'}
        </Link>
      </div>

      <div className="divide-y divide-line border-y border-line">
        {[
          { title: "Mom's Birthday", date: '14 September', days: '24 days' },
          { title: 'Wedding Anniversary', date: '20 October', days: '60 days' },
        ].map((r) => (
          <div key={r.title} className="flex items-center gap-5 py-6">
            <div className="min-w-0 flex-1">
              <p className="text-[15px] font-semibold text-ink">{r.title}</p>
              <p className="mt-0.5 text-[13px] text-ink-muted">{r.date}</p>
            </div>
            <span className="caps shrink-0 text-rose-500">in {r.days}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
