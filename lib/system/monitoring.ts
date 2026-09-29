/**
 * Monitoring Service
 * 
 * In a full production environment, this would integrate directly 
 * with Sentry, DataDog, or Axiom. For Vercel Hobby/Free tiers, 
 * we wrap console.error with structured logging that can be automatically
 * ingested by Vercel Log Drains.
 */
export class MonitoringService {
  static logError(context: string, error: unknown, metadata?: Record<string, unknown>) {
    // Format tailored for structured JSON ingestion
    const payload = {
      level: 'error',
      timestamp: new Date().toISOString(),
      context,
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      ...metadata
    };

    console.error(JSON.stringify(payload));
  }

  static logMetric(metricName: string, value: number, tags?: Record<string, string>) {
    const payload = {
      level: 'info',
      type: 'metric',
      timestamp: new Date().toISOString(),
      metric: metricName,
      value,
      tags
    };

    console.log(JSON.stringify(payload));
  }
}
