import { cn } from '@/lib/cn';

export function Tabs({ value, onChange, items = [], className }) {
  return (
    <div role="tablist" className={cn('inline-flex gap-1 rounded-full bg-surface-container-low p-1', className)}>
      {items.map((item) => {
        const active = item.value === value;
        return (
          <button
            key={item.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange?.(item.value)}
            className={cn(
              'inline-flex items-center gap-1 rounded-full px-3 py-1 text-body-sm transition-colors',
              active
                ? 'bg-surface text-on-surface shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface'
            )}
          >
            {item.icon ? <span className="h-4 w-4">{item.icon}</span> : null}
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
