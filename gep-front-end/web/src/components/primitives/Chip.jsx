import { X } from 'lucide-react';
import { cn } from '@/lib/cn';

export function Chip({ children, selected, onClick, onRemove, className, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={selected}
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-3 py-1 text-body-sm transition-colors',
        selected
          ? 'border-secondary bg-secondary-container text-on-secondary-container'
          : 'border-outline-variant bg-surface-container-low text-on-surface hover:bg-surface-container-high',
        disabled ? 'opacity-50 cursor-not-allowed' : '',
        className
      )}
    >
      {children}
      {onRemove ? (
        <span
          role="button"
          tabIndex={0}
          onClick={(e) => {
            e.stopPropagation();
            onRemove?.();
          }}
          className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full hover:bg-surface-container-highest"
        >
          <X className="h-3 w-3" />
        </span>
      ) : null}
    </button>
  );
}
