import React, { useEffect, useState } from 'react';
import StatCard from './StatCard'; // Asegúrate de que la ruta es correcta
import { API_URL } from '../../config/api';
import { Users } from 'lucide-react';

const ActiveAthletesCard = () => {
    const [data, setData] = useState({
        count: 0,
        trend: 0,
        history: { labels: [], counts: [] },
        loading: true
    });

    useEffect(() => {
        const fetchActiveAthletes = async () => {
            try {
                const res = await fetch(`${API_URL}/analytics/athletes-per-period`);
                if (!res.ok) throw new Error('Error al cargar atletas activos');
                
                const activeData = await res.json();

                let newCount = 0;
                let newTrend = 0;
                let newLabels = [];
                let newCounts = [];

                if (activeData) {
                    const current = activeData.total_current;
                    const prev = activeData.total_prev;
                    
                    newCount = current;
                    if (prev > 0) {
                        newTrend = Math.round(((current - prev) / prev) * 100);
                    }

                    const monthNames = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
                    const sparkline = activeData.sparkline_data || [];
                    
                    newLabels = sparkline.map(d => `${monthNames[d.month - 1]} ${d.year.toString().slice(-2)}`);
                    newCounts = sparkline.map(d => d.count);
                }

                setData({
                    count: newCount,
                    trend: newTrend,
                    history: { labels: newLabels, counts: newCounts },
                    loading: false
                });

            } catch (error) {
                console.error("Error fetching active athletes:", error);
                setData(prev => ({ ...prev, loading: false }));
            }
        };

        fetchActiveAthletes();
    }, []);

    // Opciones para ECharts (Área Cian)
    const chartOptions = {
        tooltip: { 
            trigger: 'axis', 
            formatter: (params) => {
                const val = params[0].value;
                return val !== null ? `${params[0].name}: ${val} atletas` : `${params[0].name}: Sin datos`;
            }
        },
        grid: { left: 0, right: 0, top: 10, bottom: 0 },
        xAxis: { 
            type: 'category', 
            show: false, 
            boundaryGap: false,
            data: data.history.labels 
        },
        yAxis: { type: 'value', show: false },
        series: [{
            data: data.history.counts,
            type: 'line',
            smooth: true,
            showSymbol: true,
            symbolSize: 6,
            lineStyle: { width: 2, color: '#22d3ee' },
            itemStyle: { color: '#22d3ee' },
            areaStyle: {
                color: {
                    type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
                    colorStops: [
                        { offset: 0, color: '#22d3ee' }, 
                        { offset: 1, color: 'rgba(34, 211, 238, 0.1)' }
                    ]
                }
            }
        }]
    };

    const currentYearLabel = new Date().getFullYear();

    return (
        <StatCard 
            title={`Atletas activos (${currentYearLabel})`}
            value={data.count.toLocaleString()}
            trend={data.trend} 
            subtitle="vs mismo periodo año anterior"
            icon={Users}
            chartOption={chartOptions}
            color="#06b6d4" 
            positiveGreen={true}
            loading={data.loading}
        />
    );
};

export default ActiveAthletesCard;