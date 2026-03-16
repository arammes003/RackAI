import React, { useEffect, useState } from 'react';
import StatCard from './StatCard'; // Asegúrate de que la ruta sea correcta según tu estructura
import { API_URL } from '../../config/api';
import { Trophy } from 'lucide-react';

const AvgAthletesPerPeriodCard = () => {
    // Estado local para esta tarjeta
    const [data, setData] = useState({
        count: 0,
        trend: 0,
        history: { years: [], counts: [] },
        loading: true
    });

    useEffect(() => {
        const fetchAvgStats = async () => {
            try {
                // Hacemos el fetch solo de la media de eventos
                const res = await fetch(`${API_URL}/analytics/average-for-event`);
                if (!res.ok) throw new Error('Error al cargar el promedio de atletas');
                
                const avgEventData = await res.json();

                let currentAvg = 0;
                let avgTrend = 0;
                let years = [];
                let counts = [];

                if (avgEventData) {
                    currentAvg = avgEventData.current_avg || 0;
                    const prevAvg = avgEventData.prev_avg || 0;
                    
                    // Calculamos la tendencia en %
                    if (prevAvg > 0) {
                        avgTrend = Math.round(((currentAvg - prevAvg) / prevAvg) * 100);
                    }
                    
                    // Extraemos el histórico para la gráfica
                    const avgHistory = avgEventData.history || [];
                    years = avgHistory.map(item => item.year?.toString() || "");
                    counts = avgHistory.map(item => item.avg || 0);
                }

                setData({
                    count: currentAvg,
                    trend: avgTrend,
                    history: { years, counts },
                    loading: false
                });

            } catch (error) {
                console.error("Error fetching avg athletes:", error);
                setData(prev => ({ ...prev, loading: false }));
            }
        };

        fetchAvgStats();
    }, []);

    // Configuración ECharts (Gráfica de Barras Verdes)
    const chartOptions = {
        tooltip: { trigger: 'axis', formatter: '{b}: {c} atletas' },
        grid: { left: 0, right: 0, top: 20, bottom: 0 },
        xAxis: { 
            type: 'category', 
            show: false, 
            data: data.history.years 
        },
        yAxis: { type: 'value', show: false },
        series: [{
            data: data.history.counts,
            type: 'bar',
            barWidth: '60%',
            itemStyle: {
                borderRadius: [4, 4, 0, 0],
                color: '#10b981' // Verde esmeralda
            }
        }]
    };

    const currentYearLabel = new Date().getFullYear();

    return (
        <StatCard 
            title={`Promedio de Atletas / Comp. (${currentYearLabel})`}
            value={data.count.toLocaleString()}
            trend={data.trend}
            subtitle="vs mismo periodo año anterior"
            icon={Trophy}
            chartOption={chartOptions}
            color="#10b981"
            positiveGreen={true} 
            loading={data.loading}
        />
    );
};

export default AvgAthletesPerPeriodCard;