import { Check, Truck, Clock } from '../common/Icons.jsx';
import { ORDER_STATUS_ICONS } from '../../lib/glyphs.jsx';
import { formatTime, formatDateTime } from '../../lib/format.js';

/**
 * The tracking timeline. Completed steps are stamped with the time they
 * happened; the steps still to come stay visible but muted, so the customer can
 * see the whole journey rather than just how far it has got.
 */
export default function OrderTimeline({ steps = [], estimatedDeliveryAt, deliveredAt, compact = false }) {
  return (
    <div>
      <ol className="relative">
        {steps.map((step, i) => {
          const isLast = i === steps.length - 1;
          const StepIcon = ORDER_STATUS_ICONS[step.status] || Check;
          return (
            <li key={step.status} className="relative flex gap-4 pb-6 last:pb-0">
              {/* Connector */}
              {!isLast && (
                <span
                  className={`absolute left-[15px] top-8 h-full w-0.5 ${
                    step.complete ? 'bg-rose-300' : 'bg-line'
                  }`}
                />
              )}

              <span
                className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-[13px] transition ${
                  step.current
                    ? 'border-rose-500 bg-rose-500 text-white shadow-glow'
                    : step.complete
                    ? 'border-rose-300 bg-rose-100 text-rose-600'
                    : 'border-line bg-white text-ink-faint'
                }`}
              >
                {step.complete && !step.current ? <Check size={14} /> : <StepIcon size={14} />}
                {step.current && (
                  <span className="absolute inset-0 animate-pulse-ring rounded-full bg-rose-400" />
                )}
              </span>

              <div className="min-w-0 flex-1 pt-1">
                <p
                  className={`text-sm font-semibold ${
                    step.complete ? 'text-ink' : 'text-ink-faint'
                  }`}
                >
                  {step.label}
                  {step.current && (
                    <span className="ml-2 rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-rose-700">
                      Now
                    </span>
                  )}
                </p>
                {step.at ? (
                  <p className="mt-0.5 text-xs text-ink-muted">
                    {compact ? formatTime(step.at) : formatDateTime(step.at)}
                  </p>
                ) : (
                  <p className="mt-0.5 text-xs text-ink-faint">Pending</p>
                )}
              </div>
            </li>
          );
        })}
      </ol>

      {(estimatedDeliveryAt || deliveredAt) && (
        <div className="mt-2 flex items-center gap-2.5 rounded-xl bg-blush px-4 py-3">
          {deliveredAt ? (
            <>
              <Check size={17} className="shrink-0 text-[#1F6B45]" />
              <span className="text-sm">
                <span className="font-bold text-ink">Delivered</span>
                <span className="ml-1.5 text-ink-muted">{formatDateTime(deliveredAt)}</span>
              </span>
            </>
          ) : (
            <>
              <Clock size={17} className="shrink-0 text-rose-500" />
              <span className="text-sm">
                <span className="font-bold text-ink">Estimated delivery</span>
                <span className="ml-1.5 text-ink-muted">{formatDateTime(estimatedDeliveryAt)}</span>
              </span>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export function DeliveryPartnerCard({ partner }) {
  if (!partner?.name) return null;
  return (
    <div className="flex items-center gap-3 rounded-xl border border-line bg-white p-4">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-600">
        <Truck size={20} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-bold uppercase tracking-wide text-ink-faint">Delivery partner</p>
        <p className="text-sm font-bold text-ink">{partner.name}</p>
        <p className="text-xs text-ink-muted">{partner.vehicle}</p>
      </div>
      <a href={`tel:${partner.mobile}`} className="btn-ghost btn-sm shrink-0">
        Call
      </a>
    </div>
  );
}
