import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Activity, RefreshCw } from 'lucide-react';
import { Modal } from '@/components/primitives/Modal';
import { Button } from '@/components/primitives/Button';
import { Tooltip } from '@/components/primitives/Tooltip';
import { probeAllHealth } from '@/api/healthApi';
import { cn } from '@/lib/cn';

const POLL_MS = 30_000;

function overallStatus(services) {
  if (!services?.length) return 'unknown';
  const ups = services.filter((s) => s.status === 'up').length;
  if (ups === services.length) return 'up';
  if (ups === 0) return 'down';
  return 'degraded';
}

const TONE = {
  up: {
    dot: 'bg-success',
    ring: 'ring-success/30',
    pill: 'bg-success-container text-on-success-container',
    label: 'All services healthy',
  },
  degraded: {
    dot: 'bg-tertiary',
    ring: 'ring-tertiary/30',
    pill: 'bg-tertiary-container text-on-tertiary-container',
    label: 'Some services degraded',
  },
  down: {
    dot: 'bg-error',
    ring: 'ring-error/30',
    pill: 'bg-error-container text-on-error-container',
    label: 'Services unavailable',
  },
  unknown: {
    dot: 'bg-on-surface-variant',
    ring: 'ring-on-surface-variant/30',
    pill: 'bg-surface-container-high text-on-surface',
    label: 'Checking…',
  },
};

function StatusDot({ status, className }) {
  const tone = TONE[status] || TONE.unknown;
  return (
    <span
      className={cn(
        'inline-flex h-2.5 w-2.5 rounded-full ring-4 ring-offset-0',
        tone.dot,
        tone.ring,
        className
      )}
    />
  );
}

function StatusRow({ service }) {
  const tone = TONE[service.status] || TONE.unknown;
  return (
    <li className="flex items-center justify-between gap-4 rounded-lg border border-outline-variant bg-surface-container-low p-3">
      <div className="flex min-w-0 items-center gap-3">
        <StatusDot status={service.status} />
        <div className="min-w-0">
          <div className="text-body-base text-on-surface">{service.label}</div>
          <div className="truncate font-mono text-body-sm text-on-surface-variant">
            {service.baseUrl}/health
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3 whitespace-nowrap">
        {service.latency !== undefined ? (
          <span className="font-mono text-body-sm text-on-surface-variant">
            {service.latency} ms
          </span>
        ) : null}
        <span
          className={cn(
            'inline-flex items-center rounded-full px-2 py-0.5 text-label-caps uppercase',
            tone.pill
          )}
        >
          {service.status === 'up'
            ? 'Up'
            : service.status === 'down'
              ? 'Down'
              : service.status === 'degraded'
                ? 'Degraded'
                : 'Unknown'}
        </span>
      </div>
    </li>
  );
}

export function HealthIndicator() {
  const [open, setOpen] = useState(false);

  const { data, isFetching, refetch, dataUpdatedAt } = useQuery({
    queryKey: ['health', 'all'],
    queryFn: probeAllHealth,
    refetchInterval: POLL_MS,
    refetchOnWindowFocus: true,
    staleTime: 0,
  });

  const overall = overallStatus(data);
  const tone = TONE[overall];

  return (
    <>
      <Tooltip label={`Backend health: ${tone.label.toLowerCase()}`} side="bottom">
        <button
          type="button"
          aria-label="Backend health"
          onClick={() => setOpen(true)}
          className="relative flex h-8 w-8 items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface"
        >
          <Activity className="h-5 w-5" />
          <span
            className={cn(
              'absolute -bottom-0.5 -right-0.5 inline-flex h-2.5 w-2.5 rounded-full ring-2 ring-surface-container-lowest',
              tone.dot
            )}
            aria-hidden="true"
          />
        </button>
      </Tooltip>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Backend health"
        description="Live status of the services this UI talks to. Polled every 30 seconds."
        size="lg"
        footer={
          <>
            <span className="mr-auto text-body-sm text-on-surface-variant">
              {dataUpdatedAt
                ? `Last checked ${new Date(dataUpdatedAt).toLocaleTimeString()}`
                : 'Not checked yet'}
            </span>
            <Button
              variant="ghost"
              onClick={() => refetch()}
              disabled={isFetching}
              leftIcon={<RefreshCw className={cn('h-4 w-4', isFetching && 'animate-spin')} />}
            >
              {isFetching ? 'Checking…' : 'Refresh'}
            </Button>
            <Button variant="primary" onClick={() => setOpen(false)}>
              Close
            </Button>
          </>
        }
      >
        <div className="mb-3 flex items-center gap-3 rounded-lg border border-outline-variant bg-surface-container-low p-3">
          <StatusDot status={overall} />
          <div className="flex-1">
            <div className="text-body-base text-on-surface">{tone.label}</div>
            <div className="text-body-sm text-on-surface-variant">
              {data
                ? `${data.filter((s) => s.status === 'up').length} of ${data.length} services responding`
                : 'Awaiting first check…'}
            </div>
          </div>
        </div>
        <ul className="flex flex-col gap-2">
          {(data || []).map((service) => (
            <StatusRow key={service.key} service={service} />
          ))}
          {!data && isFetching
            ? [0, 1, 2].map((i) => (
                <li
                  key={i}
                  className="h-14 animate-pulse rounded-lg border border-outline-variant bg-surface-container-low"
                />
              ))
            : null}
        </ul>
      </Modal>
    </>
  );
}
