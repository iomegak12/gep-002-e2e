import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/primitives/Button';

export function HeroWidget({ eyebrow, title, description, action }) {
  return (
    <div className="relative mb-widget-gap overflow-hidden rounded-2xl border border-outline-variant bg-gradient-to-r from-surface-container-low to-surface-variant p-8 shadow-sm">
      <div className="relative z-10 max-w-lg">
        {eyebrow ? (
          <span className="text-label-caps uppercase tracking-[0.05em] text-on-surface-variant">
            {eyebrow}
          </span>
        ) : null}
        <h2 className="mt-2 text-display-lg text-on-surface">{title}</h2>
        {description ? (
          <p className="mt-3 text-body-base text-on-surface-variant">{description}</p>
        ) : null}
        {action ? (
          <Link to={action.to} className="mt-5 inline-block">
            <Button variant="secondary" rightIcon={<ArrowRight className="h-4 w-4" />}>
              {action.label}
            </Button>
          </Link>
        ) : null}
      </div>
      <div className="pointer-events-none absolute right-0 top-0 hidden h-full w-1/2 opacity-50 md:block">
        <div className="absolute -top-20 right-12 h-64 w-64 rounded-full bg-primary opacity-20 blur-3xl" />
        <div className="absolute -bottom-20 right-32 h-64 w-64 rounded-full bg-secondary opacity-20 blur-3xl" />
      </div>
    </div>
  );
}
