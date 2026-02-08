import ReactECharts from 'echarts-for-react';
import '../../styles/Home.css';

const StatCard = ({ title, value, trend, subtitle, icon: Icon, chartOption, color, positiveGreen }) => {
  return (
    <div className="stat-card">
      <div className="stat-card-header">
        <span className="stat-card-title">{title}</span>
        {Icon && <Icon className="stat-card-icon" size={20} style={{ color }} />}
      </div>
      
      <div className="stat-card-content">
        <div className="stat-card-value-container">
            <div className="stat-card-main-value">
                <span className="stat-card-value">{value}</span>
                {trend && (
                    <span className={`stat-card-trend ${trend > 0 ? (positiveGreen ? 'positive-green' : 'positive') : 'negative'}`}>
                    {trend > 0 ? '+' : ''}{trend}
                    </span>
                )}
            </div>
          <span className="stat-card-subtitle">{subtitle}</span>
        </div>
        
        <div className="stat-card-chart">
          <ReactECharts 
            option={chartOption} 
            style={{ height: '100%', width: '100%' }}
            opts={{ renderer: 'svg' }}
          />
        </div>
      </div>
    </div>
  );
};

export default StatCard;
