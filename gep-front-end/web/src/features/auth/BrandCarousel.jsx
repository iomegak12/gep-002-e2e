import { useEffect, useRef, useState } from 'react';
import { Brand } from '@/components/layout/Brand';
import { cn } from '@/lib/cn';

const SLIDES = [
  {
    eyebrow: 'Welcome',
    headline: 'Procurement, with the chaos taken out.',
    body: 'Sign in to manage suppliers, raise purchase orders, and track spend — all in one workspace.',
    stats: [
      { label: 'Suppliers', value: '324' },
      { label: 'POs this year', value: '1.2k' },
      { label: 'On-time delivery', value: '96.4%' },
    ],
  },
  {
    eyebrow: 'Suppliers',
    headline: 'Sourced, scored, ready to ship.',
    body: 'Onboard partners, monitor performance, and keep a clean book of record across every category and region.',
    stats: [
      { label: 'Active', value: '298' },
      { label: 'Categories', value: '12' },
      { label: 'Countries', value: '24' },
    ],
  },
  {
    eyebrow: 'Approvals',
    headline: 'Approvals at the speed of trust.',
    body: 'Route purchase orders to the right approver instantly, with limits, audit trails and reasoned decisions.',
    stats: [
      { label: 'Avg cycle', value: '1.8d' },
      { label: 'Within SLA', value: '92%' },
      { label: 'Auto-approved', value: '38%' },
    ],
  },
  {
    eyebrow: 'Insights',
    headline: 'Spend visibility, always at hand.',
    body: 'See spend by supplier, category and month — drill from totals to the underlying purchase orders in one click.',
    stats: [
      { label: 'YTD spend', value: '₹84M' },
      { label: 'Top supplier share', value: '17%' },
      { label: 'Categories tracked', value: '12' },
    ],
  },
];

const INTERVAL_MS = 6000;

export function BrandCarousel({ className }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    if (paused) return undefined;
    timerRef.current = setInterval(
      () => setIndex((i) => (i + 1) % SLIDES.length),
      INTERVAL_MS
    );
    return () => clearInterval(timerRef.current);
  }, [paused]);

  return (
    <div
      className={cn('relative', className)}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      aria-roledescription="carousel"
      aria-label="Order Oasis highlights"
    >
      <Brand size="md" />

      {/* Slide stack — absolutely positioned for cross-fade. */}
      <div className="relative mt-6 min-h-[260px]">
        {SLIDES.map((slide, i) => {
          const active = i === index;
          return (
            <article
              key={slide.headline}
              aria-hidden={!active}
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${SLIDES.length}`}
              className={cn(
                'absolute inset-0 transition-all duration-700 ease-out',
                active
                  ? 'opacity-100 translate-y-0 pointer-events-auto'
                  : 'opacity-0 translate-y-3 pointer-events-none'
              )}
            >
              <span className="text-label-caps uppercase tracking-[0.05em] text-primary">
                {slide.eyebrow}
              </span>
              <h1 className="mt-2 max-w-sm text-display-lg text-on-surface">
                {slide.headline}
              </h1>
              <p className="mt-3 max-w-sm text-body-base text-on-surface-variant">
                {slide.body}
              </p>
              <dl className="mt-8 grid max-w-sm grid-cols-3 gap-6">
                {slide.stats.map((stat) => (
                  <div key={stat.label}>
                    <dt className="text-label-caps uppercase text-on-surface-variant">
                      {stat.label}
                    </dt>
                    <dd className="mt-1 font-mono text-2xl font-bold text-primary">
                      {stat.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </article>
          );
        })}
      </div>

      {/* Indicators */}
      <div
        className="mt-6 flex items-center gap-2"
        role="tablist"
        aria-label="Select slide"
      >
        {SLIDES.map((slide, i) => {
          const active = i === index;
          return (
            <button
              key={slide.headline}
              type="button"
              role="tab"
              aria-selected={active}
              aria-label={`Go to slide ${i + 1}: ${slide.headline}`}
              onClick={() => setIndex(i)}
              className={cn(
                'h-1.5 rounded-full transition-all duration-300',
                active
                  ? 'w-8 bg-primary'
                  : 'w-3 bg-outline-variant hover:bg-on-surface-variant'
              )}
            />
          );
        })}
      </div>
    </div>
  );
}
