import React, { useState, useEffect } from 'react';
import ReactECharts from 'echarts-for-react';

const EvolutionChart = () => {
    // --- ESTADOS ---
    const [activeSex, setActiveSex] = useState('Masculino');
    const [activeAgeCategory, setActiveAgeCategory] = useState('Absoluto');
    const [chartData, setChartData] = useState({});
    const [loading, setLoading] = useState(true);

    // --- CONFIGURACIÓN ---
    const sexes = ['Masculino', 'Femenino'];
    const ageCategories = ['Subjunior', 'Junior', 'Absoluto', 'Master'];
    const YEARS_TO_SHOW = 10; // Mostrar últimos 10 años

    // --- FETCH DATOS ---
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // Mapeo para el backend (Masculino -> M, Femenino -> F)
                const sexParam = activeSex === 'Masculino' ? 'M' : 'F';
                
                const response = await fetch(
                    `http://localhost:8000/analytics/year-max-totals?sex=${sexParam}&category=${activeAgeCategory}`
                );
                
                if (!response.ok) throw new Error('Error en la API');
                
                const data = await response.json();
                setChartData(data);
            } catch (error) {
                console.error("Error cargando gráfica:", error);
                setChartData({});
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [activeSex, activeAgeCategory]);

    // --- GENERAR OPCIONES GRÁFICA ---
    const getChartOption = () => {
        const colors = ['#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de', '#3ba272', '#fc8452', '#9a60b4', '#ea7ccc'];
        
        // 1. Calcular rango de años
        const currentYear = new Date().getFullYear();
        const startYear = currentYear - YEARS_TO_SHOW;

        // 2. Obtener todos los años válidos para el Eje X
        const allYearsSet = new Set();
        Object.keys(chartData).forEach(key => {
            // Ignoramos categorías basura para el cálculo de años
            if (key === 'nan' || key === 'null' || !key) return;

            chartData[key].forEach(point => {
                const year = parseInt(point[0]);
                const val = point[1];
                // Solo añadimos el año si tiene datos válidos y está en el rango
                if (year >= startYear && val !== null && !isNaN(val)) {
                    allYearsSet.add(point[0]);
                }
            });
        });

        // Fallback: Si no hay datos, rellenamos con años vacíos para que no rompa
        if (allYearsSet.size === 0) {
            for (let i = 0; i <= YEARS_TO_SHOW; i++) {
                allYearsSet.add((startYear + i).toString());
            }
        }

        // Ordenar años cronológicamente
        const sortedYears = Array.from(allYearsSet).sort((a, b) => parseInt(a) - parseInt(b));

        // 3. Procesar Series (Líneas)
        const series = Object.keys(chartData)
            // FILTRO 1: Eliminar categorías "nan" o nulas
            .filter(weightClass => 
                weightClass && 
                weightClass !== 'nan' && 
                weightClass !== 'null' && 
                weightClass !== 'undefined'
            )
            // ORDENAR: Numéricamente (-93 antes que -105)
            .sort((a, b) => {
                const cleanA = parseFloat(a.replace('+', '').replace('-', ''));
                const cleanB = parseFloat(b.replace('+', '').replace('-', ''));
                return (cleanA || 999) - (cleanB || 999);
            })
            .map(weightClass => {
                // FILTRO 2: Eliminar puntos nulos o fuera de rango dentro de la línea
                const filteredData = chartData[weightClass]
                    .filter(point => {
                        const year = parseInt(point[0]);
                        const total = point[1];
                        
                        const isInRange = year >= startYear;
                        const isValidNumber = total !== null && total !== undefined && !isNaN(total);
                        
                        return isInRange && isValidNumber;
                    })
                    .sort((a, b) => parseInt(a[0]) - parseInt(b[0]));

                return {
                    name: weightClass,
                    type: 'line',
                    data: filteredData, 
                    smooth: true,
                    showSymbol: true,
                    symbolSize: 6,
                    connectNulls: true, // Conecta si falta un año intermedio
                    endLabel: {
                        show: true,
                        formatter: '{a}',
                        distance: 10
                    },
                    lineStyle: { width: 3 },
                    emphasis: { focus: 'series' }
                };
            })
            // Eliminar series que se quedaron vacías tras el filtrado
            .filter(serie => serie.data.length > 0);

        return {
            color: colors,
            grid: {
                left: '3%',
                right: '10%', // Margen derecho para las etiquetas endLabel
                bottom: '10%',
                top: '15%',
                containLabel: true
            },
            tooltip: {
                trigger: 'axis',
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                textStyle: { color: '#1f2937' },
                formatter: function (params) {
                    if (params.length === 0) return '';
                    
                    let result = `<div style="margin-bottom: 6px; font-weight: bold; color: #374151; border-bottom: 1px solid #eee; padding-bottom: 4px;">Año ${params[0].axisValue}</div>`;
                    
                    // Filtramos nulos y ordenamos por total
                    const validParams = params.filter(p => p.value[1] !== null && !isNaN(p.value[1]));
                    validParams.sort((a, b) => b.value[1] - a.value[1]);
                    
                    validParams.forEach(param => {
                        // param.value es [Año, Total, Nombre]
                        const total = param.value[1];
                        const athleteName = param.value[2] || 'Desconocido'; // Leemos el nombre (índice 2)
                        
                        result += `
                            <div style="margin-top: 6px; font-size: 13px;">
                                <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 2px;">
                                    ${param.marker} 
                                    <span style="font-weight: 600; color: #4b5563;">${param.seriesName}</span>
                                    <span style="margin-left: auto; font-weight: 700; color: #111;">${total} kg</span>
                                </div>
                                <div style="color: #6b7280; font-size: 11px; padding-left: 14px;">
                                    ${athleteName}
                                </div>
                            </div>`;
                    });
                    return result;
                }
            },
            legend: {
                data: series.map(s => s.name),
                type: 'scroll',
                bottom: 0,
                textStyle: { color: '#9ca3af' }
            },
            xAxis: {
                type: 'category',
                boundaryGap: false,
                data: sortedYears,
                axisLine: { lineStyle: { color: '#374151' } },
                axisLabel: { color: '#9ca3af' }
            },
            yAxis: {
                type: 'value',
                name: 'Total (kg)',
                nameTextStyle: { color: '#9ca3af', padding: [0, 0, 0, 20] },
                splitLine: { lineStyle: { type: 'dashed', color: '#374151' } },
                axisLabel: { color: '#9ca3af' },
                scale: true // Ajuste dinámico del eje Y
            },
            series: series.length > 0 ? series : [{ type: 'line', data: [] }]
        };
    };

    // --- RENDERIZADO ---
    return (
        <div className="evolution-chart-card">
            {/* Cabecera */}
            <div className="evolution-chart-header">
                <div>
                    <h3 className="evolution-chart-title">Evolución de Récords de Total</h3>
                    <p className="evolution-chart-subtitle">
                        Mejores marcas anuales por categoría de peso en la última década
                    </p>
                </div>
                
                {/* Controles */}
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

            {/* Gráfica ECharts */}
            <div className="evolution-chart-container">
                {loading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#9ca3af' }}>
                        Cargando datos...
                    </div>
                ) : (
                    <ReactECharts 
                        option={getChartOption()} 
                        style={{ height: '100%', width: '100%' }}
                        opts={{ renderer: 'svg' }}
                        notMerge={true} // Importante para refrescar completamente al cambiar filtros
                    />
                )}
            </div>
        </div>
    );
};

export default EvolutionChart;