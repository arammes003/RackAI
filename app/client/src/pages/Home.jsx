import React, { useEffect, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import './Home.css';

const Home = () => {
  const [rankingsData, setRankingsData] = useState({ male: [], female: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRankings = async () => {
      try {
        const response = await fetch('http://localhost:8000/analytics/rankings?federation=ALL&limit=10&tested=TESTED');
        const data = await response.json();
        setRankingsData(data);
      } catch (error) {
        console.error("Error fetching rankings:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRankings();
  }, []);

  if (loading) return <div className="text-white p-10">Cargando Rankings...</div>;

  return (
    <div className="home-container">
      <h1 className="home-title">Dashboard</h1>
      <p className="home-subtitle">Resumen general del Powerlifting</p>
      
      <div className="rankings-grid">
         {/* Top 10 Male Chart */}
         <div className="stat-card" style={{ height: '50vh' }}>
            <div className="card-header" style={{ marginBottom: '1rem' }}>
               <h3 className="card-title">Top 10 Histórico Masculino</h3>
            </div>
            <div style={{ height: 'calc(100% - 40px)', width: '100%' }}>
                <ReactECharts 
                    option={{
                        tooltip: {
                            trigger: 'axis',
                            axisPointer: { type: 'cross' },
                            backgroundColor: 'rgba(255, 255, 255, 0.95)',
                            formatter: (params) => {
                                const data = rankingsData.male[params[0].dataIndex];
                                let tooltipHtml = `<div style="font-weight:bold; margin-bottom:5px; border-bottom:1px solid #eee; padding-bottom:5px;">
                                    ${data.name} <span style="font-weight:normal; font-size:0.85em; color:#666">(${data.federation})</span>
                                    </div>
                                    <div style="font-size:0.9em; margin-bottom:5px;">Cat: <strong>${data.weight_class}</strong> | Total: <strong>${data.total} kg</strong></div>`;
                                
                                params.forEach(param => {
                                    if(param.seriesName !== 'Placeholder') {
                                        tooltipHtml += `<div style="display:flex; justify-content:space-between; align-items:center; gap:10px;">
                                            <span>${param.marker} ${param.seriesName}</span>
                                            <span style="font-weight:bold">${param.value} ${param.seriesName === 'GL Points' ? 'pts' : 'kg'}</span>
                                        </div>`;
                                    }
                                });
                                return tooltipHtml;
                            }
                        },
                        legend: { 
                            data: ['Squat', 'Bench', 'Deadlift', 'GL Points'],
                            bottom: 0 
                        },
                        grid: { left: '3%', right: '3%', top: '10%', bottom: '10%', containLabel: true },
                        xAxis: {
                            type: 'category',
                            data: rankingsData.male.map(r => r.name),
                            axisLabel: { interval: 0, rotate: 25, fontSize: 10, width: 90, overflow: 'break' }
                        },
                        yAxis: [
                            { type: 'value', name: 'Kg', position: 'left', splitLine: { show: false } },
                            { type: 'value', name: 'GL Pts', position: 'right', splitLine: { show: true, lineStyle: { type: 'dashed' } } }
                        ],
                        series: [
                            {
                                name: 'Squat', type: 'bar', stack: 'total',
                                data: rankingsData.male.map(r => r.squat),
                                itemStyle: { color: '#3b82f6' }
                            },
                            {
                                name: 'Bench', type: 'bar', stack: 'total',
                                data: rankingsData.male.map(r => r.bench),
                                itemStyle: { color: '#ef4444' }
                            },
                            {
                                name: 'Deadlift', type: 'bar', stack: 'total',
                                data: rankingsData.male.map(r => r.deadlift),
                                itemStyle: { color: '#10b981', borderRadius: [4, 4, 0, 0] }
                            },
                            {
                                name: 'GL Points', type: 'line', yAxisIndex: 1, smooth: true,
                                data: rankingsData.male.map(r => r.score),
                                itemStyle: { color: '#f59e0b' },
                                lineStyle: { width: 3, shadowBlur: 5, shadowColor: 'rgba(245, 158, 11, 0.5)' }
                            }
                        ]
                    }}
                    style={{ height: '100%', width: '100%' }}
                    opts={{ renderer: 'canvas' }}
                />
            </div>
         </div>

         {/* Top 10 Female Chart */}
         <div className="stat-card" style={{ height: '550px' }}>
            <div className="card-header" style={{ marginBottom: '1rem' }}>
               <h3 className="card-title">Top 10 Histórico Femenino</h3>
            </div>
            <div style={{ height: 'calc(100% - 40px)', width: '100%' }}>
                <ReactECharts 
                    option={{
                        tooltip: {
                            trigger: 'axis',
                            axisPointer: { type: 'cross' },
                            backgroundColor: 'rgba(255, 255, 255, 0.95)',
                            formatter: (params) => {
                                const data = rankingsData.female[params[0].dataIndex];
                                let tooltipHtml = `<div style="font-weight:bold; margin-bottom:5px; border-bottom:1px solid #eee; padding-bottom:5px;">
                                    ${data.name} <span style="font-weight:normal; font-size:0.85em; color:#666">(${data.federation})</span>
                                    </div>
                                    <div style="font-size:0.9em; margin-bottom:5px;">Cat: <strong>${data.weight_class}</strong> | Total: <strong>${data.total} kg</strong></div>`;
                                
                                params.forEach(param => {
                                    if(param.seriesName !== 'Placeholder') {
                                        tooltipHtml += `<div style="display:flex; justify-content:space-between; align-items:center; gap:10px;">
                                            <span>${param.marker} ${param.seriesName}</span>
                                            <span style="font-weight:bold">${param.value} ${param.seriesName === 'GL Points' ? 'pts' : 'kg'}</span>
                                        </div>`;
                                    }
                                });
                                return tooltipHtml;
                            }
                        },
                        legend: { 
                            data: ['Squat', 'Bench', 'Deadlift', 'GL Points'],
                            bottom: 0 
                        },
                        grid: { left: '3%', right: '3%', top: '10%', bottom: '10%', containLabel: true },
                        xAxis: {
                            type: 'category',
                            data: rankingsData.female.map(r => r.name),
                            axisLabel: { interval: 0, rotate: 25, fontSize: 10, width: 90, overflow: 'break' }
                        },
                        yAxis: [
                            { type: 'value', name: 'Kg', position: 'left', splitLine: { show: false } },
                            { type: 'value', name: 'GL Pts', position: 'right', splitLine: { show: true, lineStyle: { type: 'dashed' } } }
                        ],
                        series: [
                            {
                                name: 'Squat', type: 'bar', stack: 'total',
                                data: rankingsData.female.map(r => r.squat),
                                itemStyle: { color: '#3b82f6' }
                            },
                            {
                                name: 'Bench', type: 'bar', stack: 'total',
                                data: rankingsData.female.map(r => r.bench),
                                itemStyle: { color: '#ef4444' }
                            },
                            {
                                name: 'Deadlift', type: 'bar', stack: 'total',
                                data: rankingsData.female.map(r => r.deadlift),
                                itemStyle: { color: '#10b981', borderRadius: [4, 4, 0, 0] }
                            },
                            {
                                name: 'GL Points', type: 'line', yAxisIndex: 1, smooth: true,
                                data: rankingsData.female.map(r => r.score),
                                itemStyle: { color: '#f59e0b' },
                                lineStyle: { width: 3, shadowBlur: 5, shadowColor: 'rgba(245, 158, 11, 0.5)' }
                            }
                        ]
                    }}
                    style={{ height: '100%', width: '100%' }}
                    opts={{ renderer: 'canvas' }}
                />
            </div>
         </div>
      </div>
    </div>
  );
};

export default Home;
