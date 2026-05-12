import { cn } from '@/lib/cn';

export function Brand({ size = 'md', subtitle = 'SCM PLATFORM', className }) {
  const sizes = {
    sm: { box: 'h-8 w-8 text-body-base', title: 'text-body-base', sub: 'text-[10px]' },
    md: { box: 'h-11 w-11 text-headline-md', title: 'text-title-sm', sub: 'text-[10px]' },
    lg: { box: 'h-14 w-14 text-display-lg', title: 'text-headline-md', sub: 'text-label-caps' },
  };
  const s = sizes[size];
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <div
        className={cn(
          'grid place-items-center rounded-lg bg-gradient-to-br from-primary to-tertiary text-on-primary font-bold',
          s.box
        )}
      >
        O
      </div>
      <div className="leading-tight">
        <div className={cn('font-bold text-on-surface', s.title)}>Order Oasis</div>
        <div className={cn('uppercase tracking-[0.05em] text-on-surface-variant', s.sub)}>
          {subtitle}
        </div>
      </div>
    </div>
  );
}
