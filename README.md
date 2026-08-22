# Upahaar

**Don't just send a gift. Send a moment.**

A location-first gifting marketplace for India. The customer enters a PIN code, and the entire
catalogue rearranges itself around what can genuinely reach them — grouped by how fast it can get
there: **60 Minutes**, **3 Hours**, **Tomorrow**, **2–3 Days**.

Three roles, three portals: **Customer**, **Seller**, **Admin**.

---

## Setup

### 1. Prerequisites

| | Version | Check with |
|---|---|---|
| **Node.js** | 18 or newer (built on 22) | `node -v` |
| **npm** | 9 or newer | `npm -v` |
| **MongoDB** | 6 or newer — local, or a free Atlas cluster | `mongod --version` |
| **Git** | any recent version | `git --version` |

<details>
<summary><strong>Don't have MongoDB?</strong> Two options</summary>

**Option A — local install (no account needed)**

- **Windows:** download MongoDB Community Server from
  [mongodb.com/try/download/community](https://www.mongodb.com/try/download/community) and install
  it. Tick *"Install MongoDB as a Service"* so it starts automatically.
- **macOS:** `brew tap mongodb/brew && brew install mongodb-community && brew services start mongodb-community`
- **Linux:** follow the
  [official guide](https://www.mongodb.com/docs/manual/administration/install-on-linux/), then
  `sudo systemctl start mongod`

Verify it's listening on the default port:

```bash
# Windows (PowerShell)
Get-Service MongoDB

# macOS / Linux
mongosh --eval "db.runCommand({ ping: 1 })"
```

**Option B — MongoDB Atlas (cloud, free tier)**

Create a free cluster at [mongodb.com/atlas](https://www.mongodb.com/atlas), add your IP under
*Network Access*, create a database user, then copy the connection string. You'll paste it into
`MONGO_URI` in step 3.

</details>

### 2. Clone and install

```bash
git clone https://github.com/anya-xcode/Upahaar.git
cd Upahaar
npm run install:all
```

`install:all` installs three package trees — root (dev tooling), `server/` and `client/`. It takes
a minute or two on a first run.

### 3. Configure the server

Copy the example env file and adjust it if you need to:

```bash
# macOS / Linux
cp server/.env.example server/.env

# Windows (PowerShell)
Copy-Item server/.env.example server/.env
```

The defaults work as-is for a local MongoDB. Only two lines usually need attention:

```ini
PORT=5001                                       # change if 5001 is taken
MONGO_URI=mongodb://127.0.0.1:27017/upahaar     # or your Atlas connection string
JWT_SECRET=change_me_to_a_long_random_string    # set a real secret before deploying
```

> **Why 5001 and not 5000?** On Windows, port 5000 is often already claimed (AirPlay does the same
> on macOS). If you change `PORT`, also update the proxy target in
> [`client/vite.config.js`](client/vite.config.js) so the client keeps reaching the API.

`server/.env` is gitignored — your secrets never leave your machine.

### 4. Seed the database

```bash
npm run seed
```

This **wipes and repopulates** the `upahaar` database with 153 PIN codes (86 of them Delhi), 25
sellers, 117 products, 140 orders with payments and commissions, plus reviews, coupons and
notifications — so the app looks like a working marketplace the first time you open it. Re-run it
any time to get back to a clean state.

### 5. Run it

```bash
npm run dev
```

That starts both processes together:

| | URL |
|---|---|
| Storefront (Vite) | **http://localhost:5173** |
| API (Express) | **http://localhost:5001** |

Open **http://localhost:5173**, enter PIN code **110016** (Hauz Khas), and the delivery tiers populate.

To run just one side: `npm run dev:server` or `npm run dev:client`.

### 6. Verify it's working

```bash
curl "http://localhost:5001/api/health"
curl "http://localhost:5001/api/location/check?pincode=110016"
```

The second should report `"serviceable": true` with a tier breakdown.

### 7. Sign in

| Role | Email | Password | Sign in at |
|---|---|---|---|
| Customer | `ananya@upahaar.test` | `Test@123` | `/login` |
| Seller | `chandnichowk@upahaar.test` | `Test@123` | `/seller/login` |
| Admin | `admin@upahaar.test` | `Admin@123` | `/admin/login` |

Other seeded customers (`rohan@`, `sanya@`, `arjun@`, `meher@`, `kabir@upahaar.test`) and sellers
(`cocoa@`, `petal@`, `hamper@`, `cakecraft@`, `priya@`, `teddy@`, …) all use `Test@123`. The login
screens list the demo credentials too, so you can fill them in with one click.

Delhi is the launch market — see [Delhi coverage](docs/delhi-coverage.md) for all 86 PIN codes,
their fastest tier and which sellers reach them. Good PIN codes to try: **110016** (Hauz Khas),
**110006** (Chandni Chowk), **110091** (Mayur Vihar), **110075** (Dwarka), **110040** (Narela,
next-day only). Other cities remain seeded as expansion markets.

---

## Troubleshooting

<details>
<summary><strong>"Could not start the API" / MongoDB connection error</strong></summary>

MongoDB isn't running, or `MONGO_URI` is wrong.

```bash
# Windows — start the service
net start MongoDB

# macOS
brew services start mongodb-community

# Linux
sudo systemctl start mongod
```

On Atlas, check that your current IP is allowed under *Network Access*, and that the password in
the connection string is URL-encoded if it contains special characters.
</details>

<details>
<summary><strong><code>EADDRINUSE: address already in use :::5001</code></strong></summary>

Something else holds the port — often a previous run that didn't shut down.

```bash
# Windows (PowerShell)
Get-NetTCPConnection -LocalPort 5001 -State Listen | Select-Object OwningProcess
Stop-Process -Id <pid> -Force

# macOS / Linux
lsof -ti:5001 | xargs kill -9
```

Or just set a different `PORT` in `server/.env` (and match it in `client/vite.config.js`).
</details>

<details>
<summary><strong>The homepage is empty / no gifts show up</strong></summary>

Either you haven't entered a PIN code, or the database isn't seeded. Use **110016** and run
`npm run seed`. Availability is computed live — a PIN code with no sellers in range genuinely has
nothing to show, which is the intended behaviour.

Note that tiers degrade outside seller trading hours: after roughly 22:00 IST every Delhi store is
shut, so gifts correctly show "tomorrow" rather than 60 minutes.
</details>

<details>
<summary><strong>Login fails with the demo accounts</strong></summary>

Passwords are hashed at seed time, so run `npm run seed` at least once. Note the admin signs in at
`/admin/login`, not `/login` — storefront login deliberately rejects admin credentials.
</details>

<details>
<summary><strong>Product images don't load</strong></summary>

Seed imagery is hot-linked from Unsplash, so it needs an internet connection. Offline, every image
falls back to a branded gradient tile with the category glyph — nothing breaks.
</details>

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
Customer enters 110016
   └─ Pincode serviceable? ──no──> "We don't deliver here yet"
       └─ For each product:
           seller covers pincode? ──no──> perishable? ──yes──> hidden
           │                                          └─no───> 2–3 days
           └─yes─> wait-for-open + prep + dispatch + travel = ETA
                   └─ tier = worst(ETA bucket, product's promise, ops config)
```

---

## Product approval

A seller can create and edit freely, but **nothing reaches a customer until an admin approves it**.

```
Seller uploads  →  approvalStatus: PENDING  →  admin reviews  →  APPROVED → live
                                                             ↘  REJECTED + reason → back to seller
```

- The storefront requires `isActive && approvalStatus === 'APPROVED'` — enforced in
  `catalogService`, product detail, search typeahead, pincode serviceability and wishlist
  rehydration, so there is no surface that leaks an unreviewed product.
- A **PENDING** or **REJECTED** product stays fully visible to its own seller, with the rejection
  reason shown against it.
- Rejecting **requires a reason**; the seller is notified with it.
- Editing **price, stock or delivery settings keeps approval**. Editing **name, description,
  images or highlights re-opens review** — the product drops off the storefront until it is
  approved again. Re-reviewing routine price changes would make trading painful for no safety gain.
- A seller cannot set their own `approvalStatus`; the field is stripped from seller updates.

Admin: **Products → Awaiting review** (`/admin/products?approval=PENDING`), also surfaced as a
dashboard tile and a badge on the Products nav item.
Seller: approval state per row in **Products**, and a dashboard tile when something is in review.

---

## Launch market: Delhi

Delhi is the market we are opening in, so it carries full coverage — **86 PIN codes across 11
districts**, served by **8 launch sellers**, defined in
[`server/src/seed/data/delhi.js`](server/src/seed/data/delhi.js) and
[`delhiSellers.js`](server/src/seed/data/delhiSellers.js).

| Fastest tier | PIN codes | Where |
|---|---|---|
| 60 minutes | 41 | Dense inner Delhi — CP, Chandni Chowk, South Delhi, Punjabi Bagh, trans-Yamuna |
| 3 hours | 38 | Wider urban Delhi — Dwarka, Rohini, Vasant Kunj, Najafgarh |
| Next day | 7 | Outer belt — Narela, Bawana, Alipur, Karawal Nagar |

Every Delhi PIN code has at least one seller within delivery radius, so nothing falls back to
courier-only shipping. [`docs/delhi-coverage.md`](docs/delhi-coverage.md) lists them district by
district and flags where a second seller would add the most resilience — regenerate it with
`npm run docs:delhi`.

The other eight cities stay seeded as expansion markets. To run **Delhi-only**, set
`LAUNCH_MARKETS` in [`server/src/seed/data/locations.js`](server/src/seed/data/locations.js) to
`['Delhi']` and reseed — sellers, PIN codes and zones outside the list are dropped automatically.

> Tiers are a **ceiling**, not a promise. The live tier is computed per gift from seller distance,
> stock, working hours and preparation time — so a 60-minute area correctly shows "tomorrow" once
> its sellers have closed for the night.

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

## Scale and maintenance

### How the catalogue query scales

A tier depends on (product, seller, pincode, clock), which no Mongo filter can
express — but *deliverability* almost entirely can. For any pincode the catalogue
splits in two:

| | What it is | How it is handled |
|---|---|---|
| **LOCAL** | Sellers covering the pincode, inside their radius | Bounded by that seller set — loaded and classified |
| **SHIPPED** | Everything else non-perishable | Always `STANDARD_2_3D`, so counted, sorted and paged **inside Mongo** |

The halves are merged as two sorted streams, reading only as deep as the
requested page. Measured at 5,000 products in one city:

| | Before | After |
|---|---|---|
| Homepage feed | 110 ms | **64 ms** |
| Listing | 37 ms | 65 ms |
| PIN code check | 56 ms | **41 ms** |
| Products actually considered | **105 of 457** | **457 of 457** |

The listing got slower because it got *correct*: an internal `.limit(600)` used
to silently truncate the catalogue, so the old number was fast and wrong. The
homepage got faster because the feed ran four independent scans of the same
local set and now runs one (`buildFeed`).

Also in place: compound indexes shaped to those two query halves, and a small
TTL cache (`utils/cache.js`) over pincode and seller-coverage lookups, which sit
on every catalogue request and change a few times a day.

**The next order of magnitude** is a precomputed seller×pincode coverage
collection. The seam is `loadLocal` in `catalogService.js`; it logs a warning if
the local scan cap is ever reached rather than truncating silently.

### Maintenance

```bash
npm run verify      # lint + test + build — what CI runs
npm run lint        # ESLint across both workspaces
npm run test        # 40 tests
```

- **40 tests.** `deliveryEngine.test.js` covers the engine as pure functions —
  every gate, every degradation path, with the clock pinned. `catalogue.test.js`
  runs against a real MongoDB (`upahaar_test`, dropped after) and covers
  visibility gates, tiers, filters, and pagination over a 900-product catalogue.
- **ESLint** is configured for the bug class that actually shipped here once: an
  identifier used but never imported, which Rollup compiles happily and the
  browser throws on. Zero errors; warnings are advisory.
- **CI** runs lint, tests against a real Mongo service, the build, and checks the
  Delhi coverage map has been regenerated.
- Tier badge text lives once in `client/src/lib/glyphs.jsx` — six panel files
  used to each carry a copy.

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
| `npm run docs:delhi` | Regenerate the Delhi coverage map |
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
