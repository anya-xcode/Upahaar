import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../lib/api.js';
import { Skeleton, EmptyState } from '../../components/common/ui.jsx';
import { ChevronDown, Mail, Phone } from '../../components/common/Icons.jsx';

export default function Faq() {
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(null);
  const [category, setCategory] = useState('All');

  useEffect(() => {
    api
      .get('/catalog/faqs')
      .then(({ data }) => setFaqs(data.faqs))
      .catch(() => setFaqs([]))
      .finally(() => setLoading(false));
  }, []);

  const categories = ['All', ...new Set(faqs.map((f) => f.category))];
  const visible = category === 'All' ? faqs : faqs.filter((f) => f.category === category);

  return (
    <div className="container-app max-w-3xl py-12">
      <div className="mb-8 text-center">
        <h1 className="font-display text-4xl font-semibold text-ink">Questions, answered</h1>
        <p className="mt-2.5 text-[15px] text-ink-muted">
          Everything about delivery times, orders, payments and selling on Upahaar.
        </p>
      </div>

      {categories.length > 2 && (
        <div className="mb-7 flex flex-wrap justify-center gap-2">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`rounded-full px-4 py-1.5 text-[13px] font-semibold transition ${
                category === c ? 'bg-rose-500 text-white' : 'border border-line bg-white text-ink-muted hover:border-rose-200'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-xl2" />)}
        </div>
      ) : !visible.length ? (
        <EmptyState icon="idea" title="No questions here yet" />
      ) : (
        <div className="space-y-3">
          {visible.map((f) => {
            const isOpen = open === f._id;
            return (
              <div key={f._id} className={`overflow-hidden rounded-xl2 border bg-white transition ${isOpen ? 'border-rose-200 shadow-soft' : 'border-line'}`}>
                <button
                  onClick={() => setOpen(isOpen ? null : f._id)}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                >
                  <span className="text-[15px] font-semibold text-ink">{f.question}</span>
                  <ChevronDown size={17} className={`shrink-0 text-ink-faint transition ${isOpen ? 'rotate-180 text-rose-500' : ''}`} />
                </button>
                {isOpen && (
                  <div className="animate-fade-in border-t border-line px-5 py-4">
                    <p className="whitespace-pre-line text-[14.5px] leading-relaxed text-ink-soft">{f.answer}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <section className="mt-12 rounded-4xl bg-gradient-to-br from-rose-50 to-gold-50 p-8 text-center">
        <h2 className="font-display text-2xl font-semibold text-ink">Still stuck?</h2>
        <p className="mt-2 text-[15px] text-ink-muted">Our team answers every message, usually within the hour.</p>
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <a href="mailto:help@upahaar.test" className="btn-primary">
            <Mail size={15} /> help@upahaar.test
          </a>
          <a href="tel:+911800000000" className="btn-ghost">
            <Phone size={15} /> 1800 000 000
          </a>
        </div>
        <Link to="/how-it-works" className="mt-4 inline-block text-[13px] font-semibold text-rose-600 hover:underline">
          Or read how Upahaar works →
        </Link>
      </section>
    </div>
  );
}
