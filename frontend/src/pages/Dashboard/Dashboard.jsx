import { useState } from 'react';
import ReactECharts from 'echarts-for-react';
import { Users, Trophy, TrendingUp, Target } from 'lucide-react';
import StatCard from '../../components/StatCard/StatCard';
import ChartCard from '../../components/ChartCard/ChartCard';
import DataTable from '../../components/DataTable/DataTable';
import { summaryStats, growthTrends, weightClassDistribution, competitions } from '../../data/mockData';
import './Dashboard.css';

const chartTheme = {
  textStyle: { color: '#94a3b8', fontFamily: 'Inter' },
  legend: { textStyle: { color: '#94a3b8' } },
};

export default function Dashboard() {
  const [sexFilter, setSexFilter] = useState('M');

  const growthOption = {
    ...chartTheme,
    tooltip: { trigger: 'axis', backgroundColor: '#1e293b', borderColor: '#334155', textStyle: { color: '#f1f5f9' } },
    grid: { left: 50, right: 30, top: 40, bottom: 40 },
    xAxis: { type: 'category', data: growthTrends.map(d => d.year), axisLine: { lineStyle: { color: '#334155' } }, axisLabel: { color: '#64748b' } },
    yAxis: [
      { type: 'value', name: 'Atletas', nameTextStyle: { color: '#64748b' }, axisLine: { lineStyle: { color: '#334155' } }, splitLine: { lineStyle: { color: '#1e293b' } }, axisLabel: { color: '#64748b' } },
      { type: 'value', name: 'Comps', nameTextStyle: { color: '#64748b' }, axisLine: { lineStyle: { color: '#334155' } }, splitLine: { show: false }, axisLabel: { color: '#64748b' } },
    ],
    series: [
      {
        name: 'Atletas', type: 'bar', data: growthTrends.map(d => d.athletes),
        itemStyle: { color: '#10b981', borderRadius: [4, 4, 0, 0] }, barWidth: '40%',
      },
      {
        name: 'Competiciones', type: 'line', yAxisIndex: 1,
        data: growthTrends.map(d => d.competitions),
        lineStyle: { color: '#3b82f6', width: 3 }, symbol: 'circle', symbolSize: 8,
        itemStyle: { color: '#3b82f6' }, smooth: true,
      },
    ],
    legend: { ...chartTheme.legend, data: ['Atletas', 'Competiciones'], top: 0 },
  };

  const genderOption = {
    ...chartTheme,
    tooltip: { trigger: 'item', backgroundColor: '#1e293b', borderColor: '#334155', textStyle: { color: '#f1f5f9' } },
    series: [{
      type: 'pie', radius: ['55%', '80%'], center: ['50%', '55%'],
      avoidLabelOverlap: false,
      label: { show: true, position: 'center', formatter: '{total|6,065}\n{label|Total}',
        rich: {
          total: { fontSize: 28, fontWeight: 700, fontFamily: 'Oswald', color: '#f1f5f9', lineHeight: 36 },
          label: { fontSize: 12, color: '#64748b', lineHeight: 20 },
        },
      },
      data: [
        { value: summaryStats.maleAthletes, name: 'Hombres', itemStyle: { color: '#3b82f6' } },
        { value: summaryStats.femaleAthletes, name: 'Mujeres', itemStyle: { color: '#ec4899' } },
      ],
      emphasis: { itemStyle: { shadowBlur: 20, shadowColor: 'rgba(0, 0, 0, 0.5)' } },
    }],
    legend: { ...chartTheme.legend, bottom: 0, data: ['Hombres', 'Mujeres'] },
  };

  const wcData = weightClassDistribution[sexFilter];
  const wcOption = {
    ...chartTheme,
    tooltip: { trigger: 'axis', backgroundColor: '#1e293b', borderColor: '#334155', textStyle: { color: '#f1f5f9' } },
    grid: { left: 50, right: 20, top: 20, bottom: 40 },
    xAxis: { type: 'category', data: wcData.map(d => d.weightClass), axisLine: { lineStyle: { color: '#334155' } }, axisLabel: { color: '#64748b' } },
    yAxis: { type: 'value', axisLine: { lineStyle: { color: '#334155' } }, splitLine: { lineStyle: { color: '#1e293b' } }, axisLabel: { color: '#64748b' } },
    series: [{
      type: 'bar', data: wcData.map(d => d.count),
      itemStyle: { color: sexFilter === 'M' ? '#3b82f6' : '#ec4899', borderRadius: [4, 4, 0, 0] },
      barWidth: '60%',
    }],
  };

  const recentComps = competitions
    .filter(c => c.status === 'completed')
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5);

  const compColumns = [
    { key: 'name', label: 'Competición', className: 'cell-name' },
    { key: 'date', label: 'Fecha', render: (v) => new Date(v).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }) },
    { key: 'federation', label: 'Fed.', render: (v) => <span className={`cell-badge ${v === 'AEP' ? 'male' : 'success'}`}>{v}</span> },
    { key: 'town', label: 'Ciudad' },
    { key: 'participants', label: 'Participantes', className: 'cell-highlight' },
  ];

  return (
    <div className="page-container">
      <h1 className="page-title">Dashboard</h1>
      <p className="page-subtitle">Vista general del powerlifting en España — Datos actualizados a Marzo 2026</p>

      <div className="stats-grid">
        <StatCard icon={Users} label="Total Atletas" value={summaryStats.totalAthletes.toLocaleString()} delta={summaryStats.growthYoY} deltaLabel="vs 2024" />
        <StatCard icon={Trophy} label="Competiciones 2025" value={summaryStats.competitionsYTD2025} delta={46} deltaLabel="vs 2024" color="blue" />
        <StatCard icon={TrendingUp} label="Crecimiento YoY" value={`${summaryStats.growthYoY}%`} delta={summaryStats.growthYoY} color="purple" />
        <StatCard icon={Target} label="Media DOTS" value={summaryStats.avgDots.toFixed(1)} delta={1.8} deltaLabel="vs 2024" color="orange" />
      </div>

      <div className="charts-grid">
        <ChartCard title="Evolución del Powerlifting en España" subtitle="Atletas únicos y competiciones por año (2015-2025)" className="chart-full">
          <ReactECharts option={growthOption} style={{ height: 360 }} />
        </ChartCard>

        <ChartCard title="Distribución por Sexo" subtitle="Atletas registrados en España">
          <ReactECharts option={genderOption} style={{ height: 300 }} />
        </ChartCard>

        <ChartCard
          title="Weight Classes Populares"
          subtitle="Resultados por categoría de peso"
          filters={['M', 'F']}
          activeFilter={sexFilter}
          onFilterChange={setSexFilter}
        >
          <ReactECharts option={wcOption} style={{ height: 300 }} />
        </ChartCard>
      </div>

      <ChartCard title="Últimas Competiciones" subtitle="Las 5 competiciones más recientes">
        <DataTable columns={compColumns} data={recentComps} />
      </ChartCard>
    </div>
  );
}
