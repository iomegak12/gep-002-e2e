// Grafana Faro Web SDK bootstrap — Real User Monitoring (RUM).
// Captures: page-load + navigation timing, Core Web Vitals (LCP/INP/CLS/TTFB),
// unhandled JS errors, console errors/warnings, user sessions, click events,
// and distributed traces (fetch + xhr) that propagate `traceparent` to the
// backend services so a single trace spans browser -> nginx -> service.
//
// Ships to Grafana Alloy at /collect (proxied by nginx to alloy:12347).
// All config is environment-driven so the same bundle works in dev/prod.

import { initializeFaro, getWebInstrumentations } from '@grafana/faro-web-sdk';
import { TracingInstrumentation } from '@grafana/faro-web-tracing';

const url = import.meta.env.VITE_FARO_URL || '/collect';
const env = import.meta.env.VITE_APP_ENV || 'dev';

let faro;
try {
  faro = initializeFaro({
    url,
    app: {
      name: 'gep-web',
      version: import.meta.env.VITE_APP_VERSION || '0.1.0',
      environment: env,
    },
    instrumentations: [
      ...getWebInstrumentations({
        captureConsole: true,
        captureConsoleDisabledLevels: ['debug', 'trace'],
      }),
      new TracingInstrumentation({
        // Propagate trace context to our backend origins via /iam, /supplier, /po.
        instrumentationOptions: {
          propagateTraceHeaderCorsUrls: [/.*/],
        },
      }),
    ],
    sessionTracking: { enabled: true, persistent: true },
    // Sample more in dev, less in prod
    isolate: false,
  });
} catch (err) {
  // Never let RUM init crash the app shell.
  // eslint-disable-next-line no-console
  console.warn('[faro] init failed', err);
}

export default faro;
