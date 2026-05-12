import { cn } from '@/lib/cn';

export function Card({ as: Tag = 'div', className, children, ...props }) {
  return (
    <Tag
      className={cn(
        'rounded-2xl border border-outline-variant bg-surface shadow-sm',
        className
      )}
      {...props}
    >
      {children}
    </Tag>
  );
}

export function CardHeader({ className, children }) {
  return (
    <div
      className={cn(
        'flex items-center justify-between gap-3 border-b border-outline-variant bg-surface-container-lowest px-6 py-4 rounded-t-2xl',
        className
      )}
    >
      {children}
    </div>
  );
}

export function CardBody({ className, children }) {
  return <div className={cn('p-6', className)}>{children}</div>;
}

export function CardFooter({ className, children }) {
  return (
    <div
      className={cn(
        'border-t border-outline-variant px-6 py-4 flex items-center justify-end gap-2 rounded-b-2xl',
        className
      )}
    >
      {children}
    </div>
  );
}
