import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

export function Breadcrumbs({ items = [] }) {
  if (!items.length) return null;
  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-body-sm text-on-surface-variant">
      {items.map((item, i) => {
        const last = i === items.length - 1;
        return (
          <span key={`${item.label}-${i}`} className="flex items-center gap-1">
            {item.to && !last ? (
              <Link to={item.to} className="hover:text-on-surface">
                {item.label}
              </Link>
            ) : (
              <span className={last ? 'text-on-surface' : ''}>{item.label}</span>
            )}
            {!last ? <ChevronRight className="h-3 w-3 text-on-surface-variant" /> : null}
          </span>
        );
      })}
    </nav>
  );
}
