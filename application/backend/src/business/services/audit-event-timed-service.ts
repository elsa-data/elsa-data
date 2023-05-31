import { injectable } from "tsyringe";
import { setTimeout } from "timers/promises";

@injectable()
export class AuditEventTimedService {
  /**
   * Audit event which are being awaited on for a given key.
   */
  private awaitingAuditEvents = new Set<string>();

  constructor() {}

  /**
   * Create an audit event and wait before creating another with the same key.
   * Returns the audit event id if an event was created, or null if and event
   * is already being awaited. Optionally, a complete function can be called
   * with a new date after the delay.
   */
  public async createTimedAuditEvent(
    key: string,
    delay: number,
    startAuditEventFn: (start: Date) => Promise<string>,
    completeAuditEventFn?: (auditEventId: string, end: Date) => Promise<void>
  ): Promise<string | null> {
    if (!this.awaitingAuditEvents.has(key)) {
      this.awaitingAuditEvents.add(key);

      const auditEventStart = new Date();
      const auditEventId = await startAuditEventFn(auditEventStart);

      const timedComplete = async () => {
        await setTimeout(delay);

        this.awaitingAuditEvents.delete(key);

        if (completeAuditEventFn) {
          await completeAuditEventFn(auditEventId, new Date());
        }
      };
      void timedComplete();

      return auditEventId;
    }

    return null;
  }
}
