import { Link } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/primitives/Button';

export function ErrorPage({
  code = '500',
  title = 'Something went wrong',
  description = 'An unexpected error occurred. Try again, or return to the dashboard.',
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-8">
      <div className="flex max-w-md flex-col items-center text-center">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-error-container text-on-error-container">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <span className="text-label-caps uppercase text-on-surface-variant">Error {code}</span>
        <h1 className="mt-1 text-display-lg text-on-surface">{title}</h1>
        <p className="mt-2 text-body-base text-on-surface-variant">{description}</p>
        <Link to="/" className="mt-6">
          <Button variant="primary">Go to dashboard</Button>
        </Link>
      </div>
    </div>
  );
}
