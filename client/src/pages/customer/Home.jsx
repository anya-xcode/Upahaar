import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../lib/api.js';
import { useLocation as useLocationStore } from '../../store/locationStore.js';
import { useAuth } from '../../store/authStore.js';
import ProductCard from '../../components/customer/ProductCard.jsx';
import ProductRail from '../../components/customer/ProductRail.jsx';
import { SectionHeader, Img, Rating, Badge, EmptyState, Spinner, ProductCardSkeleton } from '../../components/common/ui.jsx';
import { MapPin, Search, ChevronRight, Bolt, Star, Store, Calendar, Check, Clock, Balloon } from '../../components/common/Icons.jsx';
import { resolveIcon, CategoryGlyph, OccasionGlyph, TierIcon } from '../../lib/glyphs.jsx';
import { inr } from '../../lib/format.js';

export default function Home() {
  const { pincode, info, check, checking, error, openPicker } = useLocationStore();
  const user = useAuth((s) => s.user);

  const [feed, setFeed] = useState(null);
  const [categories, setCategories] = useState([]);
  const [occasions, setOccasions] = useState([]);
  const [sellers, setSellers] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pinInput, setPinInput] = useState('');

  useEffect(() => {
    Promise.all([
      api.get('/catalog/categories'),
      api.get('/catalog/occasions'),
      api.get('/reviews', { params: { limit: 6 } }),
    ])
      .then(([c, o, r]) => {
        setCategories(c.data.categories);
        setOccasions(o.data.occasions);
        setReviews(r.data.reviews.filter((x) => x.comment && x.productRating >= 4).slice(0, 6));
      })
      .catch(() => {});
  }, []);

  // The feed and the local-seller rail are both scoped to the pincode, so they
  // re-fetch whenever the customer changes location.
  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get('/products/feed', { params: { pincode: pincode || undefined, perTier: 8 } }),
      api.get('/catalog/sellers', { params: { pincode: pincode || undefined, limit: 8 } }),
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

      {reminders.length > 0 && <ReminderStrip reminders={reminders} />}

      <div className="container-app space-y-16 py-14 sm:space-y-20">
        {/* 4. What are you gifting for? */}
        <section>
          <SectionHeader
            eyebrow="Start here"
            title="What are you gifting for?"
            subtitle="Pick the moment and we'll find something that fits it — and reaches them in time."
            action={<Link to="/occasions" className="btn-ghost btn-sm">All occasions <ChevronRight size={14} /></Link>}
          />
          <div className="hide-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-4 sm:overflow-visible sm:px-0 lg:grid-cols-8">
            {occasions.slice(0, 8).map((o) => (
              <Link
                key={o._id}
                to={`/gifts?occasion=${o._id}`}
                className="group flex w-24 shrink-0 flex-col items-center gap-2.5 rounded-2xl border border-line bg-white p-3 text-center transition hover:-translate-y-0.5 hover:border-rose-200 hover:shadow-soft sm:w-auto"
              >
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-blush text-rose-500 transition group-hover:scale-110">
                  <OccasionGlyph occasion={o} size={22} />
                </span>
                <span className="text-[12px] font-semibold leading-tight text-ink">{o.name}</span>
              </Link>
            ))}
          </div>
        </section>

        {/* 5–6. Delivery tier groups — the heart of the homepage */}
        {loading && !feed ? (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => <ProductCardSkeleton key={i} />)}
          </div>
        ) : (
          <TierSections feed={feed} pincode={pincode} openPicker={openPicker} />
        )}

        {/* 7. Popular gifts */}
        {feed?.bestSellers?.length > 0 && (
          <section>
            <SectionHeader
              eyebrow="Loved by everyone"
              title="Popular gifts right now"
              subtitle="The ones people keep coming back for."
              action={<Link to="/gifts?sort=popular" className="btn-ghost btn-sm">See all <ChevronRight size={14} /></Link>}
            />
            <ProductRail products={feed.bestSellers} />
          </section>
        )}

        {/* 8. Categories */}
        <section>
          <SectionHeader eyebrow="Browse" title="Shop by category" />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {categories.map((c) => (
              <Link
                key={c._id}
                to={`/gifts?category=${c._id}`}
                className="group relative overflow-hidden rounded-xl2 border border-line p-5 transition hover:-translate-y-0.5 hover:shadow-lift"
                style={{ background: `linear-gradient(135deg, ${c.accent?.from || '#FFF1F5'}, ${c.accent?.to || '#FFF8F0'})` }}
              >
                <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-white/70 text-ink-soft transition group-hover:scale-110">
                  <CategoryGlyph category={c} size={20} />
                </span>
                <span className="block text-sm font-bold text-ink">{c.name}</span>
                <span className="mt-0.5 block text-[11px] text-ink-muted">{c.productCount} gifts</span>
              </Link>
            ))}
          </div>
        </section>

        {/* 9. Shop by occasion */}
        <section>
          <SectionHeader
            eyebrow="Every moment"
            title="Shop by occasion"
            subtitle="Birthdays, anniversaries, festivals, and the days that need no reason at all."
          />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {occasions.map((o) => (
              <Link
                key={o._id}
                to={`/gifts?occasion=${o._id}`}
                className="group flex items-center gap-3 rounded-xl2 border border-line bg-white p-4 transition hover:-translate-y-0.5 hover:border-rose-200 hover:shadow-soft"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blush text-rose-500 transition group-hover:scale-110">
                  <OccasionGlyph occasion={o} size={19} />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-[13px] font-bold text-ink">{o.name}</span>
                  <span className="block truncate text-[11px] text-ink-muted">{o.tagline}</span>
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* 10. Best sellers / featured */}
        {feed?.featured?.length > 0 && (
          <section>
            <SectionHeader
              eyebrow="Handpicked"
              title="Our favourites this week"
              action={<Link to="/gifts?featured=true" className="btn-ghost btn-sm">See all <ChevronRight size={14} /></Link>}
            />
            <ProductRail products={feed.featured} />
          </section>
        )}

        {/* 11. Personalised */}
        {feed?.personalized?.length > 0 && (
          <section className="overflow-hidden rounded-4xl bg-gradient-to-br from-[#F6EFFF] via-blush to-[#FFF6EC] p-6 sm:p-10">
            <SectionHeader
              eyebrow="Make it theirs"
              title="Personalised gifts"
              subtitle="Add a name, a date or a photograph. The small touch that makes it unmistakably from you."
              action={<Link to="/gifts?personalizable=true" className="btn-ghost btn-sm">See all <ChevronRight size={14} /></Link>}
            />
            <ProductRail products={feed.personalized} />
          </section>
        )}

        {/* 12. Local sellers */}
        {sellers.length > 0 && <LocalSellers sellers={sellers} pincode={pincode} />}

        {/* 13. How it works */}
        <HowItWorksStrip />

        {/* 14. Customer reviews */}
        {reviews.length > 0 && <ReviewWall reviews={reviews} />}

        {/* 15. Gift reminder CTA */}
        <GiftReminderCta user={user} />
      </div>
    </>
  );
}

/* ------------------------------- Hero ---------------------------------- */

function Hero({ pincode, info, pinInput, setPinInput, onSubmit, checking, error, openPicker }) {
  const serviceable = info?.serviceable && pincode;

  return (
    <section className="relative overflow-hidden border-b border-line bg-gradient-to-br from-rose-50 via-blush to-gold-50">
      {/* Soft decorative blooms — pure CSS, no image weight. */}
      <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-rose-200/30 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-16 h-80 w-80 rounded-full bg-gold-200/30 blur-3xl" />

      <div className="container-app relative grid items-center gap-10 py-14 lg:grid-cols-[1.05fr_0.95fr] lg:py-20">
        <div className="animate-fade-up">
          <Badge tone="rose" className="mb-5 !px-3.5 !py-1.5">
            <Bolt size={13} /> Now delivering in 60 minutes across 9 cities
          </Badge>

          <h1 className="font-display text-[38px] font-bold leading-[1.08] tracking-tight text-ink sm:text-[52px] lg:text-[58px]">
            Make Every Moment
            <br />
            Special
          </h1>

          <p className="mt-5 max-w-lg text-[17px] leading-relaxed text-ink-soft">
            Beautiful gifts, delivered exactly when you need them. Tell us where you are and we'll show you
            only what can genuinely reach you.
          </p>

          {/* The primary CTA of the entire product. */}
          <div id="find-gifts" className="mt-8 max-w-lg scroll-mt-32">
            {serviceable ? (
              <div className="rounded-2xl border border-rose-100 bg-white/80 p-5 shadow-soft backdrop-blur">
                <p className="flex items-center gap-2 text-[15px] font-bold text-ink">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#EAF7F0] text-[#1F6B45]">
                    <Check size={14} />
                  </span>
                  Great! We deliver to {pincode}
                </p>
                <p className="mt-1 pl-8 text-sm text-ink-muted">
                  {info.area}, {info.city} · {info.sellerCount} local seller{info.sellerCount === 1 ? '' : 's'} near you
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  {info.tiers?.map((t) => (
                    <a
                      key={t.tier}
                      href={`#tier-${t.tier}`}
                      className="group rounded-xl border border-line bg-white px-3 py-2 transition hover:border-rose-200 hover:shadow-soft"
                    >
                      <span className="block text-[11px] font-bold uppercase tracking-wide text-rose-600">
                        {t.badge}
                      </span>
                      <span className="block text-[11px] text-ink-muted">{t.productCount} gifts</span>
                    </a>
                  ))}
                </div>

                <button onClick={openPicker} className="mt-4 text-xs font-semibold text-rose-600 hover:underline">
                  Change PIN code
                </button>
              </div>
            ) : (
              <form onSubmit={onSubmit} className="rounded-2xl border border-rose-100 bg-white/80 p-2 shadow-soft backdrop-blur sm:flex sm:items-center sm:gap-2">
                <div className="relative flex-1">
                  <MapPin size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-rose-400" />
                  <input
                    inputMode="numeric"
                    maxLength={6}
                    value={pinInput}
                    onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
                    placeholder="Enter your PIN code"
                    className="w-full rounded-xl border-0 bg-transparent py-3.5 pl-11 pr-4 text-[15px] text-ink placeholder:text-ink-faint focus:outline-none"
                  />
                </div>
                <button type="submit" disabled={checking} className="btn-primary mt-2 w-full !py-3.5 sm:mt-0 sm:w-auto">
                  {checking ? <Spinner size={16} /> : <Search size={16} />}
                  Find Gifts Near Me
                </button>
              </form>
            )}

            {error && !serviceable && (
              <p className="mt-3 rounded-xl bg-white/70 px-4 py-2.5 text-sm font-medium text-[#B3261E]">{error}</p>
            )}
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-[13px] text-ink-muted">
            <span className="flex items-center gap-1.5"><Check size={14} className="text-rose-500" /> 500+ local sellers</span>
            <span className="flex items-center gap-1.5"><Check size={14} className="text-rose-500" /> Live order tracking</span>
            <span className="flex items-center gap-1.5"><Check size={14} className="text-rose-500" /> Free next-day delivery</span>
          </div>
        </div>

        {/* Hero collage */}
        <div className="relative hidden lg:block">
          <div className="relative mx-auto h-[440px] w-full max-w-md">
            <div className="absolute left-0 top-6 h-56 w-44 rotate-[-6deg] overflow-hidden rounded-3xl border-4 border-white shadow-lift">
              <Img src="https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=600&q=80" alt="Chocolate gift box" icon="chocolates" seed="hero-a" className="h-full w-full object-cover" />
            </div>
            <div className="absolute right-2 top-0 h-64 w-48 rotate-[5deg] overflow-hidden rounded-3xl border-4 border-white shadow-lift">
              <Img src="https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=600&q=80" alt="Flower bouquet" icon="flowers" seed="hero-b" className="h-full w-full object-cover" />
            </div>
            <div className="absolute bottom-4 left-10 h-60 w-52 rotate-[3deg] overflow-hidden rounded-3xl border-4 border-white shadow-lift">
              <Img src="https://images.unsplash.com/photo-1535254973040-607b474cb50d?w=600&q=80" alt="Celebration cake" icon="cakes" seed="hero-c" className="h-full w-full object-cover" />
            </div>

            {/* Floating delivery proof */}
            <div className="absolute bottom-16 right-0 flex items-center gap-2.5 rounded-2xl border border-line bg-white/95 px-4 py-3 shadow-lift backdrop-blur">
              <span className="relative flex h-9 w-9 items-center justify-center rounded-full bg-rose-500 text-white">
                <Bolt size={17} />
                <span className="absolute inset-0 animate-pulse-ring rounded-full bg-rose-400" />
              </span>
              <span>
                <span className="block text-[11px] font-bold uppercase tracking-wide text-rose-600">Delivered</span>
                <span className="block text-[13px] font-semibold text-ink">in 47 minutes</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* --------------------------- Tier sections ----------------------------- */

function TierSections({ feed, pincode, openPicker }) {
  if (!pincode) {
    return (
      <EmptyState
        icon="location"
        title="Tell us where to deliver"
        message="Enter your PIN code and we'll group every gift by how fast it can reach you — from 60 minutes to a few days."
        action={<button onClick={openPicker} className="btn-primary">Enter your PIN code</button>}
      />
    );
  }

  if (!feed?.groups?.length) {
    return (
      <EmptyState
        icon="warning"
        title={`We're not in ${pincode} yet`}
        message="We're expanding quickly. Try a nearby PIN code, or check our delivery areas."
        action={
          <div className="flex gap-2">
            <button onClick={openPicker} className="btn-primary">Try another PIN code</button>
            <Link to="/delivery-areas" className="btn-ghost">See delivery areas</Link>
          </div>
        }
      />
    );
  }

  return (
    <div className="space-y-16">
      {feed.groups.map((group) => (
        <section key={group.tier} id={`tier-${group.tier}`} className="scroll-mt-40">
          <SectionHeader
            eyebrow={group.tier === 'EXPRESS_60' ? 'Fastest near you' : undefined}
            title={
              <span className="flex flex-wrap items-center gap-2.5">
                <span className="text-rose-500"><TierIcon tier={group.tier} size={22} /></span>
                <span>{group.label}</span>
                <span className="rounded-full bg-blush px-2.5 py-1 text-xs font-semibold text-ink-muted">
                  {group.count} gifts
                </span>
              </span>
            }
            subtitle={`${group.tagline} · ${group.eta}`}
            action={
              <Link to={`/gifts?tier=${group.tier}`} className="btn-ghost btn-sm">
                See all {group.count} <ChevronRight size={14} />
              </Link>
            }
          />
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {group.products.slice(0, 4).map((p) => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>
          {group.products.length > 4 && (
            <div className="mt-4 hidden grid-cols-4 gap-4 xl:grid">
              {group.products.slice(4, 8).map((p) => (
                <ProductCard key={p._id} product={p} />
              ))}
            </div>
          )}
        </section>
      ))}
    </div>
  );
}

/* --------------------------- Supporting blocks -------------------------- */

function ReminderStrip({ reminders }) {
  const r = reminders[0];
  return (
    <div className="border-b border-rose-100 bg-rose-50">
      <div className="container-app flex flex-wrap items-center gap-3 py-3">
        <span className="text-rose-500"><Balloon size={20} /></span>
        <p className="flex-1 text-sm font-medium text-ink">{r.message}</p>
        <Link to="/gifts" className="btn-primary btn-sm">Find a gift</Link>
        <Link to="/account/reminders" className="text-xs font-semibold text-rose-600 hover:underline">
          Manage reminders
        </Link>
      </div>
    </div>
  );
}

function LocalSellers({ sellers, pincode }) {
  return (
    <section>
      <SectionHeader
        eyebrow="Close to you"
        title={pincode ? `Local sellers near ${pincode}` : 'Meet our local sellers'}
        subtitle="Real bakers, florists and makers in your neighbourhood — not a warehouse three states away."
        action={<Link to="/sellers" className="btn-ghost btn-sm">All sellers <ChevronRight size={14} /></Link>}
      />
      <div className="hide-scrollbar -mx-4 flex gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-4">
        {sellers.map((s) => (
          <Link
            key={s._id}
            to={`/store/${s.slug}`}
            className="group w-64 shrink-0 rounded-xl2 border border-line bg-white p-5 transition hover:-translate-y-0.5 hover:border-rose-200 hover:shadow-lift sm:w-auto"
          >
            <div className="flex items-start justify-between gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-rose-100 to-gold-50 text-rose-500">
                <Store size={22} />
              </span>
              <Rating value={s.rating} count={s.reviewCount} />
            </div>
            <h3 className="mt-3.5 text-[15px] font-bold leading-snug text-ink transition group-hover:text-rose-600">
              {s.businessName}
            </h3>
            <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-ink-muted">{s.tagline}</p>
            <p className="mt-3 flex items-center gap-1.5 text-[11px] font-medium text-ink-faint">
              <MapPin size={11} />
              {s.address?.city} · {s.deliveryRadiusKm} km radius
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}

const STEPS = [
  { n: '01', icon: 'location', title: 'Enter your PIN code', body: 'We check which sellers are open, stocked and close enough to reach you.' },
  { n: '02', icon: 'gift', title: 'Pick a gift that fits', body: 'Every gift is labelled with how fast it can actually arrive — 60 minutes to 3 days.' },
  { n: '03', icon: 'personalise', title: 'Make it personal', body: 'Add a message, a photo, gift wrap and a card. Choose the exact delivery slot.' },
  { n: '04', icon: 'truck', title: 'Track it to their door', body: 'Watch it move from the seller to the rider to the moment it lands.' },
];

function HowItWorksStrip() {
  return (
    <section className="rounded-4xl border border-line bg-white p-6 sm:p-10">
      <SectionHeader
        eyebrow="How it works"
        title="Four steps, one very good day"
        subtitle="Fast, local, personal and reliable — the whole point of Upahaar."
      />
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map((s) => (
          <div key={s.n} className="relative rounded-2xl bg-blush p-5">
            <span className="absolute right-4 top-4 font-display text-3xl font-bold text-rose-200">{s.n}</span>
            <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-white text-rose-500 shadow-soft">
              {(() => { const I = resolveIcon(s.icon); return <I size={20} />; })()}
            </span>
            <h3 className="text-[15px] font-bold text-ink">{s.title}</h3>
            <p className="mt-1.5 text-[13px] leading-relaxed text-ink-muted">{s.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function ReviewWall({ reviews }) {
  return (
    <section>
      <SectionHeader
        eyebrow="Real orders, real people"
        title="What our customers say"
        subtitle="Every review below is tied to a delivered order."
      />
      <div className="hide-scrollbar -mx-4 flex gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-3">
        {reviews.map((r) => (
          <figure key={r._id} className="w-80 shrink-0 rounded-xl2 border border-line bg-white p-6 sm:w-auto">
            <div className="mb-3 flex gap-0.5 text-gold-400">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} size={15} filled={i < r.productRating} className={i < r.productRating ? '' : 'text-line'} />
              ))}
            </div>
            <blockquote className="font-display text-[15px] font-semibold leading-snug text-ink">"{r.title}"</blockquote>
            <p className="mt-2.5 line-clamp-4 text-[13px] leading-relaxed text-ink-muted">{r.comment}</p>
            <figcaption className="mt-4 flex items-center gap-2.5 border-t border-line pt-4">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-100 text-[11px] font-bold text-rose-700">
                {r.userName?.slice(0, 1)}
              </span>
              <span>
                <span className="block text-[13px] font-semibold text-ink">{r.userName}</span>
                <span className="block text-[11px] text-ink-faint">Verified purchase</span>
              </span>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}

function GiftReminderCta({ user }) {
  return (
    <section className="overflow-hidden rounded-4xl bg-ink px-6 py-12 text-white sm:px-12">
      <div className="grid items-center gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        <div>
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-rose-300">Never forget again</p>
          <h2 className="font-display text-3xl font-semibold leading-tight sm:text-4xl">
            Set a gift reminder.
            <br />
            We'll nudge you before it matters.
          </h2>
          <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-white/70">
            Save the birthdays and anniversaries you can't afford to miss. We'll message you a week ahead with
            ideas that can still arrive in time.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link to={user ? '/account/reminders' : '/signup'} className="btn bg-white text-ink hover:bg-rose-50">
              <Calendar size={16} /> {user ? 'Manage reminders' : 'Set a reminder'}
            </Link>
            <Link to="/how-it-works" className="btn border border-white/20 text-white hover:bg-white/10">
              How it works
            </Link>
          </div>
        </div>

        <div className="space-y-3">
          {[
            { icon: 'birthday', title: "Mom's Birthday", date: '14 September', days: 'in 24 days' },
            { icon: 'anniversary', title: 'Anniversary', date: '20 October', days: 'in 60 days' },
          ].map((r) => (
            <div key={r.title} className="flex items-center gap-4 rounded-2xl bg-white/10 p-4 backdrop-blur">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/15 text-rose-200">
                {(() => { const I = resolveIcon(r.icon); return <I size={20} />; })()}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-bold">{r.title}</span>
                <span className="block text-xs text-white/60">{r.date}</span>
              </span>
              <span className="shrink-0 rounded-full bg-rose-500 px-2.5 py-1 text-[11px] font-bold">{r.days}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
