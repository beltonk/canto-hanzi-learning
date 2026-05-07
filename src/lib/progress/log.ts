import type { ActivityLogEntry } from '../storage/types';

const MAX_LOG_ENTRIES = 1000;

export function appendLog(
  log: ActivityLogEntry[],
  entry: ActivityLogEntry
): ActivityLogEntry[] {
  const updated = [...log, entry];
  // Keep log bounded
  if (updated.length > MAX_LOG_ENTRIES) {
    return updated.slice(updated.length - MAX_LOG_ENTRIES);
  }
  return updated;
}
