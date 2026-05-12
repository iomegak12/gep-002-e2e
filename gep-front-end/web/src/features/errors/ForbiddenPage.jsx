import { ErrorPage } from './ErrorPage';

export function ForbiddenPage() {
  return (
    <ErrorPage
      code="403"
      title="Access denied"
      description="You don't have permission to view this page. Contact an administrator if you believe this is a mistake."
    />
  );
}
