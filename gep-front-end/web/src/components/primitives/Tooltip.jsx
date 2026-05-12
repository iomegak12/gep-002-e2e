import { cn } from '@/lib/cn';

/** Minimal CSS-only tooltip. For richer behavior swap to floating-ui later. */
export function Tooltip({ label, children, side = 'top', className }) {
  const placement = {
    top: 'bottom-full mb-1 left-1/2 -translate-x-1/2',
    bottom: 'top-full mt-1 left-1/2 -translate-x-1/2',
    left: 'right-full mr-1 top-1/2 -translate-y-1/2',
    right: 'left-full ml-1 top-1/2 -translate-y-1/2',
  };
  return (
    <span className={cn('group relative inline-flex', className)}>
      {children}
      <span
        role="tooltip"
        className={cn(
          'pointer-events-none absolute z-30 whitespace-nowrap rounded-lg bg-surface-container-highest px-2 py-1 text-body-sm text-on-surface opacity-0 shadow-md transition-opacity group-hover:opacity-100 group-focus-within:opacity-100',
          placement[side]
        )}
      >
        {label}
      </span>
    </span>
  );
}
