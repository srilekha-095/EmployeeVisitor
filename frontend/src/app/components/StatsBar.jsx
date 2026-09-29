export default function StatsBar({ stats }) {
  const items = [
    { label: 'Total Visitors', value: stats.total },
    { label: 'Today', value: stats.today },
    { label: 'Checked In', value: stats.checkedIn },
    { label: 'Checked Out', value: stats.checkedOut },
  ];

  return (
    <div className="stats-bar">
      {items.map((item) => (
        <div className="stat-card" key={item.label}>
          <span className="stat-value">{item.value}</span>
          <span className="stat-label">{item.label}</span>
        </div>
      ))}
    </div>
  );
}
