import { ErrorPage } from './ErrorPage';

export function NotFoundPage() {
  return (
    <ErrorPage
      code="404"
      title="Page not found"
      description="The page you were looking for does not exist or has been moved."
    />
  );
}
