export const STATUSES = ['Checked In', 'Checked Out'];
export const STATUS_FILTERS = ['All', ...STATUSES];

export const ROLES = [
  { value: 'visitor', label: 'Visitor' },
  { value: 'student', label: 'Student' },
  { value: 'employee', label: 'Employee' },
];

export function fmtDateTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// Converts an ISO date to the "YYYY-MM-DDTHH:mm" format used by <input type="datetime-local">
export function toLocalInputValue(iso) {
  const d = iso ? new Date(iso) : new Date();
  const offset = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - offset).toISOString().slice(0, 16);
}
