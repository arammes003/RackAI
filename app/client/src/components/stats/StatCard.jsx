import React, { useEffect, useRef } from 'react';
import ReactECharts from 'echarts-for-react';
import '../../styles/Home.css';

const StatCard = ({ title, value, trend, subtitle, icon: Icon, chartOption, color, positiveGreen, loading }) => {
  const chartRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    // ResizeObserver to handle container size changes (e.g. menu collapse)
    const resizeObserver = new ResizeObserver(() => {
        if (chartRef.current) {
            const chartInstance = chartRef.current.getEchartsInstance();
            chartInstance.resize();
        }
    });

    if (containerRef.current) {
        resizeObserver.observe(containerRef.current);
    }

    return () => {
        if (containerRef.current) {
            resizeObserver.unobserve(containerRef.current);
        }
    };
  }, []);

  if (loading) {
      return (
        <div className="stat-card">
            <div className="stat-card-header">
                <div className="skeleton rounded w-1/3 animate-pulse" style={{height: '1rem'}}></div>
            </div>
            <div className="stat-card-content">
                <div className="stat-card-value-container" style={{width: '50%'}}>
                    <div className="skeleton rounded w-full mb-2 animate-pulse" style={{height: '2.5rem'}}></div>
                    <div className="skeleton rounded w-1/2 animate-pulse" style={{height: '0.75rem'}}></div>
                </div>
                <div className="stat-card-chart opacity-50">
                    {/* Placeholder chart area */}
                    <div className="skeleton w-full h-full rounded animate-pulse"></div>
                </div>
            </div>
        </div>
      );
  }

  return (
    <div className="stat-card" ref={containerRef}>
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
            ref={chartRef}
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
