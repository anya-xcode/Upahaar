import { Link } from 'react-router-dom';
import { Badge } from '../../components/common/ui.jsx';
import { ChevronRight, Check, Store, Chart, Truck, Rupee } from '../../components/common/Icons.jsx';

const BENEFITS = [
  { Icon: Truck, title: 'Customers who want it today', body: 'Upahaar sends you buyers in your own delivery radius, ready to pay for speed.' },
  { Icon: Chart, title: 'A real dashboard', body: 'Live orders, revenue, inventory alerts and ratings — not a spreadsheet emailed weekly.' },
  { Icon: Rupee, title: 'Clear commission', body: 'A flat percentage per order, shown on every line. Payouts settle on a fixed cycle.' },
  { Icon: Store, title: 'You set the rules', body: 'Your PIN codes, your radius, your working hours, your preparation times — per product.' },
];

const STEPS = [
  { n: '01', title: 'Create your seller account', body: 'Business name, owner details, and the area you serve.' },
  { n: '02', title: 'Add your delivery capability', body: 'PIN codes covered, delivery radius, working hours and dispatch buffer.' },
  { n: '03', title: 'Upload KYC', body: 'GST, PAN and a shop licence. Most stores are approved within two working days.' },
  { n: '04', title: 'List your gifts', body: 'Set price, stock, preparation time and the delivery tier you can promise.' },
];

export default function SellWithUs() {
  return (
    <div>
      <section className="border-b border-line bg-gradient-to-br from-rose-50 via-blush to-gold-50 py-16">
        <div className="container-app grid items-center gap-10 lg:grid-cols-2">
          <div>
            <Badge tone="rose" className="mb-5">Sell on Upahaar</Badge>
            <h1 className="font-display text-4xl font-semibold leading-tight text-ink sm:text-5xl">
              Your shop, everyone's
              <br />
              favourite gift
            </h1>
            <p className="mt-5 max-w-lg text-[17px] leading-relaxed text-ink-soft">
              If you bake, arrange, craft or curate — Upahaar puts you in front of people a few kilometres away
              who need something beautiful, today.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/seller/signup" className="btn-primary !py-3.5">
                Start selling <ChevronRight size={16} />
              </Link>
              <Link to="/seller/login" className="btn-ghost !py-3.5">Seller login</Link>
            </div>

            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-[13px] text-ink-muted">
              <span className="flex items-center gap-1.5"><Check size={14} className="text-rose-500" /> No listing fee</span>
              <span className="flex items-center gap-1.5"><Check size={14} className="text-rose-500" /> Commission from 10%</span>
              <span className="flex items-center gap-1.5"><Check size={14} className="text-rose-500" /> Approval in 2 days</span>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {[
              ['500+', 'Active sellers'],
              ['9', 'Cities live'],
              ['47 min', 'Average express delivery'],
              ['4.7', 'Average seller rating'],
            ].map(([value, label]) => (
              <div key={label} className="rounded-2xl bg-white/80 p-6 text-center backdrop-blur">
                <p className="font-display text-3xl font-bold text-rose-500">{value}</p>
                <p className="mt-1 text-[12px] font-semibold uppercase tracking-wide text-ink-muted">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="container-app space-y-20 py-16">
        <section>
          <div className="mb-10 text-center">
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-rose-500">Why Upahaar</p>
            <h2 className="font-display text-3xl font-semibold text-ink">Built for local sellers</h2>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {BENEFITS.map(({ Icon, title, body }) => (
              <div key={title} className="rounded-xl2 border border-line bg-white p-6">
                <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-rose-50 text-rose-500">
                  <Icon size={22} />
                </span>
                <h3 className="text-[15.5px] font-bold text-ink">{title}</h3>
                <p className="mt-2 text-[13.5px] leading-relaxed text-ink-muted">{body}</p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <div className="mb-10 text-center">
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-rose-500">Getting started</p>
            <h2 className="font-display text-3xl font-semibold text-ink">Live in four steps</h2>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s) => (
              <div key={s.n} className="relative rounded-xl2 bg-blush p-6">
                <span className="absolute right-5 top-5 font-display text-4xl font-bold text-rose-200">{s.n}</span>
                <h3 className="mt-8 text-[15.5px] font-bold text-ink">{s.title}</h3>
                <p className="mt-2 text-[13.5px] leading-relaxed text-ink-muted">{s.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-4xl bg-ink px-6 py-12 text-center text-white sm:px-12">
          <h2 className="font-display text-3xl font-semibold">Ready when you are</h2>
          <p className="mx-auto mt-3 max-w-lg text-[15px] text-white/70">
            Set up your store in a few minutes. You can list products while your KYC is being reviewed.
          </p>
          <Link to="/seller/signup" className="btn mt-7 bg-white text-ink hover:bg-rose-50">
            Create a seller account <ChevronRight size={15} />
          </Link>
        </section>
      </div>
    </div>
  );
}
