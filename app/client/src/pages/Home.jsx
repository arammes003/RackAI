import React, { useEffect, useState } from 'react';
import StatCard from '../components/stats/StatCard';
import HighlightCard from '../components/stats/HighlightCard';
import UpcomingEventsCard from '../components/stats/UpcomingEventsCard';
import { Users, Trophy } from 'lucide-react';
import '../styles/Home.css';
import LeaderboardWidget from '../components/stats/LeaderboardTable';
import PageLayout from '../layouts/PageLayout';

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
                const competitionsResponse = await fetch('http://localhost:8000/api/v1/analytics/competitions-per-year');
                // Fetch athletes YTD and monthly stats
                const athletesResponse = await fetch('http://localhost:8000/api/v1/analytics/athletes-stats');
                // Fetch upcoming competitions
                const upcomingResponse = await fetch('http://localhost:8000/api/v1/analytics/upcoming-competitions?limit=5');
                // Fetch average for event
                const avgEventResponse = await fetch('http://localhost:8000/api/v1/analytics/average-for-event');
                
                if (!competitionsResponse.ok) throw new Error(`HTTP error! status: ${competitionsResponse.status}`);
                
                const competitionsData = await competitionsResponse.json();
                const athletesData = athletesResponse.ok ? await athletesResponse.json() : { ytd: { current: 0, prev: 0 }, monthly: [] };
                const upcomingData = upcomingResponse.ok ? await upcomingResponse.json() : [];
                const avgEventData = avgEventResponse.ok ? await avgEventResponse.json() : { current_avg: 0, prev_avg: 0 };

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

                // Procesamos la serie de competiciones (ahora lo sobreescribimos pero dejamos la llamada por si se usa después)
                const competitionStats = processGrowthData(competitionsData);
                
                // Usamos el YTD promedio por evento para los datos principales
                const currentAvg = avgEventData?.current_avg || 0;
                const prevAvg = avgEventData?.prev_avg || 0;
                let avgTrend = 0;
                if (prevAvg > 0) {
                    avgTrend = ((currentAvg - prevAvg) / prevAvg) * 100;
                }
                
                competitionStats.count = currentAvg;
                competitionStats.trend = Math.round(avgTrend);
                
                // Extraer el histórico (todos los años desde 2016) devuelto por avgEventData
                const avgHistory = avgEventData?.history || [];
                competitionStats.history = {
                    years: avgHistory.map(item => item.year.toString()),
                    counts: avgHistory.map(item => item.avg)
                };

                // Procesamos los nuevos datos de atletas (YTD y mensual)
                const currentYtd = athletesData?.ytd?.current || 0;
                const prevYtd = athletesData?.ytd?.prev || 0;
                let athleteTrend = 0;
                if (prevYtd > 0) {
                    athleteTrend = ((currentYtd - prevYtd) / prevYtd) * 100;
                }

                // Generar etiquetas de meses (rolling 12 months terminando en el actual)
                const monthNames = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
                const monthlyData = athletesData?.monthly || [];
                
                // 1. Determinar el mes y año actual
                const now = new Date();
                const currentMonthIndex = now.getMonth(); // 0-11
                const currentYear = now.getFullYear();

                // 2. Construir la ventana desde Enero del año pasado hasta el mes actual
                const rollingHistory = [];
                // Calcular cuántos meses hay desde Enero del año pasado hasta hoy
                // (12 meses completos del año pasado) + (mes actual index + 1)
                const totalMonths = 12 + currentMonthIndex + 1;
                
                for (let i = totalMonths - 1; i >= 0; i--) {
                    const d = new Date(currentYear, currentMonthIndex - i, 1);
                    rollingHistory.push({
                        year: d.getFullYear(),
                        month: d.getMonth() + 1, // 1-12
                        label: monthNames[d.getMonth()] + " " + d.getFullYear().toString().slice(2),
                        count: 0 // Default 0
                    });
                }

                // 3. Rellenar con los datos que vinieron de la BD
                monthlyData.forEach(item => {
                    const match = rollingHistory.find(r => r.year === item.year && r.month === item.month);
                    if (match) {
                        match.count = item.count;
                    }
                });

                const athleteStats = {
                    count: currentYtd,
                    trend: Math.round(athleteTrend),
                    history: {
                        years: rollingHistory.map(r => r.label),
                        counts: rollingHistory.map(r => r.count)
                    }
                };

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
            data: stats.athletes.history.years 
        },
        yAxis: { type: 'value', show: false },
        series: [{
            data: stats.athletes.history.counts,
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

    // 2. Opciones Gráfica Competiciones (Barras Verdes)
    const competitionsChartOption = {
        tooltip: { trigger: 'axis', formatter: '{b}: {c} atletas' },
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
        <PageLayout 
            title="Resumen General" 
            subtitle="Evolución del Powerlifting en España"
        >
            <div className="stats-grid">
                {/* Tarjeta 1: Atletas */}
                <StatCard 
                    title={`Atletas activos (${currentYearLabel})`}
                    value={stats.athletes.count.toLocaleString()}
                    trend={`${stats.athletes.trend}%`}
                    subtitle="vs mismo periodo año anterior"
                    icon={Users}
                    chartOption={athletesChartOption}
                    color="#06b6d4" 
                    positiveGreen={true}
                    loading={stats.loading}
                />
                
                {/* Tarjeta 2: Media Atletas por Competición (YTD) */}
                <StatCard 
                    title={`Promedio de Atletas / Comp. (${currentYearLabel})`}
                    value={stats.competitions.count.toLocaleString()}
                    trend={`${stats.competitions.trend}%`}
                    subtitle="vs mismo periodo año anterior"
                    icon={Trophy}
                    chartOption={competitionsChartOption}
                    color="#10b981"
                    positiveGreen={true} 
                    loading={stats.loading}
                />


                {/* Tarjeta 3: Highlight */}
                <HighlightCard  pauseOnHover={true}/>
                
                {/* Tarjeta 4: Tabla de Clasificación */}
                <LeaderboardWidget />

                {/* Tarjeta 5: Próximas Competiciones */}
                <UpcomingEventsCard events={stats.upcomingEvents} loading={stats.loading} />
            </div>
        </PageLayout>
    );
};


export default Home;