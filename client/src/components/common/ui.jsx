import { useEffect, useState } from 'react';
import { gradientFor } from '../../lib/format.js';
import { resolveIcon, TierIcon } from '../../lib/glyphs.jsx';
import { Star, Close } from './Icons.jsx';

/**
 * Product imagery with a graceful degradation path: if a photo fails to load
 * (offline, blocked CDN, a seller who hasn't uploaded one yet) we fall back to
 * a deterministic warm gradient and the category glyph, so a card never shows
 * a broken-image icon.
 */
export function Img({ src, alt, icon = 'gift', seed = '', className = '', ...rest }) {
  const [failed, setFailed] = useState(false);
  const showFallback = !src || failed;
  const Icon = resolveIcon(icon);

  useEffect(() => setFailed(false), [src]);

  if (showFallback) {
    return (
      <div
        className={`flex items-center justify-center ${className}`}
        style={{ background: gradientFor(seed || alt || 'upahaar') }}
        aria-label={alt}
        role="img"
        {...rest}
      >
        <Icon size={30} className="text-ink/25" />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
      className={className}
      {...rest}
    />
  );
}

/** The compact star-rating chip used on cards and headers. */
export function Rating({ value = 0, count, size = 'sm', className = '' }) {
  const styles = size === 'lg' ? 'text-sm px-2.5 py-1' : 'text-[11px] px-2 py-0.5';
  return (
    <span className={`inline-flex items-center gap-1 rounded-full bg-gold-50 font-semibold text-gold-600 ${styles} ${className}`}>
      <Star size={size === 'lg' ? 14 : 11} className="text-gold-400" />
      {Number(value || 0).toFixed(1)}
      {count != null && <span className="font-medium text-ink-faint">({count})</span>}
    </span>
  );
}

/**
 * The delivery badge — the single most important visual element on a product
 * card. Each tier gets its own colour and glyph so a customer can scan for the
 * fastest option without reading a word.
 */
const TIER_STYLES = {
  EXPRESS_60: 'bg-rose-500 text-white shadow-glow',
  PRIORITY_3H: 'bg-gold-50 text-gold-600 border border-gold-200',
  NEXT_DAY: 'bg-[#EAF3FF] text-[#2C5B93] border border-[#D5E6FA]',
  STANDARD_2_3D: 'bg-blush text-ink-soft border border-line',
};

export function DeliveryBadge({ tier, meta, className = '', size = 'sm' }) {
  if (!tier || !meta) return null;
  const large = size === 'lg';
  const pad = large ? 'px-3 py-1.5 text-[11.5px]' : 'px-2.5 py-1 text-[10.5px]';
  return (
    <span
      className={`chip font-bold uppercase tracking-[0.08em] ${TIER_STYLES[tier] || TIER_STYLES.STANDARD_2_3D} ${pad} ${className}`}
    >
      <TierIcon tier={tier} size={large ? 14 : 12} />
      {meta.badge}
    </span>
  );
}

export function Badge({ children, tone = 'neutral', className = '' }) {
  const tones = {
    neutral: 'bg-blush text-ink-soft border border-line',
    rose: 'bg-rose-50 text-rose-700 border border-rose-100',
    green: 'bg-[#EAF7F0] text-[#1F6B45] border border-[#D3EDDF]',
    amber: 'bg-gold-50 text-gold-600 border border-gold-100',
    red: 'bg-[#FDECEC] text-[#B3261E] border border-[#F8D7D5]',
    blue: 'bg-[#EAF3FF] text-[#2C5B93] border border-[#D5E6FA]',
    ink: 'bg-ink text-white',
  };
  return <span className={`chip ${tones[tone] || tones.neutral} ${className}`}>{children}</span>;
}

/** Full-screen modal used by the location picker, filters and forms. */
export function Modal({ open, onClose, title, subtitle, children, width = 'max-w-lg' }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    document.addEventListener('keydown', onKey);
    // Stop the page behind the modal from scrolling on mobile.
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previous;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center p-0 sm:items-center sm:p-4">
      <div className="absolute inset-0 bg-ink/25 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div
        className={`relative w-full ${width} animate-fade-up rounded-t-4xl bg-white shadow-lift sm:rounded-4xl max-h-[92vh] overflow-y-auto`}
        role="dialog"
        aria-modal="true"
      >
        {(title || onClose) && (
          <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-line bg-white/95 px-6 py-5 backdrop-blur rounded-t-4xl">
            <div>
              {title && <h3 className="font-display text-xl font-semibold text-ink">{title}</h3>}
              {subtitle && <p className="mt-1 text-sm text-ink-muted">{subtitle}</p>}
            </div>
            <button onClick={onClose} className="rounded-full p-2 text-ink-muted transition hover:bg-blush hover:text-ink" aria-label="Close">
              <Close size={18} />
            </button>
          </div>
        )}
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

export function EmptyState({ icon = 'gift', title, message, action, className = '' }) {
  const Icon = resolveIcon(icon);
  return (
    <div className={`flex flex-col items-center justify-center rounded-xl2 border border-dashed border-line bg-white/60 px-6 py-14 text-center ${className}`}>
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blush text-rose-400">
        <Icon size={24} />
      </div>
      <h3 className="font-display text-lg font-semibold text-ink">{title}</h3>
      {message && <p className="mt-1.5 max-w-sm text-sm text-ink-muted">{message}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Skeleton({ className = '' }) {
  return <div className={`skeleton ${className}`} />;
}

export function ProductCardSkeleton() {
  return (
    <div>
      <Skeleton className="aspect-[4/5] w-full rounded-[1.15rem]" />
      <div className="space-y-2.5 pt-4">
        <Skeleton className="h-2.5 w-20" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    </div>
  );
}

export function Spinner({ size = 20, className = '' }) {
  return (
    <span
      className={`inline-block animate-spin rounded-full border-2 border-current border-t-transparent ${className}`}
      style={{ width: size, height: size }}
      aria-label="Loading"
    />
  );
}

/**
 * Editorial section heading: an eyebrow, a large display title, and a hairline
 * that runs to the action on the right. The rule is what makes a page of
 * sections read as a composed layout rather than a stack of widgets.
 */
export function SectionHeader({ eyebrow, title, subtitle, action, className = '' }) {
  return (
    <div className={`mb-8 ${className}`}>
      <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
        <div className="max-w-2xl">
          {eyebrow && <p className="eyebrow mb-3">{eyebrow}</p>}
          <h2 className="section-title">{title}</h2>
          {subtitle && <p className="mt-3 text-[15px] leading-relaxed text-ink-muted">{subtitle}</p>}
        </div>
        {action && <div className="shrink-0 pb-1">{action}</div>}
      </div>
      <hr className="rule mt-7" />
    </div>
  );
}

export function Pagination({ page, pages, onChange, className = '' }) {
  if (!pages || pages <= 1) return null;

  // Windowed page numbers so 40 pages don't render 40 buttons.
  const window = [];
  const start = Math.max(1, Math.min(page - 2, pages - 4));
  for (let i = start; i < start + 5 && i <= pages; i += 1) window.push(i);

  return (
    <div className={`flex items-center justify-center gap-1.5 ${className}`}>
      <button className="btn-ghost btn-sm" disabled={page <= 1} onClick={() => onChange(page - 1)}>
        Previous
      </button>
      {window.map((p) => (
        <button
          key={p}
          onClick={() => onChange(p)}
          className={`h-8 w-8 rounded-full text-xs font-semibold transition ${
            p === page ? 'bg-rose-500 text-white shadow-glow' : 'text-ink-muted hover:bg-blush'
          }`}
        >
          {p}
        </button>
      ))}
      <button className="btn-ghost btn-sm" disabled={page >= pages} onClick={() => onChange(page + 1)}>
        Next
      </button>
    </div>
  );
}
