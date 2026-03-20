import { useState, useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { Medal, Award, BarChart3 } from 'lucide-react';
import StatCard from '../../components/StatCard/StatCard';
import ChartCard from '../../components/ChartCard/ChartCard';
import DataTable from '../../components/DataTable/DataTable';
import { athletes, summaryStats } from '../../data/mockData';
import './Rankings.css';

export default function Rankings() {
  const [sexFilter, setSexFilter] = useState('Todos');
  const [wcFilter, setWcFilter] = useState('Todas');

  const filtered = useMemo(() => {
    let data = [...athletes];
    if (sexFilter !== 'Todos') data = data.filter(a => a.sex === sexFilter);
    if (wcFilter !== 'Todas') data = data.filter(a => a.weightClass === wcFilter);
    return data.sort((a, b) => b.bestDots - a.bestDots);
  }, [sexFilter, wcFilter]);

  const weightClasses = useMemo(() => {
    const wcs = [...new Set(athletes.filter(a => sexFilter === 'Todos' || a.sex === sexFilter).map(a => a.weightClass))];
    return ['Todas', ...wcs.sort((a, b) => parseFloat(a) - parseFloat(b))];
  }, [sexFilter]);

  const top10Option = {
    textStyle: { color: '#94a3b8', fontFamily: 'Inter' },
    tooltip: { trigger: 'axis', backgroundColor: '#1e293b', borderColor: '#334155', textStyle: { color: '#f1f5f9' } },
    grid: { left: 180, right: 40, top: 10, bottom: 10 },
    xAxis: { type: 'value', axisLine: { lineStyle: { color: '#334155' } }, splitLine: { lineStyle: { color: '#1e293b' } }, axisLabel: { color: '#64748b' } },
    yAxis: {
      type: 'category',
      data: filtered.slice(0, 10).map(a => a.name).reverse(),
      axisLine: { lineStyle: { color: '#334155' } },
      axisLabel: { color: '#94a3b8', fontSize: 12 },
    },
    series: [{
      type: 'bar',
      data: filtered.slice(0, 10).map(a => ({
        value: a.bestDots,
        itemStyle: { color: a.sex === 'F' ? '#ec4899' : '#3b82f6', borderRadius: [0, 4, 4, 0] },
      })).reverse(),
      barWidth: '60%',
      label: { show: true, position: 'right', color: '#f1f5f9', fontSize: 12, fontWeight: 600, fontFamily: 'Oswald' },
    }],
  };

  const rankColumns = [
    {
      key: 'rank', label: '#', width: '50px',
      render: (_, __, i) => {
        const cls = i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : '';
        return <span className={`cell-rank ${cls}`}>{i + 1}</span>;
      },
    },
    { key: 'name', label: 'Atleta', className: 'cell-name' },
    { key: 'sex', label: 'Sexo', render: (v) => <span className={`cell-badge ${v === 'M' ? 'male' : 'female'}`}>{v === 'M' ? 'Hombre' : 'Mujer'}</span> },
    { key: 'weightClass', label: 'Categoría', render: (v) => `-${v} kg` },
    { key: 'bestDots', label: 'DOTS', className: 'cell-highlight' },
    { key: 'bestTotal', label: 'Total (kg)', render: (v) => `${v} kg` },
    { key: 'competitions', label: 'Comps' },
  ];

  return (
    <div className="page-container">
      <h1 className="page-title">Rankings</h1>
      <p className="page-subtitle">Rankings nacionales por DOTS — Powerlifting España</p>

      <div className="stats-grid">
        <StatCard icon={Medal} label="Mejor DOTS Masculino" value={summaryStats.bestDotsM} color="blue" />
        <StatCard icon={Award} label="Mejor DOTS Femenino" value={summaryStats.bestDotsF} color="pink" />
        <StatCard icon={BarChart3} label="Media Nacional" value={summaryStats.avgDots.toFixed(1)} color="orange" />
      </div>

      <div className="rankings-filters">
        <div className="filter-group">
          <label>Sexo</label>
          <div className="filter-buttons">
            {['Todos', 'M', 'F'].map(f => (
              <button key={f} className={`filter-btn ${sexFilter === f ? 'active' : ''}`} onClick={() => { setSexFilter(f); setWcFilter('Todas'); }}>
                {f === 'Todos' ? 'Todos' : f === 'M' ? 'Hombres' : 'Mujeres'}
              </button>
            ))}
          </div>
        </div>
        <div className="filter-group">
          <label>Categoría</label>
          <select className="filter-select" value={wcFilter} onChange={e => setWcFilter(e.target.value)}>
            {weightClasses.map(wc => (
              <option key={wc} value={wc}>{wc === 'Todas' ? 'Todas' : `-${wc} kg`}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="charts-grid">
        <ChartCard title="Top 10 por DOTS" subtitle="Los mejores atletas de España" className="chart-full">
          <ReactECharts option={top10Option} style={{ height: 400 }} />
        </ChartCard>
      </div>

      <ChartCard title={`Ranking Completo (${filtered.length} atletas)`} subtitle="Ordenado por puntuación DOTS">
        <DataTable columns={rankColumns} data={filtered} />
      </ChartCard>
    </div>
  );
}
