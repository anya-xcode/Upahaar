import { useRef } from 'react';
import ProductCard from './ProductCard.jsx';
import { ProductCardSkeleton } from '../common/ui.jsx';
import { ChevronLeft, ChevronRight } from '../common/Icons.jsx';

/**
 * Horizontally scrolling product rail. On mobile it's a swipe list; from `lg`
 * up it gains arrow controls, because a trackpad user shouldn't have to
 * shift-scroll to see the rest of a row.
 */
export default function ProductRail({ products = [], loading = false, skeletonCount = 4 }) {
  const railRef = useRef(null);

  function scrollBy(direction) {
    const el = railRef.current;
    if (!el) return;
    el.scrollBy({ left: direction * (el.clientWidth * 0.8), behavior: 'smooth' });
  }

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: skeletonCount }).map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (!products.length) return null;

  return (
    <div className="relative">
      <div
        ref={railRef}
        className="hide-scrollbar -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0"
      >
        {products.map((p) => (
          <div key={p._id} className="w-[68%] shrink-0 snap-start sm:w-[46%] lg:w-[calc(25%-12px)]">
            <ProductCard product={p} />
          </div>
        ))}
      </div>

      <button
        onClick={() => scrollBy(-1)}
        aria-label="Scroll left"
        className="absolute -left-4 top-[38%] hidden h-10 w-10 items-center justify-center rounded-full border border-line bg-white text-ink-soft shadow-lift transition hover:border-rose-200 hover:text-rose-600 lg:flex"
      >
        <ChevronLeft size={18} />
      </button>
      <button
        onClick={() => scrollBy(1)}
        aria-label="Scroll right"
        className="absolute -right-4 top-[38%] hidden h-10 w-10 items-center justify-center rounded-full border border-line bg-white text-ink-soft shadow-lift transition hover:border-rose-200 hover:text-rose-600 lg:flex"
      >
        <ChevronRight size={18} />
      </button>
    </div>
  );
}
