import { Link } from 'react-router-dom';
import { ChevronLeft } from '../../components/common/Icons.jsx';
import Logo from '../../components/common/BrandMark.jsx';
import { resolveIcon } from '../../lib/glyphs.jsx';

/**
 * Shared split-screen frame for every sign-in and sign-up screen.
 * The right panel carries the brand story so the forms stay uncluttered.
 */
export default function AuthShell({
  children,
  title,
  subtitle,
  aside,
  tone = 'rose',
  wide = false,
}) {
  const tones = {
    rose: 'from-rose-50 via-blush to-gold-50',
    ink: 'from-[#2E1B2B] via-[#3A2336] to-[#4A2E42]',
  };
  const isDark = tone === 'ink';

  return (
    <div className="grid min-h-screen lg:grid-cols-[1fr_0.9fr]">
      {/* Form side */}
      <div className="flex flex-col bg-cream px-5 py-8 sm:px-10">
        <Logo className="mb-10 self-start" showTagline={false} />

        <div className={`mx-auto flex w-full flex-1 flex-col justify-center ${wide ? 'max-w-xl' : 'max-w-sm'}`}>
          <h1 className="font-display text-3xl font-semibold text-ink">{title}</h1>
          {subtitle && <p className="mt-2 text-[15px] text-ink-muted">{subtitle}</p>}
          <div className="mt-7">{children}</div>
        </div>

        <Link
          to="/"
          className="mt-10 inline-flex items-center gap-1 self-start text-[13px] font-semibold text-ink-muted transition hover:text-rose-600"
        >
          <ChevronLeft size={14} /> Back to Upahaar
        </Link>
      </div>

      {/* Story side */}
      <div className={`relative hidden overflow-hidden bg-gradient-to-br lg:flex lg:flex-col lg:justify-center ${tones[tone]} px-12`}>
        <div className={`pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full blur-3xl ${isDark ? 'bg-rose-500/20' : 'bg-rose-200/40'}`} />
        <div className={`pointer-events-none absolute -bottom-32 -right-16 h-80 w-80 rounded-full blur-3xl ${isDark ? 'bg-gold-400/10' : 'bg-gold-200/40'}`} />
        <div className="relative">{aside}</div>
      </div>
    </div>
  );
}

/** The default brand panel — a pull-quote plus three proof points. */
export function BrandAside({ quote, points = [], dark = false }) {
  const text = dark ? 'text-white' : 'text-ink';
  const muted = dark ? 'text-white/65' : 'text-ink-soft';
  const chip = dark ? 'bg-white/10 backdrop-blur' : 'bg-white/70 backdrop-blur';

  return (
    <div>
      <p className={`font-display text-3xl font-semibold leading-snug ${text}`}>{quote}</p>
      <div className="mt-10 space-y-3">
        {points.map(({ icon, title, body }) => {
          const Icon = resolveIcon(icon);
          return (
          <div key={title} className={`flex items-start gap-4 rounded-2xl p-4 ${chip}`}>
            <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${dark ? 'bg-white/10 text-rose-200' : 'bg-white text-rose-500'}`}>
              <Icon size={19} />
            </span>
            <span className="min-w-0">
              <span className={`block text-sm font-bold ${text}`}>{title}</span>
              <span className={`block text-[13px] leading-relaxed ${muted}`}>{body}</span>
            </span>
          </div>
          );
        })}
      </div>
    </div>
  );
}
