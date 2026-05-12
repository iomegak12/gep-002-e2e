import { Card, CardBody } from '@/components/primitives/Card';

/** Stub shown for screens not yet implemented in Phase 1. */
export function Placeholder({ title, note }) {
  return (
    <Card>
      <CardBody>
        <h2 className="text-headline-md text-on-surface">{title}</h2>
        <p className="mt-2 text-body-base text-on-surface-variant">
          {note || 'This screen will be implemented in a later phase.'}
        </p>
      </CardBody>
    </Card>
  );
}
