import React, { useState } from 'react';
import ReactECharts from 'echarts-for-react';
import '../../styles/Home.css';

const getChartOption = (activeSex, activeAgeCategory) => {
    // Generate realistic-looking data for weight classes
    // Men's classes: 53, 59, 66, 74, 83, 93, 105, 120, +120
    // Women's classes: 43, 47, 52, 57, 63, 69, 76, 84, +84
    
    const menClasses = ['-53', '-59', '-66', '-74', '-83', '-93', '-105', '-120', '+120'];
    const womenClasses = ['-43', '-47', '-52', '-57', '-63', '-69', '-76', '-84', '+84'];
    
    const currentClasses = activeSex === 'Masculino' ? menClasses : womenClasses;
    
    // Base multipliers for age category
    const ageMultiplier = activeAgeCategory === 'Subjunior' ? 0.8 : activeAgeCategory === 'Junior' ? 0.92 : 1.0;

    // Helper to generate an increasing trend with random variations around a base max
    const generateTrend = (baseMax) => {
        const trend = [];
        let current = baseMax * 0.7; // Start at 70% of potential max
        for (let i = 0; i < 16; i++) {
            current += (Math.random() * 20) - 5; // Mostly increase
            if (current > baseMax) current = baseMax; // Cap at max
            trend.push(Math.round(current * ageMultiplier));
        }
        return trend;
    };

    // Define approximate max totals for each weight class (Men/Women logic simplified for mock)
    // Heavier classes generally lift more
    const classMaxTotals = activeSex === 'Masculino' 
        ? [450, 550, 650, 750, 825, 880, 920, 960, 1000] // Men
        : [300, 380, 420, 480, 520, 560, 600, 640, 680]; // Women

    const series = currentClasses.map((weightClass, index) => {
        const data = generateTrend(classMaxTotals[index] || 500);
        return {
            name: weightClass,
            type: 'line',
            smooth: true,
            showSymbol: false,
            lineStyle: { width: 2 },
            emphasis: { focus: 'series' },
            data: data
        };
    });

    return {
        grid: {
            left: '3%',
            right: '4%',
            bottom: '3%',
            containLabel: true
        },
        tooltip: {
            trigger: 'axis',
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            borderRadius: 8,
            padding: 12,
            textStyle: {
                color: '#1f2937'
            },
            formatter: function (params) {
                let result = `<div style="margin-bottom: 4px; font-weight: bold; color: #6b7280;">${params[0].axisValue}</div>`;
                // Sort params by value descending for better readability
                params.sort((a, b) => b.data - a.data);
                params.forEach(param => {
                    result += `
                        <div style="display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-top: 4px;">
                            <div style="display: flex; align-items: center; gap: 6px;">
                                ${param.marker}
                                <span style="font-size: 13px;">${param.seriesName}</span>
                            </div>
                            <span style="font-weight: 700; font-size: 13px;">${param.data} kg</span>
                        </div>
                    `;
                });
                return result;
            }
        },
        xAxis: {
            type: 'category',
            boundaryGap: false,
            data: ['2011', '2012', '2013', '2014', '2015', '2016', '2017', '2018', '2019', '2020', '2021', '2022', '2023', '2024', '2025', '2026'],
            axisLine: { show: true, lineStyle: { color: '#e5e7eb' } },
            axisTick: { show: false },
            axisLabel: { color: '#6b7280' }
        },
        yAxis: {
            type: 'value',
            max: 1000,
            splitLine: { show: false },
            axisLine: { show: true, lineStyle: { color: '#e5e7eb' } },
            axisLabel: { color: '#6b7280' }
        },
        series: series
    };
};

const EvolutionChart = () => {
    const [activeSex, setActiveSex] = useState('Masculino');
    const [activeAgeCategory, setActiveAgeCategory] = useState('Absoluto');

    const sexes = ['Masculino', 'Femenino'];
    const ageCategories = ['Subjunior', 'Junior', 'Absoluto'];

    // Generate the chart option
    const chartOption = getChartOption(activeSex, activeAgeCategory);

    return (
        <div className="evolution-chart-card">
            <div className="evolution-chart-header">
                <div>
                    <h3 className="evolution-chart-title">Evolución Récord España (Total)</h3>
                    <p className="evolution-chart-subtitle">Evolución por categoría de peso</p>
                </div>
                <div className="evolution-chart-controls">
                    <div className="evolution-chart-filters">
                        {sexes.map(sex => (
                            <button
                                key={sex}
                                className={`filter-button ${activeSex === sex ? 'active' : ''}`}
                                onClick={() => setActiveSex(sex)}
                            >
                                {sex}
                            </button>
                        ))}
                    </div>
                    
                    <div className="evolution-chart-filters">
                        {ageCategories.map(cat => (
                            <button
                                key={cat}
                                className={`filter-button ${activeAgeCategory === cat ? 'active' : ''}`}
                                onClick={() => setActiveAgeCategory(cat)}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
            <div className="evolution-chart-container">
                <ReactECharts 
                    option={chartOption} 
                    style={{ height: '100%', width: '100%' }}
                    opts={{ renderer: 'svg' }}
                    notMerge={true} 
                />
            </div>
        </div>
    );
};

export default EvolutionChart;
