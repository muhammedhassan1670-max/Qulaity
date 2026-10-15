/**
 * QMS Enterprise 4.0 - Data Cleanup Utility
 * Safe stub: Never removes genuine user records or configurations.
 */

const CLEANUP_MARKER_KEY = 'qms-demo-data-cleanup-v2';

export function cleanupDemoData() {
  if (typeof window === 'undefined') return;
  // Mark as done without deleting any user records or local storage tables
  if (localStorage.getItem(CLEANUP_MARKER_KEY) !== 'done') {
    localStorage.setItem(CLEANUP_MARKER_KEY, 'done');
  }
}
