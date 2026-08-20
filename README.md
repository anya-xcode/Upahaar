# Upahaar

**Don't just send a gift. Send a moment.**

A location-first gifting marketplace for India. The customer enters a PIN code, and the entire
catalogue rearranges itself around what can genuinely reach them — grouped by how fast it can get
there: **60 Minutes**, **3 Hours**, **Tomorrow**, **2–3 Days**.

Three roles, three portals: **Customer**, **Seller**, **Admin**.

---

## Quick start

Requires **Node 18+** and a **MongoDB** instance (local or Atlas).

```bash
npm run install:all     # installs root, server and client dependencies
cp server/.env.example server/.env   # then set MONGO_URI if it isn't local
npm run seed            # ~85 products, 17 sellers, 78 PIN codes, 140 orders
npm run dev             # API on :5001, storefront on :5173
```

Open **http://localhost:5173**, enter PIN code **400001**, and the four delivery tiers populate.

### Demo accounts

| Role | Email | Password | Where |
|---|---|---|---|
| Customer | `ananya@upahaar.test` | `Test@123` | `/login` |
| Seller | `seller@upahaar.test` | `Test@123` | `/seller/login` |
| Admin | `admin@upahaar.test` | `Admin@123` | `/admin/login` |

Other seeded customers (`rohan@`, `sanya@`, `arjun@`, `meher@`, `kabir@upahaar.test`) and sellers
(`cocoa@`, `petal@`, `hamper@`, `cakecraft@`, `priya@`, `teddy@`, …) all use `Test@123`.

Seeded PIN codes with depth across all four tiers: **400001** (Mumbai), **110001** (Delhi),
**560038** (Bengaluru), **411004** (Pune), **700016** (Kolkata), **600017** (Chennai).

---

## The availability engine

This is the part worth reading first: [`server/src/services/deliveryEngine.js`](server/src/services/deliveryEngine.js).

A delivery promise is only worth something if it holds, so a tier is **computed per product, per
PIN code, at request time** — never stored on a record. For each product the engine combines:

1. **Seller coverage** — does the seller list this PIN code?
2. **Distance** — haversine between seller and PIN code, against the seller's radius
3. **Stock** — out-of-stock items disappear rather than disappoint
4. **Working hours** — closed now? the clock starts when they next open
5. **Preparation time** — set per product by the seller, plus the store's dispatch buffer
6. **Rider availability** — a zone with nobody on shift can't do express

The resulting ETA is bucketed into a tier, then **downgraded** by whichever constraint is worst:
the seller's own promise for that product, and the admin's per-PIN-code configuration. Turning off
`express60Available` for an area in the admin panel removes the 60-minute badge from the storefront
immediately.

Out-of-area products fall through to 2–3 day shipping — unless they're perishable, in which case
they simply aren't offered.

```
Customer enters 400001
   └─ Pincode serviceable? ──no──> "We don't deliver here yet"
       └─ For each product:
           seller covers pincode? ──no──> perishable? ──yes──> hidden
           │                                          └─no───> 2–3 days
           └─yes─> wait-for-open + prep + dispatch + travel = ETA
                   └─ tier = worst(ETA bucket, product's promise, ops config)
```

---

## Architecture

```
Upahaar/
├── server/                     Express + Mongoose API
│   └── src/
│       ├── models/             22 Mongoose models
│       ├── services/           deliveryEngine · catalog · cart · coupon · notification
│       ├── controllers/        auth · product · location · cart · order · account
│       │                       review · seller · admin · adminCms · catalog
│       ├── routes/             auth · public · customer · seller · admin
│       ├── middleware/         JWT auth, role gates, error normalisation
│       └── seed/               seed.js + realistic demo data
└── client/                     React 18 + Vite + Tailwind
    └── src/
        ├── components/         common (ui, icons, panel kit) · layout · customer
        ├── pages/              customer/ (+account) · auth · seller · admin
        ├── store/              zustand: auth · location · shop · toast
        └── lib/                axios instance, formatters
```

**Stack:** React 18, Vite 6, Tailwind 3, React Router 6, Zustand, Axios, Recharts ·
Node, Express 4, MongoDB, Mongoose 8, JWT, bcrypt.

### Design system

Light premium: a warm cream ground, rose primary, muted gold accent and deep plum ink, with
Fraunces for display type and Plus Jakarta Sans for text.

The interface is **icon-led, not emoji-led**. Every glyph is a hand-drawn inline SVG on a 24×24
grid with a consistent 1.7 stroke, living in
[`client/src/components/common/Icons.jsx`](client/src/components/common/Icons.jsx).

The API never dictates presentation — it sends stable keys (`'cakes'`, `'EXPRESS_60'`,
`'DELIVERED'`, `'kyc'`) and [`client/src/lib/glyphs.jsx`](client/src/lib/glyphs.jsx) maps them to
components. That registry is the single place a glyph is chosen, so the storefront, seller panel and
admin panel can never drift apart, and re-skinning a category is a one-line change.

```jsx
<EmptyState icon="search" … />          // generic UI key
<CategoryGlyph category={c} />          // category slug → Cake, Flower, Chocolate …
<TierIcon tier="EXPRESS_60" />          // delivery tier → Bolt, Clock, Package, Calendar
<NotificationGlyph icon={n.icon} />     // API notification key → glyph
```

### Role-based access

Three separate route groups, each with its own guard. Panels are mounted **before** the storefront
so a seller request is handled by the seller router rather than falling through customer-only
middleware.

- Customers cannot reach `/api/seller/*` or `/api/admin/*` (403)
- Sellers resolve `req.seller` from their **token**, never from a body-supplied id — a seller
  cannot read or write another store
- Admins sign in through a **separate endpoint** (`/api/auth/admin/login`); admin credentials are
  rejected by the storefront login

### Data integrity

- Prices, availability and coupons are **recomputed server-side at checkout** — nothing the client
  says about money is trusted
- Order line items **snapshot** name and price, so a later seller edit never rewrites history
- Stock changes are written to an append-only `InventoryLog` with a reason
- Sellers can only move an order **one step forward** at a time
- Products attached to live orders are **retired, not deleted**

---

## What's implemented

**Customer** — PIN-code discovery, tier-grouped homepage (17 sections), search with typeahead,
filter rail (delivery time, price, category, occasion, rating, seller, personalisation) and six
sort orders, product detail with personalisation + photo + delivery slot, cart, four-step checkout
(address, delivery option, gift options, payment), order confirmation, live tracking timeline,
and a full account area: orders, wishlist, gift reminders, addresses, coupons, payment methods,
reviews, notifications, profile.

**Seller** — dashboard with revenue chart and stock alerts, product CRUD with variants and
per-product delivery capability, inventory with quick adjust and stock ledger, order queue with a
one-step-forward state machine, reviews, payouts, and a store/delivery settings page (PIN codes,
radius, hours, dispatch buffer, express toggle, KYC).

**Admin** — dashboard, analytics (daily/monthly revenue, orders by category, location and tier,
seller leaderboard), seller approval + KYC + commission, PIN-code manager with inline tier toggles
and delivery zones, orders and refunds, product moderation, review moderation, coupons, CMS
(banners, categories, occasions, FAQs, blog/gift guides), broadcasts and payouts.

---

## Going live

The app runs fully today with these three integrations stubbed. Each is isolated to one place:

| Integration | Today | To enable |
|---|---|---|
| **Razorpay** | Checkout writes a `Payment` with `gateway: 'simulated'` | Add keys to `server/.env`; `Payment` already has `razorpayOrderId/PaymentId/Signature` fields |
| **Cloudinary** | Images are URLs typed into the seller form | Add keys; swap the URL input for an upload widget |
| **Google Maps** | Address form captures text; `location.lat/lng` is on the schema | Add key; wire a place picker into the checkout address form |
| **Email / SMS / WhatsApp** | In-app inbox via `notificationService` | Add a transport inside `dispatch()` — every notification already flows through it |

Deployment: client → Vercel (`npm run build`), server → Render/Railway/AWS (`npm start`),
database → MongoDB Atlas. Set `CLIENT_ORIGIN` on the server and point the client at the API host.

---

## Scripts

| Command | What it does |
|---|---|
| `npm run install:all` | Install root + server + client |
| `npm run seed` | Wipe and reseed the database |
| `npm run dev` | Run API and client together |
| `npm run dev:server` / `dev:client` | Run one side only |
| `npm run build` | Production build of the client |
| `npm start` | Production API |

---

## Notes

- Seed imagery is **stock photography from Unsplash**, assigned by category — the photos are
  representative, not exact matches for each product name. Replace with real shots via Cloudinary.
- Order confirmation and tracking include an **"Advance status (demo)"** button so the timeline can
  be walked through without a seller on the other end. It is disabled when `NODE_ENV=production`.
- The catalogue query narrows in MongoDB, then classifies availability in memory — correct and fast
  at demo scale. Past a few thousand active products, precompute a seller × PIN-code coverage
  collection; the seam for that is `queryProducts` in `catalogService.js`.
