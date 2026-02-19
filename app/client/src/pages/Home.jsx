import React, { useEffect, useState } from 'react';
import StatCard from '../components/stats/StatCard';
import HighlightCard from '../components/stats/HighlightCard';
import UpcomingEventsCard from '../components/stats/UpcomingEventsCard';
import { Users, Trophy } from 'lucide-react';
import '../styles/Home.css';
import LeaderboardWidget from '../components/stats/LeaderboardTable';

const Home = () => {
    // 1. Estado unificado para guardar los datos procesados de todas las métricas
    const [stats, setStats] = useState({
        athletes: { 
            count: 0, 
            trend: 0, 
            history: { years: [], counts: [] } 
        },
        competitions: { 
            count: 0, 
            trend: 0, 
            history: { years: [], counts: [] } 
        },
        upcomingEvents: [], // Nuevo estado para eventos próximos
        loading: true
    });

    useEffect(() => {
        const fetchStats = async () => {
            try {
                // Fetch competitions history
                const competitionsResponse = await fetch('http://localhost:8000/analytics/competitions-per-year');
                // Fetch athletes history from Postgres
                const athletesResponse = await fetch('http://localhost:8000/analytics/athletes-per-year');
                // Fetch upcoming competitions
                const upcomingResponse = await fetch('http://localhost:8000/analytics/upcoming?limit=5');
                
                if (!competitionsResponse.ok) throw new Error(`HTTP error! status: ${competitionsResponse.status}`);
                
                const competitionsData = await competitionsResponse.json();
                const athletesData = athletesResponse.ok ? await athletesResponse.json() : [];
                const upcomingData = upcomingResponse.ok ? await upcomingResponse.json() : [];

                // --- FUNCIÓN HELPER (REUTILIZABLE) ---
                // Procesa un array de datos [{year: 2024, count: 100}, ...]
                const processGrowthData = (dataArray) => {
                    // Si no hay datos, devolvemos ceros
                    if (!Array.isArray(dataArray) || dataArray.length === 0) {
                        return { count: 0, trend: 0, history: { years: [], counts: [] } };
                    }

                    // 1. Ordenar por año (seguridad)
                    const sorted = [...dataArray].sort((a, b) => a.year - b.year);

                    // 2. Obtener año actual y anterior
                    const currentYear = new Date().getFullYear();
                    const prevYear = currentYear - 1;

                    // 3. Buscar valores
                    const currentItem = sorted.find(item => item.year === currentYear);
                    const prevItem = sorted.find(item => item.year === prevYear);

                    const currentCount = currentItem?.count || 0;
                    const prevCount = prevItem?.count || 0;

                    // 4. Calcular tendencia %
                    let trend = 0;
                    if (prevCount > 0) {
                        trend = ((currentCount - prevCount) / prevCount) * 100;
                    }

                    // 5. Extraer histórico (últimos 10 años para la gráfica)
                    const last10 = sorted.slice(-10);
                    
                    return {
                        count: currentCount,
                        trend: Math.round(trend),
                        history: {
                            years: last10.map(item => item.year),
                            counts: last10.map(item => item.count)
                        }
                    };
                };

                // Procesamos ambas series de datos
                const athleteStats = processGrowthData(athletesData);
                const competitionStats = processGrowthData(competitionsData);

                setStats({
                    athletes: athleteStats,
                    competitions: competitionStats,
                    upcomingEvents: upcomingData,
                    loading: false
                });

            } catch (error) {
                console.error("Error fetching home stats:", error);
                setStats(prev => ({ ...prev, loading: false }));
            }
        };

        fetchStats();
    }, []);

    // --- CONFIGURACIÓN DE GRÁFICAS (ECHARTS) ---

    // 1. Opciones Gráfica Atletas (Area Cian)
    const athletesChartOption = {
        tooltip: { trigger: 'axis', formatter: '{b}: {c} atletas' },
        grid: { left: 0, right: 0, top: 10, bottom: 0 },
        xAxis: { 
            type: 'category', 
            show: false, 
            boundaryGap: false,
            data: stats.athletes.history.years 
        },
        yAxis: { type: 'value', show: false },
        series: [{
            data: stats.athletes.history.counts,
            type: 'line',
            smooth: true,
            showSymbol: false,
            lineStyle: { width: 0 },
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

    // 2. Opciones Gráfica Competiciones (Barras Verdes)
    const competitionsChartOption = {
        tooltip: { trigger: 'axis', formatter: '{b}: {c} competiciones' },
        grid: { left: 0, right: 0, top: 20, bottom: 0 },
        xAxis: { 
            type: 'category', 
            show: false, 
            data: stats.competitions.history.years 
        },
        yAxis: { type: 'value', show: false },
        series: [{
            data: stats.competitions.history.counts,
            type: 'bar',
            barWidth: '60%',
            itemStyle: {
                borderRadius: [4, 4, 0, 0],
                color: '#10b981'
            }
        }]
    };

    // if (stats.loading) {
    //     return <div className="p-10 text-white">Cargando datos...</div>;
    // }

    const currentYearLabel = new Date().getFullYear();

    return (
        <div className="home-container">
            <div className="home-section">
                <h2 className="home-section-title">Resumen General</h2>
                <p className="home-section-subtitle">Evolución del Powerlifting en España</p>
                
                <div className="stats-grid">
                    {/* Tarjeta 1: Atletas */}
                    <StatCard 
                        title={`Atletas (${currentYearLabel})`}
                        value={stats.athletes.count.toLocaleString()}
                        trend={`${stats.athletes.trend}%`}
                        subtitle="vs año anterior"
                        icon={Users}
                        chartOption={athletesChartOption}
                        color="#06b6d4" 
                        positiveGreen={true}
                        loading={stats.loading}
                    />
                    
                    {/* Tarjeta 2: Competiciones (AHORA DINÁMICA) */}
                    <StatCard 
                        title={`Competiciones (${currentYearLabel})`}
                        value={stats.competitions.count.toLocaleString()}
                        trend={`${stats.competitions.trend}%`}
                        subtitle="vs año anterior"
                        icon={Trophy}
                        chartOption={competitionsChartOption}
                        color="#10b981"
                        positiveGreen={true} 
                        loading={stats.loading}
                    />


                    {/* Tarjeta 3: Highlight */}
                    <HighlightCard />
                    
                    {/* Tarjeta 4: Tabla de Clasificación */}
                    <LeaderboardWidget />

                     {/* Tarjeta 5: Próximas Competiciones */}
                     <UpcomingEventsCard events={stats.upcomingEvents} loading={stats.loading} />
                </div>
            </div>
        </div>
    );
};


export default Home;