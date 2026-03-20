import './ChartCard.css';

export default function ChartCard({ title, subtitle, filters, activeFilter, onFilterChange, children, className = '' }) {
  return (
    <div className={`chart-card ${className}`}>
      <div className="chart-card-header">
        <div>
          <h3 className="chart-card-title">{title}</h3>
          {subtitle && <p className="chart-card-subtitle">{subtitle}</p>}
        </div>
        {filters && (
          <div className="chart-card-actions">
            {filters.map((f) => (
              <button
                key={f}
                className={`chart-card-filter ${activeFilter === f ? 'active' : ''}`}
                onClick={() => onFilterChange?.(f)}
              >
                {f}
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="chart-card-body">
        {children}
      </div>
    </div>
  );
}
