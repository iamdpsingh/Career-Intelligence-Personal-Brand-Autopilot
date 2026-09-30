import { db } from "@/providers/db";
import { auditLogs } from "@/providers/db/schema";

// ----------------------------------------------------------------------
// SYSTEM AUDIT LOGGER (V2)
// ----------------------------------------------------------------------
// Tracks all critical state changes and system failures to comply with
// Rule 56 (Audit Logging).
// ----------------------------------------------------------------------

export class SystemAudit {
  /**
   * Logs a critical system event.
   */
  static async log(action: string, resource: string, result: "SUCCESS" | "FAILURE", userId?: string) {
    try {
      await db.insert(auditLogs).values({
        userId: userId || null,
        action,
        resource,
        result,
        timestamp: new Date(),
      });
      console.log(`[AUDIT] ${action} | ${resource} | ${result}`);
    } catch (e) {
      console.error(`[AUDIT] Failed to write audit log!`, e);
    }
  }
}
