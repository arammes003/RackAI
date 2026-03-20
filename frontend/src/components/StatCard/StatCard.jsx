import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import './StatCard.css';

export default function StatCard({ icon: Icon, label, value, delta, deltaLabel, color = '' }) {
  const deltaType = delta > 0 ? 'positive' : delta < 0 ? 'negative' : 'neutral';
  const DeltaIcon = delta > 0 ? TrendingUp : delta < 0 ? TrendingDown : Minus;

  return (
    <div className="stat-card">
      <div className={`stat-card-icon ${color}`}>
        <Icon size={24} />
      </div>
      <div className="stat-card-content">
        <p className="stat-card-label">{label}</p>
        <p className="stat-card-value">{value}</p>
        {delta !== undefined && (
          <span className={`stat-card-delta ${deltaType}`}>
            <DeltaIcon size={14} />
            {delta > 0 ? '+' : ''}{delta}%
            {deltaLabel && <span> {deltaLabel}</span>}
          </span>
        )}
      </div>
    </div>
  );
}
