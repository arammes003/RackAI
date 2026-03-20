import ReactECharts from 'echarts-for-react';
import { Clock, Database, ImageIcon, CheckCircle, Server } from 'lucide-react';
import StatCard from '../../components/StatCard/StatCard';
import ChartCard from '../../components/ChartCard/ChartCard';
import DataTable from '../../components/DataTable/DataTable';
import { platformStats } from '../../data/mockData';

export default function Platform() {
  const gaugeOption = {
    series: [{
      type: 'gauge',
      startAngle: 210, endAngle: -30,
      min: 0, max: 72,
      center: ['50%', '60%'],
      radius: '90%',
      progress: { show: true, width: 18, itemStyle: { color: platformStats.dataFreshness < 24 ? '#10b981' : platformStats.dataFreshness < 48 ? '#f59e0b' : '#ef4444' } },
      axisLine: { lineStyle: { width: 18, color: [[1, '#1e293b']] } },
      axisTick: { show: false },
      splitLine: { show: false },
      axisLabel: { show: false },
      pointer: { show: false },
      title: { show: true, offsetCenter: [0, '30%'], color: '#64748b', fontSize: 12 },
      detail: {
        valueAnimation: true, offsetCenter: [0, '-5%'],
        fontSize: 36, fontWeight: 700, fontFamily: 'Oswald',
        color: platformStats.dataFreshness < 24 ? '#10b981' : '#f59e0b',
        formatter: '{value}h',
      },
      data: [{ value: platformStats.dataFreshness, name: 'Horas desde última sync' }],
    }],
  };

  const dbGrowthOption = {
    textStyle: { color: '#94a3b8', fontFamily: 'Inter' },
    tooltip: { trigger: 'axis', backgroundColor: '#1e293b', borderColor: '#334155', textStyle: { color: '#f1f5f9' } },
    grid: { left: 60, right: 30, top: 20, bottom: 50 },
    xAxis: { type: 'category', data: platformStats.dbGrowth.map(d => d.month), axisLine: { lineStyle: { color: '#334155' } }, axisLabel: { color: '#64748b', rotate: 30 } },
    yAxis: { type: 'value', name: 'Registros', nameTextStyle: { color: '#64748b' }, axisLine: { lineStyle: { color: '#334155' } }, splitLine: { lineStyle: { color: '#1e293b' } }, axisLabel: { color: '#64748b' } },
    series: [{
      name: 'Registros Acumulados', type: 'line', data: platformStats.dbGrowth.map(d => d.cumulative),
      smooth: true, lineStyle: { color: '#10b981', width: 3 }, symbol: 'none',
      areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(16, 185, 129, 0.3)' }, { offset: 1, color: 'rgba(16, 185, 129, 0)' }] } },
    }],
  };

  const etlRowsOption = {
    textStyle: { color: '#94a3b8', fontFamily: 'Inter' },
    tooltip: { trigger: 'axis', backgroundColor: '#1e293b', borderColor: '#334155', textStyle: { color: '#f1f5f9' } },
    grid: { left: 50, right: 20, top: 20, bottom: 40 },
    xAxis: { type: 'category', data: [...platformStats.etlLogs].reverse().map(d => d.date.slice(5)), axisLine: { lineStyle: { color: '#334155' } }, axisLabel: { color: '#64748b' } },
    yAxis: { type: 'value', axisLine: { lineStyle: { color: '#334155' } }, splitLine: { lineStyle: { color: '#1e293b' } }, axisLabel: { color: '#64748b' } },
    series: [{
      type: 'bar', data: [...platformStats.etlLogs].reverse().map(d => ({
        value: d.rows,
        itemStyle: { color: d.status === 'success' ? '#10b981' : '#ef4444', borderRadius: [4, 4, 0, 0] },
      })), barWidth: '50%',
    }],
  };

  const etlColumns = [
    { key: 'date', label: 'Fecha', render: (v) => new Date(v).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }) },
    { key: 'scraper', label: 'Scraper', className: 'cell-name' },
    { key: 'rows', label: 'Filas', className: 'cell-highlight' },
    { key: 'duration', label: 'Duración' },
    { key: 'status', label: 'Estado', render: (v) => <span className={`cell-badge ${v === 'success' ? 'success' : 'error'}`}>{v === 'success' ? '✓ Éxito' : '✗ Error'}</span> },
    { key: 'error', label: 'Error', render: (v) => v || '—' },
  ];

  return (
    <div className="page-container">
      <h1 className="page-title">Plataforma</h1>
      <p className="page-subtitle">Métricas de salud y operaciones de la plataforma RackAI</p>

      <div className="stats-grid">
        <StatCard icon={Clock} label="Data Freshness" value={`${platformStats.dataFreshness}h`} delta={platformStats.dataFreshness < 24 ? 0 : -1} color="cyan" />
        <StatCard icon={Database} label="Total Registros" value={platformStats.totalResults.toLocaleString()} delta={4.6} deltaLabel="este mes" color="blue" />
        <StatCard icon={CheckCircle} label="Cobertura Comps" value={`${platformStats.coveragePct}%`} delta={2.1} color="purple" />
        <StatCard icon={ImageIcon} label="Atletas con Imagen" value={`${platformStats.athletesWithImagePct}%`} delta={0.8} color="orange" />
      </div>

      <div className="charts-grid">
        <ChartCard title="Data Freshness" subtitle="Horas desde la última sincronización ETL">
          <ReactECharts option={gaugeOption} style={{ height: 280 }} />
        </ChartCard>

        <ChartCard title="Filas Procesadas por Sync" subtitle="Registros importados en cada ejecución ETL">
          <ReactECharts option={etlRowsOption} style={{ height: 280 }} />
        </ChartCard>
      </div>

      <ChartCard title="Crecimiento de la Base de Datos" subtitle="Registros acumulados (España)" className="chart-full">
        <ReactECharts option={dbGrowthOption} style={{ height: 300 }} />
      </ChartCard>

      <div style={{ marginTop: 'var(--spacing-xl)' }}>
        <ChartCard title={`Log de Sincronizaciones (${platformStats.etlLogs.length})`} subtitle="Histórico de ejecuciones del ETL">
          <DataTable columns={etlColumns} data={platformStats.etlLogs} />
        </ChartCard>
      </div>
    </div>
  );
}
