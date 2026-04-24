/**
 * Module-level map: customerRecordId → escalation start timestamp (ms).
 * Persists across component unmount/remount so the timer survives
 * the toast → review modal transition without resetting.
 */
export const escalationStartTimes = new Map<string, number>();

/** Records the start time for a given customer (no-op if already set). */
export function recordEscalationStart(customerRecordId: string, at = Date.now()) {
  if (!escalationStartTimes.has(customerRecordId)) {
    escalationStartTimes.set(customerRecordId, at);
  }
}

/** Returns the start time for a customer, falling back to now (and recording it). */
export function getEscalationStart(customerRecordId: string): number {
  recordEscalationStart(customerRecordId);
  return escalationStartTimes.get(customerRecordId)!;
}
