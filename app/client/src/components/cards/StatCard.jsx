import React, { useEffect, useRef } from 'react';
import ReactECharts from 'echarts-for-react';
import '../../styles/StatCard.css';

const StatCard = ({ title, value, trend, subtitle, icon: Icon, chartOption, color, positiveGreen, loading }) => {
  const chartRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    let resizeTimer;
    const resizeObserver = new ResizeObserver(() => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            if (chartRef.current) {
                const chartInstance = chartRef.current.getEchartsInstance();
                chartInstance.resize({ animation: { duration: 0 } });
            }
        }, 320); 
    });

    if (containerRef.current) {
        resizeObserver.observe(containerRef.current);
    }

    return () => {
        clearTimeout(resizeTimer);
        if (containerRef.current) containerRef.current && resizeObserver.unobserve(containerRef.current);
    };
  }, []);

  if (loading) {
      return (
        <div className="stat-card">
            <div className="stat-card-header">
                <div className="skeleton rounded animate-pulse" style={{width: 48, height: 48, borderRadius: 12, flexShrink: 0}}></div>
                <div className="skeleton rounded w-1/3 animate-pulse" style={{height: '1rem', flex: 1, marginLeft: '0.75rem'}}></div>
            </div>
            <div className="stat-card-content">
                <div className="stat-card-value-container" style={{width: '50%'}}>
                    <div className="skeleton rounded w-full mb-2 animate-pulse" style={{height: '2.5rem'}}></div>
                    <div className="skeleton rounded w-1/2 animate-pulse" style={{height: '0.75rem'}}></div>
                </div>
                <div className="stat-card-chart opacity-50">
                    <div className="skeleton w-full h-full rounded animate-pulse"></div>
                </div>
            </div>
        </div>
      );
  }

  return (
    <div className="stat-card" ref={containerRef} style={{ '--icon-color': color }}>
      <div className="stat-card-header">
        {Icon && (
          <div className="stat-card-icon-box">
            <Icon className="stat-card-icon" size={22} />
          </div>
        )}
        <span className="stat-card-title">{title}</span>
      </div>
      
      <div className="stat-card-content">
        <div className="stat-card-value-container">
            <div className="stat-card-main-value">
                <span className="stat-card-value">{value}</span>
                {trend !== undefined && trend !== null && (
                    <span className={`stat-card-trend ${trend > 0 ? (positiveGreen ? 'positive-green' : 'positive') : 'negative'}`}>
                    {trend > 0 ? '+' : ''}{trend}%
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
