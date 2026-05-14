/* eslint-disable */
// OpenTelemetry bootstrap — MUST be required before any other module so
// auto-instrumentations can patch them. The Dockerfile launches node with
// `--require ./src/tracing.js`.
//
// Config is fully env-driven (OTEL_* vars set in docker-compose). Failing
// silent here is intentional: a broken collector should NOT crash the app.

const process = require('process');
const { NodeSDK } = require('@opentelemetry/sdk-node');
const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-proto');
const { OTLPMetricExporter } = require('@opentelemetry/exporter-metrics-otlp-proto');
const { PeriodicExportingMetricReader } = require('@opentelemetry/sdk-metrics');
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');
const { HostMetrics } = require('@opentelemetry/host-metrics');
const { resourceFromAttributes } = require('@opentelemetry/resources');
const {
  ATTR_SERVICE_NAME,
  ATTR_SERVICE_VERSION,
} = require('@opentelemetry/semantic-conventions');
const { metrics } = require('@opentelemetry/api');

const serviceName = process.env.OTEL_SERVICE_NAME || 'unknown-node-service';
const serviceVersion = process.env.npm_package_version || '1.0.0';
const otlpBase =
  process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://otel-collector:4318';

const resource = resourceFromAttributes({
  [ATTR_SERVICE_NAME]: serviceName,
  [ATTR_SERVICE_VERSION]: serviceVersion,
});

const metricReader = new PeriodicExportingMetricReader({
  exporter: new OTLPMetricExporter({ url: `${otlpBase}/v1/metrics` }),
  exportIntervalMillis: Number(process.env.OTEL_METRIC_EXPORT_INTERVAL) || 15000,
});

const sdk = new NodeSDK({
  resource,
  traceExporter: new OTLPTraceExporter({ url: `${otlpBase}/v1/traces` }),
  metricReader,
  instrumentations: [
    getNodeAutoInstrumentations({
      // Disable noisy file-system instrumentation in production; keep net/dns/http.
      '@opentelemetry/instrumentation-fs': { enabled: false },
      '@opentelemetry/instrumentation-http': {
        ignoreIncomingRequestHook: (req) => {
          const url = (req.url || '').toLowerCase();
          return url === '/health' || url === '/healthz' || url === '/metrics';
        },
      },
    }),
  ],
});

try {
  sdk.start();
  const hostMetrics = new HostMetrics({
    meterProvider: metrics.getMeterProvider(),
    name: serviceName,
  });
  hostMetrics.start();
  // eslint-disable-next-line no-console
  console.log(`[otel] tracing started for ${serviceName} -> ${otlpBase}`);
} catch (err) {
  // eslint-disable-next-line no-console
  console.error('[otel] failed to start', err);
}

process.on('SIGTERM', () => {
  sdk.shutdown().finally(() => process.exit(0));
});
