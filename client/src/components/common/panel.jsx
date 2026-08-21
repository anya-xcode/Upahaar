import { useState } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { useAuth } from '../../store/authStore.js';
import { useShop } from '../../store/shopStore.js';
import { initials, inr, compact } from '../../lib/format.js';
import { Menu, Close, Logout, ChevronRight, Search, Gift } from './Icons.jsx';
import { resolveIcon } from '../../lib/glyphs.jsx';
import { Skeleton, EmptyState } from './ui.jsx';

/* ----------------------------- Chart palette ----------------------------- */

/**
 * One palette for every chart in both panels, so a colour always means the
 * same thing. Rose leads because it is the brand; the rest are chosen to stay
 * distinguishable on a light cream ground.
 */
export const CHART_COLORS = ['#DE4A75', '#CFA23C', '#5B8DEF', '#3FA97C', '#9B72CF', '#E27C48', '#4FB3C4', '#C4577E'];

const axisProps = {
  stroke: '#B5A8B0',
  fontSize: 11,
  tickLine: false,
  axisLine: false,
};

function ChartTooltip({ active, payload, label, formatter }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-line bg-white px-3.5 py-2.5 shadow-lift">
      <p className="mb-1 text-[11px] font-bold uppercase tracking-wide text-ink-faint">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} className="flex items-center gap-2 text-[13px] font-semibold text-ink">
          <span className="h-2 w-2 rounded-full" style={{ background: p.color || p.fill }} />
          {p.name}: {formatter ? formatter(p.value) : p.value}
        </p>
      ))}
    </div>
  );
}

export function RevenueChart({ data, height = 260, dataKey = 'revenue', xKey = 'date', label = 'Revenue' }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
        <defs>
          <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#DE4A75" stopOpacity={0.28} />
            <stop offset="100%" stopColor="#DE4A75" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#F2E6EA" vertical={false} />
        <XAxis
          dataKey={xKey}
          {...axisProps}
          tickFormatter={(v) => String(v).slice(5)}
          interval="preserveStartEnd"
          minTickGap={24}
        />
        <YAxis {...axisProps} tickFormatter={(v) => compact(v)} width={48} />
        <Tooltip content={<ChartTooltip formatter={(v) => inr(v)} />} />
        <Area type="monotone" dataKey={dataKey} name={label} stroke="#DE4A75" strokeWidth={2.5} fill="url(#revenueFill)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function BarsChart({ data, xKey, dataKey, height = 260, label = 'Orders', color = '#DE4A75', money = false }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#F2E6EA" vertical={false} />
        <XAxis dataKey={xKey} {...axisProps} interval={0} angle={data?.length > 6 ? -25 : 0} textAnchor={data?.length > 6 ? 'end' : 'middle'} height={data?.length > 6 ? 60 : 30} />
        <YAxis {...axisProps} tickFormatter={(v) => compact(v)} width={44} />
        <Tooltip cursor={{ fill: '#FFF4F6' }} content={<ChartTooltip formatter={(v) => (money ? inr(v) : v)} />} />
        <Bar dataKey={dataKey} name={label} fill={color} radius={[8, 8, 0, 0]} maxBarSize={48} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function DonutChart({ data, nameKey = 'name', dataKey = 'value', height = 260 }) {
  const total = data?.reduce((s, d) => s + (d[dataKey] || 0), 0) || 0;
  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row">
      <ResponsiveContainer width="100%" height={height} className="!w-full sm:!w-1/2">
        <PieChart>
          <Pie data={data} dataKey={dataKey} nameKey={nameKey} innerRadius="58%" outerRadius="88%" paddingAngle={2} stroke="none">
            {data?.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
          </Pie>
          <Tooltip content={<ChartTooltip />} />
        </PieChart>
      </ResponsiveContainer>

      <ul className="w-full space-y-2 sm:w-1/2">
        {data?.map((d, i) => (
          <li key={d[nameKey]} className="flex items-center gap-2.5 text-[13px]">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
            <span className="min-w-0 flex-1 truncate text-ink-soft">{d[nameKey]}</span>
            <span className="shrink-0 font-bold text-ink">{d[dataKey]}</span>
            <span className="w-10 shrink-0 text-right text-[11px] text-ink-faint">
              {total ? Math.round((d[dataKey] / total) * 100) : 0}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* -------------------------------- Widgets -------------------------------- */

export function StatCard({ icon: Icon, label, value, sub, tone = 'rose', to, loading }) {
  const tones = {
    rose: 'bg-rose-50 text-rose-600',
    gold: 'bg-gold-50 text-gold-600',
    green: 'bg-[#EAF7F0] text-[#1F6B45]',
    blue: 'bg-[#EAF3FF] text-[#2C5B93]',
    red: 'bg-[#FDECEC] text-[#B3261E]',
    ink: 'bg-blush text-ink',
  };

  const inner = (
    <>
      <div className="flex items-start justify-between gap-3">
        {Icon && (
          <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${tones[tone]}`}>
            <Icon size={19} />
          </span>
        )}
        {to && <ChevronRight size={16} className="text-ink-faint" />}
      </div>
      {loading ? (
        <Skeleton className="mt-4 h-8 w-20" />
      ) : (
        <p className="mt-4 font-display text-[28px] font-bold leading-none text-ink">{value}</p>
      )}
      <p className="mt-1.5 text-[13px] font-semibold text-ink">{label}</p>
      {sub && <p className="mt-0.5 text-[11.5px] text-ink-faint">{sub}</p>}
    </>
  );

  const cls = 'card p-5 transition';
  return to ? (
    <Link to={to} className={`${cls} hover:-translate-y-0.5 hover:border-rose-200 hover:shadow-lift`}>{inner}</Link>
  ) : (
    <div className={cls}>{inner}</div>
  );
}

export function PanelCard({ title, subtitle, action, children, className = '', padded = true }) {
  return (
    <section className={`card ${className}`}>
      {(title || action) && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
          <div>
            {title && <h2 className="font-display text-lg font-semibold text-ink">{title}</h2>}
            {subtitle && <p className="mt-0.5 text-[12.5px] text-ink-muted">{subtitle}</p>}
          </div>
          {action}
        </div>
      )}
      <div className={padded ? 'p-5' : ''}>{children}</div>
    </section>
  );
}

/**
 * Responsive table: a real table from `md` up, stacked cards below — panels get
 * used on phones far more often than dashboard designs assume.
 */
export function DataTable({ columns, rows, loading, empty, rowKey = (r) => r._id, onRowClick, mobileCard }) {
  if (loading) {
    return (
      <div className="space-y-2 p-5">
        {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
      </div>
    );
  }

  if (!rows?.length) {
    return <div className="p-5">{empty || <EmptyState icon="inbox" title="Nothing here yet" />}</div>;
  }

  return (
    <>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-left text-[13px]">
          <thead>
            <tr className="border-b border-line">
              {columns.map((c) => (
                <th key={c.key} className={`px-5 py-3 text-[11px] font-bold uppercase tracking-wide text-ink-faint ${c.align === 'right' ? 'text-right' : ''}`}>
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={rowKey(row)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={`border-b border-line last:border-0 transition ${onRowClick ? 'cursor-pointer hover:bg-blush' : ''}`}
              >
                {columns.map((c) => (
                  <td key={c.key} className={`px-5 py-3.5 align-middle ${c.align === 'right' ? 'text-right' : ''}`}>
                    {c.render ? c.render(row) : row[c.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="divide-y divide-line md:hidden">
        {rows.map((row) => (
          <div
            key={rowKey(row)}
            onClick={onRowClick ? () => onRowClick(row) : undefined}
            className={`p-4 ${onRowClick ? 'cursor-pointer active:bg-blush' : ''}`}
          >
            {mobileCard ? mobileCard(row) : (
              <div className="space-y-1.5">
                {columns.map((c) => (
                  <div key={c.key} className="flex items-start justify-between gap-3">
                    <span className="text-[11px] font-bold uppercase tracking-wide text-ink-faint">{c.header}</span>
                    <span className="text-right text-[13px]">{c.render ? c.render(row) : row[c.key]}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );
}

export function SearchInput({ value, onChange, placeholder = 'Search…', className = '' }) {
  return (
    <div className={`relative ${className}`}>
      <Search size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint" />
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="input !py-2 pl-9 text-[13px]" />
    </div>
  );
}

export function FilterTabs({ options, value, onChange, counts }) {
  return (
    <div className="hide-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      {options.map(([key, label]) => (
        <button
          key={key}
          onClick={() => onChange(key)}
          className={`flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12.5px] font-semibold transition ${
            value === key ? 'bg-rose-500 text-white' : 'border border-line bg-white text-ink-muted hover:border-rose-200'
          }`}
        >
          {label}
          {counts?.[key] != null && (
            <span className={`rounded-full px-1.5 text-[10px] ${value === key ? 'bg-white/25' : 'bg-blush text-ink-faint'}`}>
              {counts[key]}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

/* ------------------------------ Panel shell ------------------------------ */

/**
 * The chrome shared by the seller and admin panels: a fixed sidebar on desktop,
 * a slide-over drawer on mobile, and a sticky topbar.
 */
export function PanelShell({ nav, brand, accent = 'rose', children, homeLink = '/' }) {
  const navigate = useNavigate();
  const user = useAuth((s) => s.user);
  const logout = useAuth((s) => s.logout);
  const reset = useShop((s) => s.reset);
  const [open, setOpen] = useState(false);

  const accents = {
    rose: { badge: 'from-rose-500 to-rose-700', active: 'bg-rose-50 text-rose-700' },
    ink: { badge: 'from-ink to-[#4C3F46]', active: 'bg-blush text-ink' },
  };
  const a = accents[accent] || accents.rose;
  const BrandIcon = resolveIcon(brand.icon);

  function signOut() {
    logout();
    reset();
    navigate(homeLink);
  }

  const sidebar = (
    <div className="flex h-full flex-col">
      <Link to={brand.to} onClick={() => setOpen(false)} className="flex items-center gap-2.5 px-5 py-5">
        <span className={`flex h-9 w-9 items-center justify-center rounded-[0.7rem] bg-gradient-to-br ${a.badge} text-white shadow-mark`}>
          <BrandIcon size={19} />
        </span>
        <span className="min-w-0 leading-tight">
          <span className="block truncate font-display text-[17px] font-bold text-ink">{brand.title}</span>
          <span className="block truncate text-[10px] font-semibold uppercase tracking-[0.14em] text-rose-500">
            {brand.subtitle}
          </span>
        </span>
      </Link>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 pb-4">
        {nav.map((item) =>
          item.section ? (
            <p key={item.section} className="px-3 pb-1.5 pt-4 text-[10px] font-bold uppercase tracking-[0.14em] text-ink-faint">
              {item.section}
            </p>
          ) : (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13.5px] font-medium transition ${
                  isActive ? `${a.active} font-semibold` : 'text-ink-soft hover:bg-blush hover:text-ink'
                }`
              }
            >
              <item.icon size={17} />
              <span className="min-w-0 flex-1 truncate">{item.label}</span>
              {item.badge > 0 && (
                <span className="flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
                  {item.badge}
                </span>
              )}
            </NavLink>
          )
        )}
      </nav>

      <div className="border-t border-line p-3">
        <div className="mb-2 flex items-center gap-2.5 px-2 py-1.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-rose-100 text-[11px] font-bold text-rose-700">
            {initials(user?.name)}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-[13px] font-semibold text-ink">{user?.name}</span>
            <span className="block truncate text-[11px] text-ink-faint">{user?.email}</span>
          </span>
        </div>
        <Link to={homeLink} className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-[13px] text-ink-soft transition hover:bg-blush">
          <Gift size={16} /> View storefront
        </Link>
        <button onClick={signOut} className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-[13px] text-ink-soft transition hover:bg-blush hover:text-[#B3261E]">
          <Logout size={16} /> Sign out
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-cream">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[248px] border-r border-line bg-white lg:block">
        {sidebar}
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-[80] lg:hidden">
          <div className="absolute inset-0 bg-ink/30 backdrop-blur-sm animate-fade-in" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-[80%] max-w-[280px] animate-fade-in bg-white shadow-lift">
            <button onClick={() => setOpen(false)} className="absolute right-3 top-4 rounded-full p-2 text-ink-muted hover:bg-blush" aria-label="Close menu">
              <Close size={19} />
            </button>
            {sidebar}
          </div>
        </div>
      )}

      <div className="lg:pl-[248px]">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-line bg-cream/90 px-4 backdrop-blur-xl lg:hidden">
          <button onClick={() => setOpen(true)} className="rounded-xl p-2 text-ink-soft hover:bg-blush" aria-label="Open menu">
            <Menu size={21} />
          </button>
          <span className="font-display text-[17px] font-bold text-ink">{brand.title}</span>
        </header>

        <main className="p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}

export function PageHeader({ title, subtitle, action, className = '' }) {
  return (
    <div className={`mb-6 flex flex-wrap items-end justify-between gap-4 ${className}`}>
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1.5 text-[13.5px] text-ink-muted">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
