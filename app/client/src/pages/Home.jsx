import React from 'react';
import StatCard from '../components/stats/StatCard';
import HighlightCard from '../components/stats/HighlightCard';
import { Users, Trophy } from 'lucide-react';
import adriImage from '../assets/adri.png';
import '../styles/Home.css';

const Home = () => {
    // Chart Options for "Atletas" (Cyan Area Chart)
    const athletesChartOption = {
        grid: { left: 0, right: 0, top: 10, bottom: 0 },
        xAxis: { type: 'category', show: false, boundaryGap: false },
        yAxis: { type: 'value', show: false },
        series: [
            {
                data: [30, 40, 25, 50, 45, 60, 55, 70, 60],
                type: 'line',
                smooth: true,
                showSymbol: false,
                lineStyle: { width: 0 },
                areaStyle: {
                    color: {
                        type: 'linear',
                        x: 0, y: 0, x2: 0, y2: 1,
                        colorStops: [
                            { offset: 0, color: '#22d3ee' }, // Cyan 400
                            { offset: 1, color: 'rgba(34, 211, 238, 0.1)' }
                        ]
                    }
                }
            }
        ]
    };

    // Chart Options for "Competiciones" (Green Bar Chart)
    const competitionsChartOption = {
        grid: { left: 0, right: 0, top: 20, bottom: 0 },
        xAxis: { type: 'category', show: false, data: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'] },
        yAxis: { type: 'value', show: false },
        series: [
            {
                data: [20, 10, 30, 15, 50, 25, 60, 80, 70],
                type: 'bar',
                barWidth: '60%',
                itemStyle: {
                    borderRadius: [4, 4, 0, 0],
                    color: '#10b981' // Emerald 500
                }
            }
        ]
    };

    return (
        <div className="home-container">
            <div>
                <h2 className="home-section-title">Resumen general</h2>
                <p className="home-section-subtitle">Evolución del Powerlifting en España.</p>
                
                <div className="stats-grid">
                    <StatCard 
                        title="Atletas (2026)"
                        value="7384"
                        trend={65}
                        subtitle="vs año anterior"
                        icon={Users}
                        chartOption={athletesChartOption}
                        color="#06b6d4" 
                    />
                    
                    <StatCard 
                        title="Competiciones (2026)"
                        value="142"
                        trend={12}
                        subtitle="vs año anterior"
                        icon={Trophy}
                        chartOption={competitionsChartOption}
                        color="#10b981"
                        positiveGreen={true} 
                    />

                    <HighlightCard 
                        title="MARCA DEL MES"
                        athleteName="Adrián Magaña Marín"
                        stats="320kg - Peso muerto"
                        category="-83 Open"
                        imageUrl={adriImage}
                    />
                </div>
            </div>
        </div>
    );
};

export default Home;
