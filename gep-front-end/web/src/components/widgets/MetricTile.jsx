import { Card, CardBody } from '@/components/primitives/Card';
import { Pill } from '@/components/primitives/Pill';
import { cn } from '@/lib/cn';

export function MetricTile({ label, value, delta, deltaTone = 'neutral', note, icon }) {
  const toneClass = {
    neutral: 'bg-surface-container-high text-on-surface',
    positive: 'bg-success-container text-on-success-container',
    negative: 'bg-error-container text-on-error-container',
    info: 'bg-secondary-container text-on-secondary-container',
    primary: 'bg-primary-container text-on-primary-container',
  }[deltaTone];

  return (
    <Card className="flex h-full flex-col justify-between">
      <CardBody>
        <div className="mb-3 flex items-center justify-between">
          <span className="text-body-base text-on-surface-variant">{label}</span>
          {icon ? <span className="text-on-surface-variant">{icon}</span> : null}
        </div>
        <div className="mb-2 flex items-end gap-3">
          <span className="font-mono text-display-lg text-on-surface">{value}</span>
          {delta ? (
            <Pill className={cn('mb-1', toneClass)}>{delta}</Pill>
          ) : null}
        </div>
        {note ? <p className="text-body-sm text-on-surface-variant">{note}</p> : null}
      </CardBody>
    </Card>
  );
}
