import { useState } from 'react';
import ReactECharts from 'echarts-for-react';
import { Users, Search, Target, Trophy, Percent, ArrowLeft } from 'lucide-react';
import StatCard from '../../components/StatCard/StatCard';
import ChartCard from '../../components/ChartCard/ChartCard';
import DataTable from '../../components/DataTable/DataTable';
import { athletes, athleteHistory } from '../../data/mockData';
import './Athletes.css';

export default function Athletes() {
  const [search, setSearch] = useState('');
  const [selectedAthlete, setSelectedAthlete] = useState(null);

  const filtered = athletes.filter(a =>
    a.name.toLowerCase().includes(search.toLowerCase())
  );

  if (selectedAthlete) {
    const history = athleteHistory[selectedAthlete.id] || [];
    const winRate = history.length > 0
      ? ((history.filter(h => h.place === '1').length / history.length) * 100).toFixed(0)
      : 0;
    const lastResult = history[history.length - 1];
    const sqRatio = lastResult ? ((lastResult.squat / lastResult.total) * 100).toFixed(1) : 0;
    const bnRatio = lastResult ? ((lastResult.bench / lastResult.total) * 100).toFixed(1) : 0;
    const dlRatio = lastResult ? ((lastResult.deadlift / lastResult.total) * 100).toFixed(1) : 0;

    const progressOption = {
      textStyle: { color: '#94a3b8', fontFamily: 'Inter' },
      tooltip: { trigger: 'axis', backgroundColor: '#1e293b', borderColor: '#334155', textStyle: { color: '#f1f5f9' } },
      grid: { left: 60, right: 30, top: 30, bottom: 40 },
      xAxis: { type: 'category', data: history.map(h => h.date.slice(0, 7)), axisLine: { lineStyle: { color: '#334155' } }, axisLabel: { color: '#64748b', rotate: 30 } },
      yAxis: { type: 'value', name: 'Total (kg)', nameTextStyle: { color: '#64748b' }, axisLine: { lineStyle: { color: '#334155' } }, splitLine: { lineStyle: { color: '#1e293b' } }, axisLabel: { color: '#64748b' } },
      series: [
        { name: 'Total', type: 'line', data: history.map(h => h.total), smooth: true, lineStyle: { color: '#10b981', width: 3 }, symbol: 'circle', symbolSize: 8, itemStyle: { color: '#10b981' }, areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(16, 185, 129, 0.25)' }, { offset: 1, color: 'rgba(16, 185, 129, 0)' }] } } },
      ],
    };

    const dotsOption = {
      textStyle: { color: '#94a3b8', fontFamily: 'Inter' },
      tooltip: { trigger: 'axis', backgroundColor: '#1e293b', borderColor: '#334155', textStyle: { color: '#f1f5f9' } },
      grid: { left: 60, right: 30, top: 30, bottom: 40 },
      xAxis: { type: 'category', data: history.map(h => h.date.slice(0, 7)), axisLine: { lineStyle: { color: '#334155' } }, axisLabel: { color: '#64748b', rotate: 30 } },
      yAxis: { type: 'value', name: 'DOTS', nameTextStyle: { color: '#64748b' }, axisLine: { lineStyle: { color: '#334155' } }, splitLine: { lineStyle: { color: '#1e293b' } }, axisLabel: { color: '#64748b' } },
      series: [
        { name: 'DOTS', type: 'line', data: history.map(h => h.dots), smooth: true, lineStyle: { color: '#8b5cf6', width: 3 }, symbol: 'circle', symbolSize: 8, itemStyle: { color: '#8b5cf6' }, areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(139, 92, 246, 0.25)' }, { offset: 1, color: 'rgba(139, 92, 246, 0)' }] } } },
      ],
    };

    const radarOption = {
      textStyle: { color: '#94a3b8', fontFamily: 'Inter' },
      tooltip: { backgroundColor: '#1e293b', borderColor: '#334155', textStyle: { color: '#f1f5f9' } },
      radar: {
        indicator: [
          { name: 'Squat', max: 100 },
          { name: 'Bench', max: 100 },
          { name: 'Deadlift', max: 100 },
        ],
        axisLine: { lineStyle: { color: '#334155' } },
        splitLine: { lineStyle: { color: '#1e293b' } },
        splitArea: { areaStyle: { color: ['transparent'] } },
        axisName: { color: '#94a3b8' },
      },
      series: [{
        type: 'radar',
        data: [{ value: [parseFloat(sqRatio), parseFloat(bnRatio), parseFloat(dlRatio)], name: 'Ratio S/B/D', areaStyle: { color: 'rgba(16, 185, 129, 0.2)' }, lineStyle: { color: '#10b981', width: 2 }, itemStyle: { color: '#10b981' } }],
      }],
    };

    const histColumns = [
      { key: 'date', label: 'Fecha', render: (v) => new Date(v).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }) },
      { key: 'competition', label: 'Competición', className: 'cell-name' },
      { key: 'squat', label: 'Squat', render: v => `${v} kg` },
      { key: 'bench', label: 'Bench', render: v => `${v} kg` },
      { key: 'deadlift', label: 'Deadlift', render: v => `${v} kg` },
      { key: 'total', label: 'Total', className: 'cell-highlight', render: v => `${v} kg` },
      { key: 'dots', label: 'DOTS', className: 'cell-highlight' },
      { key: 'place', label: 'Puesto', render: (v) => <span className={`cell-badge ${v === '1' ? 'success' : ''}`}>{v === '1' ? '🥇' : v === '2' ? '🥈' : v === '3' ? '🥉' : `#${v}`}</span> },
    ];

    return (
      <div className="page-container">
        <button className="back-button" onClick={() => setSelectedAthlete(null)}>
          <ArrowLeft size={18} /> Volver al listado
        </button>

        <div className="athlete-profile-header">
          <div className="athlete-avatar-lg">{selectedAthlete.name.split(' ').map(n => n[0]).join('').slice(0, 2)}</div>
          <div>
            <h1 className="page-title">{selectedAthlete.name}</h1>
            <p className="page-subtitle">
              {selectedAthlete.sex === 'M' ? 'Hombre' : 'Mujer'} · -{selectedAthlete.weightClass} kg · {selectedAthlete.division}
            </p>
          </div>
        </div>

        <div className="stats-grid">
          <StatCard icon={Target} label="Mejor Total" value={`${selectedAthlete.bestTotal} kg`} color="blue" />
          <StatCard icon={Trophy} label="Mejor DOTS" value={selectedAthlete.bestDots} color="purple" />
          <StatCard icon={Percent} label="Win Rate" value={`${winRate}%`} color="orange" />
          <StatCard icon={Users} label="Competiciones" value={selectedAthlete.competitions} />
        </div>

        <div className="charts-grid">
          <ChartCard title="Progresión del Total" subtitle="Evolución del total en competición">
            <ReactECharts option={progressOption} style={{ height: 300 }} />
          </ChartCard>
          <ChartCard title="DOTS Trending" subtitle="Evolución del coeficiente DOTS">
            <ReactECharts option={dotsOption} style={{ height: 300 }} />
          </ChartCard>
        </div>

        <div className="charts-grid">
          <ChartCard title="Ratio S/B/D" subtitle="Distribución de fuerza por levantamiento">
            <ReactECharts option={radarOption} style={{ height: 280 }} />
          </ChartCard>
        </div>

        <ChartCard title="Historial Completo" subtitle={`${history.length} competiciones registradas`}>
          <DataTable columns={histColumns} data={[...history].reverse()} />
        </ChartCard>
      </div>
    );
  }

  return (
    <div className="page-container">
      <h1 className="page-title">Atletas</h1>
      <p className="page-subtitle">Búsqueda y perfiles de atletas españoles de powerlifting</p>

      <div className="athlete-search">
        <Search size={20} />
        <input type="text" placeholder="Buscar atleta por nombre..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="athletes-grid">
        {filtered.map(athlete => (
          <div key={athlete.id} className="athlete-card" onClick={() => setSelectedAthlete(athlete)}>
            <div className="athlete-avatar">{athlete.name.split(' ').map(n => n[0]).join('').slice(0, 2)}</div>
            <div className="athlete-info">
              <h3>{athlete.name}</h3>
              <p className="athlete-meta">
                <span className={`cell-badge ${athlete.sex === 'M' ? 'male' : 'female'}`}>{athlete.sex === 'M' ? 'H' : 'M'}</span>
                <span>-{athlete.weightClass} kg</span>
                <span>{athlete.division}</span>
              </p>
            </div>
            <div className="athlete-stats">
              <div className="athlete-stat">
                <span className="athlete-stat-value">{athlete.bestDots}</span>
                <span className="athlete-stat-label">DOTS</span>
              </div>
              <div className="athlete-stat">
                <span className="athlete-stat-value">{athlete.bestTotal}</span>
                <span className="athlete-stat-label">Total</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
