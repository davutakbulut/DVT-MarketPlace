import { query } from '@/lib/db';
import { CrashReportPayload } from './telemetry';

/**
 * Server-side Direct Database Crash Logger
 */
export async function logServerCrash(payload: CrashReportPayload) {
  try {
    await query(`
      INSERT INTO system_crash_logs 
      (error_type, error_message, stack_trace, page_url, component_name, severity, user_agent, metadata, status, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'unresolved', now())
    `, [
      payload.errorType || 'ServerError',
      payload.errorMessage,
      payload.stackTrace || null,
      payload.pageUrl || '/api',
      payload.componentName || 'ServerEngine',
      payload.severity || 'error',
      payload.userAgent || 'Node.js/Next.js Server',
      JSON.stringify(payload.metadata || {})
    ]);
  } catch (err) {
    console.error('Failed to log server crash to DB:', err);
  }
}
