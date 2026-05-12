import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/primitives/Button';
import { cn } from '@/lib/cn';

export function ErrorState({
  title = 'Could not load',
  description = 'Please try again. If the problem persists, contact your administrator.',
  onRetry,
  className,
}) {
  return (
    <div
      role="alert"
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-2xl border border-error-container bg-error-container/30 p-8 text-center',
        className
      )}
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-error-container text-on-error-container">
        <AlertTriangle className="h-5 w-5" />
      </div>
      <div>
        <div className="text-title-sm text-on-error-container">{title}</div>
        <div className="mt-1 max-w-md text-body-base text-on-error-container/80">{description}</div>
      </div>
      {onRetry ? (
        <Button variant="secondary" onClick={onRetry} leftIcon={<RefreshCw className="h-4 w-4" />}>
          Retry
        </Button>
      ) : null}
    </div>
  );
}
