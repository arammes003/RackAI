import ReactECharts from 'echarts-for-react';
import { RefreshCcw, UserMinus, Repeat, TrendingUp } from 'lucide-react';
import StatCard from '../../components/StatCard/StatCard';
import ChartCard from '../../components/ChartCard/ChartCard';
import DataTable from '../../components/DataTable/DataTable';
import { retentionDistribution, retentionByYear, atRiskAthletes, summaryStats } from '../../data/mockData';

export default function Retention() {
  const retDistOption = {
    textStyle: { color: '#94a3b8', fontFamily: 'Inter' },
    tooltip: { trigger: 'axis', backgroundColor: '#1e293b', borderColor: '#334155', textStyle: { color: '#f1f5f9' }, formatter: (p) => `${p[0].name} competiciones<br/>${p[0].data.athletes} atletas (${p[0].data.pct}%)` },
    grid: { left: 50, right: 30, top: 20, bottom: 40 },
    xAxis: { type: 'category', data: retentionDistribution.map(d => d.competitions), axisLine: { lineStyle: { color: '#334155' } }, axisLabel: { color: '#64748b' } },
    yAxis: { type: 'value', name: 'Atletas', nameTextStyle: { color: '#64748b' }, axisLine: { lineStyle: { color: '#334155' } }, splitLine: { lineStyle: { color: '#1e293b' } }, axisLabel: { color: '#64748b' } },
    series: [{
      type: 'bar',
      data: retentionDistribution.map(d => ({
        value: d.athletes,
        athletes: d.athletes,
        pct: d.pct,
        itemStyle: { color: d.competitions === '1' ? '#ef4444' : d.competitions === '2' ? '#f59e0b' : '#10b981', borderRadius: [4, 4, 0, 0] },
      })),
      barWidth: '55%',
      label: { show: true, position: 'top', color: '#f1f5f9', fontSize: 11, fontWeight: 600, formatter: (p) => `${p.data.pct}%` },
    }],
  };

  const retYearOption = {
    textStyle: { color: '#94a3b8', fontFamily: 'Inter' },
    tooltip: { trigger: 'axis', backgroundColor: '#1e293b', borderColor: '#334155', textStyle: { color: '#f1f5f9' } },
    grid: { left: 50, right: 30, top: 30, bottom: 40 },
    xAxis: { type: 'category', data: retentionByYear.map(d => d.year), axisLine: { lineStyle: { color: '#334155' } }, axisLabel: { color: '#64748b' } },
    yAxis: { type: 'value', name: '%', nameTextStyle: { color: '#64748b' }, axisLine: { lineStyle: { color: '#334155' } }, splitLine: { lineStyle: { color: '#1e293b' } }, axisLabel: { color: '#64748b' } },
    series: [{
      name: 'Retención', type: 'line', data: retentionByYear.map(d => d.rate),
      smooth: true, lineStyle: { color: '#10b981', width: 3 }, symbol: 'circle', symbolSize: 8, itemStyle: { color: '#10b981' },
      areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(16, 185, 129, 0.2)' }, { offset: 1, color: 'rgba(16, 185, 129, 0)' }] } },
      markLine: { data: [{ yAxis: 50, label: { color: '#f59e0b', formatter: 'Objetivo 50%' }, lineStyle: { color: '#f59e0b', type: 'dashed' } }] },
    }],
  };

  const funnelOption = {
    textStyle: { color: '#94a3b8', fontFamily: 'Inter' },
    tooltip: { trigger: 'item', backgroundColor: '#1e293b', borderColor: '#334155', textStyle: { color: '#f1f5f9' } },
    series: [{
      type: 'funnel', left: '10%', top: 20, bottom: 20, width: '80%',
      sort: 'descending', gap: 4,
      label: { show: true, position: 'inside', color: '#f1f5f9', fontSize: 11, fontWeight: 600 },
      labelLine: { show: false },
      itemStyle: { borderColor: '#1e293b', borderWidth: 2 },
      data: [
        { value: 6065, name: 'Todos (6,065)', itemStyle: { color: '#64748b' } },
        { value: 3003, name: '2+ comps (3,003)', itemStyle: { color: '#f59e0b' } },
        { value: 1135, name: '3+ comps (1,135)', itemStyle: { color: '#3b82f6' } },
        { value: 454, name: '6+ comps (454)', itemStyle: { color: '#8b5cf6' } },
        { value: 94, name: '11+ comps (94)', itemStyle: { color: '#10b981' } },
      ],
    }],
  };

  const riskColumns = [
    { key: 'name', label: 'Atleta', className: 'cell-name' },
    { key: 'sex', label: 'Sexo', render: (v) => <span className={`cell-badge ${v === 'M' ? 'male' : 'female'}`}>{v === 'M' ? 'H' : 'M'}</span> },
    { key: 'weightClass', label: 'Categoría', render: (v) => `-${v} kg` },
    { key: 'totalComps', label: 'Total Comps' },
    { key: 'bestDots', label: 'Mejor DOTS', className: 'cell-highlight' },
    { key: 'lastComp', label: 'Última Comp.', render: (v) => new Date(v).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }) },
    { key: 'risk', label: 'Riesgo', render: (_, row) => {
      const months = Math.round((new Date() - new Date(row.lastComp)) / (30 * 24 * 60 * 60 * 1000));
      return <span className={`cell-badge ${months > 20 ? 'error' : 'warning'}`}>{months}m sin competir</span>;
    }},
  ];

  return (
    <div className="page-container">
      <h1 className="page-title">Retención</h1>
      <p className="page-subtitle">Engagement, churn y fidelización de atletas españoles</p>

      <div className="stats-grid">
        <StatCard icon={RefreshCcw} label="Tasa de Retención" value={`${summaryStats.retentionRate}%`} delta={2.4} deltaLabel="vs 2024" />
        <StatCard icon={UserMinus} label="Tasa de Churn" value={`${summaryStats.churnRate}%`} delta={-2.4} deltaLabel="vs 2024" color="red" />
        <StatCard icon={Repeat} label="Frecuencia Media" value={`${summaryStats.avgCompsPerAthlete} comps`} delta={0.3} color="blue" />
        <StatCard icon={TrendingUp} label="Atletas en Riesgo" value={atRiskAthletes.length} color="orange" />
      </div>

      <div className="charts-grid">
        <ChartCard title="Distribución de Frecuencia" subtitle="¿Cuántas veces compiten los atletas?">
          <ReactECharts option={retDistOption} style={{ height: 320 }} />
        </ChartCard>

        <ChartCard title="Funnel de Retención" subtitle="Pipeline de atletas por frecuencia competitiva">
          <ReactECharts option={funnelOption} style={{ height: 320 }} />
        </ChartCard>
      </div>

      <ChartCard title="Tasa de Retención Anual" subtitle="% de atletas que repiten competición año a año" className="chart-full">
        <ReactECharts option={retYearOption} style={{ height: 300 }} />
      </ChartCard>

      <div style={{ marginTop: 'var(--spacing-xl)' }}>
        <ChartCard title={`Atletas en Riesgo de Abandono (${atRiskAthletes.length})`} subtitle="Sin competir en los últimos 18+ meses">
          <DataTable columns={riskColumns} data={atRiskAthletes} />
        </ChartCard>
      </div>
    </div>
  );
}
