export default function StatusBadge({ status }) {
  const cls = status === 'Checked In' ? 'badge badge-in' : 'badge badge-out';
  return <span className={cls}>{status}</span>;
}
