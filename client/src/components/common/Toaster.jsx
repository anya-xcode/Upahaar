import { useToasts } from '../../store/toastStore.js';
import { Check, Warning, Info, Close } from './Icons.jsx';

const TONES = {
  success: { cls: 'border-[#D3EDDF] bg-[#F2FBF6] text-[#1F6B45]', Icon: Check },
  error: { cls: 'border-[#F8D7D5] bg-[#FEF6F5] text-[#B3261E]', Icon: Warning },
  info: { cls: 'border-line bg-white text-ink', Icon: Info },
};

export default function Toaster() {
  const { items, dismiss } = useToasts();
  if (!items.length) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[200] flex flex-col items-center gap-2 px-4 sm:bottom-auto sm:right-4 sm:top-4 sm:items-end sm:px-0">
      {items.map(({ id, type, message }) => {
        const { cls, Icon } = TONES[type] || TONES.info;
        return (
          <div
            key={id}
            role="status"
            className={`pointer-events-auto flex w-full max-w-sm animate-fade-up items-start gap-3 rounded-2xl border px-4 py-3 shadow-lift ${cls}`}
          >
            <Icon size={17} className="mt-0.5 shrink-0" />
            <p className="flex-1 text-sm font-medium">{message}</p>
            <button onClick={() => dismiss(id)} className="shrink-0 opacity-50 transition hover:opacity-100" aria-label="Dismiss">
              <Close size={15} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
