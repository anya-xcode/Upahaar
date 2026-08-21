import { Link } from 'react-router-dom';

/**
 * The Upahaar mark.
 *
 * Four ribbon loops turning around a knot — a wrapped-gift rosette seen from
 * above. The rotational symmetry reads as a bow up close and as motion at a
 * glance, which is the brand in one shape: gifting, and speed.
 *
 * Drawn on a 32×32 grid as a single petal rotated four times, so it stays
 * perfectly symmetrical at any size and needs no hinting to look crisp at 16px.
 */
export function BrandMark({ size = 28, className = '', title }) {
  return (
    <svg
      viewBox="0 0 32 32"
      width={size}
      height={size}
      className={className}
      fill="currentColor"
      role={title ? 'img' : 'presentation'}
      aria-hidden={title ? undefined : 'true'}
    >
      {title && <title>{title}</title>}
      {[0, 90, 180, 270].map((deg) => (
        <path
          key={deg}
          d="M16 16C17.9 11.2 22.6 8.6 24.7 10.6C26.8 12.6 21.3 15.2 16 16Z"
          transform={`rotate(${deg} 16 16)`}
          opacity="0.92"
        />
      ))}
      <circle cx="16" cy="16" r="2.6" />
    </svg>
  );
}

/**
 * The mark in its tile — used wherever the logo appears on a light surface.
 * `tone="light"` inverts it for dark panels.
 */
export function BrandTile({ size = 38, tone = 'brand', className = '' }) {
  const tones = {
    brand: 'bg-gradient-to-br from-rose-500 to-rose-700 text-white',
    light: 'bg-white text-rose-500',
    ink: 'bg-ink text-rose-200',
  };
  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-[0.7rem] shadow-mark ${tones[tone]} ${className}`}
      style={{ width: size, height: size }}
    >
      <BrandMark size={size * 0.62} />
    </span>
  );
}

/**
 * Full lockup: mark, wordmark and an optional letterspaced descriptor.
 * Every surface that shows the logo uses this, so the brand can never drift
 * between the storefront, the auth screens and the panels.
 */
export default function Logo({
  to = '/',
  size = 'md',
  tone = 'brand',
  showTagline = true,
  className = '',
}) {
  const scale = {
    sm: { tile: 32, word: 'text-[17px]', tag: 'text-[8.5px]' },
    md: { tile: 38, word: 'text-[21px]', tag: 'text-[9px]' },
    lg: { tile: 46, word: 'text-[26px]', tag: 'text-[10px]' },
  }[size];

  const wordColor = tone === 'ink' ? 'text-white' : 'text-ink';
  const tagColor = tone === 'ink' ? 'text-rose-200/80' : 'text-rose-500';

  const inner = (
    <>
      <BrandTile size={scale.tile} tone={tone} />
      <span className="leading-none">
        <span className={`block font-display font-semibold tracking-[-0.02em] ${scale.word} ${wordColor}`}>
          Upahaar
        </span>
        {showTagline && (
          <span className={`mt-1 hidden font-sans font-semibold uppercase tracking-[0.22em] sm:block ${scale.tag} ${tagColor}`}>
            Gifts near you
          </span>
        )}
      </span>
    </>
  );

  const classes = `flex items-center gap-3 ${className}`;
  return to ? (
    <Link to={to} className={classes} aria-label="Upahaar — home">
      {inner}
    </Link>
  ) : (
    <span className={classes}>{inner}</span>
  );
}
