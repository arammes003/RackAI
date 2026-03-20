import ReactECharts from 'echarts-for-react';
import { CalendarDays, Users, MapPin, Award } from 'lucide-react';
import StatCard from '../../components/StatCard/StatCard';
import ChartCard from '../../components/ChartCard/ChartCard';
import DataTable from '../../components/DataTable/DataTable';
import { competitions, growthTrends, regionalData } from '../../data/mockData';
import './Competitions.css';

export default function Competitions() {
  const upcoming = competitions.filter(c => c.status === 'upcoming').sort((a, b) => new Date(a.date) - new Date(b.date));
  const past = competitions.filter(c => c.status === 'completed').sort((a, b) => new Date(b.date) - new Date(a.date));
  const totalParticipants = past.reduce((s, c) => s + (c.participants || 0), 0);
  const avgParticipants = Math.round(totalParticipants / past.length);

  const compsPerYearOption = {
    textStyle: { color: '#94a3b8', fontFamily: 'Inter' },
    tooltip: { trigger: 'axis', backgroundColor: '#1e293b', borderColor: '#334155', textStyle: { color: '#f1f5f9' } },
    grid: { left: 50, right: 30, top: 20, bottom: 40 },
    xAxis: { type: 'category', data: growthTrends.map(d => d.year), axisLine: { lineStyle: { color: '#334155' } }, axisLabel: { color: '#64748b' } },
    yAxis: { type: 'value', axisLine: { lineStyle: { color: '#334155' } }, splitLine: { lineStyle: { color: '#1e293b' } }, axisLabel: { color: '#64748b' } },
    series: [{
      type: 'bar', data: growthTrends.map(d => d.competitions),
      itemStyle: { color: '#3b82f6', borderRadius: [4, 4, 0, 0] }, barWidth: '50%',
    }],
  };

  const regionOption = {
    textStyle: { color: '#94a3b8', fontFamily: 'Inter' },
    tooltip: { trigger: 'axis', backgroundColor: '#1e293b', borderColor: '#334155', textStyle: { color: '#f1f5f9' } },
    grid: { left: 140, right: 40, top: 10, bottom: 10 },
    xAxis: { type: 'value', axisLine: { lineStyle: { color: '#334155' } }, splitLine: { lineStyle: { color: '#1e293b' } }, axisLabel: { color: '#64748b' } },
    yAxis: {
      type: 'category',
      data: regionalData.slice(0, 10).map(d => d.region).reverse(),
      axisLine: { lineStyle: { color: '#334155' } },
      axisLabel: { color: '#94a3b8', fontSize: 12 },
    },
    series: [{
      type: 'bar',
      data: regionalData.slice(0, 10).map(d => d.competitions).reverse(),
      itemStyle: { color: '#10b981', borderRadius: [0, 4, 4, 0] }, barWidth: '55%',
      label: { show: true, position: 'right', color: '#f1f5f9', fontWeight: 600, fontFamily: 'Oswald' },
    }],
  };

  const compColumns = [
    { key: 'name', label: 'Competición', className: 'cell-name' },
    { key: 'date', label: 'Fecha', render: (v) => new Date(v).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }) },
    { key: 'federation', label: 'Fed.', render: (v) => <span className={`cell-badge ${v === 'AEP' ? 'male' : v === 'EPF' ? 'success' : 'warning'}`}>{v}</span> },
    { key: 'state', label: 'CCAA', render: (v) => v || '—' },
    { key: 'town', label: 'Ciudad' },
    { key: 'participants', label: 'Participantes', className: 'cell-highlight', render: (v) => v || '—' },
    { key: 'status', label: 'Estado', render: (v) => <span className={`cell-badge ${v === 'completed' ? 'success' : 'upcoming'}`}>{v === 'completed' ? 'Completada' : 'Próxima'}</span> },
  ];

  return (
    <div className="page-container">
      <h1 className="page-title">Competiciones</h1>
      <p className="page-subtitle">Calendario y estadísticas de competiciones en España</p>

      <div className="stats-grid">
        <StatCard icon={CalendarDays} label="Competiciones 2025" value="57" delta={46} deltaLabel="vs 2024" color="blue" />
        <StatCard icon={Users} label="Media Participantes" value={avgParticipants} delta={12} deltaLabel="vs 2024" color="purple" />
        <StatCard icon={MapPin} label="CCAA Activas" value="12" delta={20} deltaLabel="vs 2024" color="orange" />
        <StatCard icon={Award} label="Federaciones" value="3" color="cyan" />
      </div>

      {upcoming.length > 0 && (
        <div className="upcoming-section">
          <h2 className="section-title">📅 Próximas Competiciones</h2>
          <div className="upcoming-cards">
            {upcoming.map(c => (
              <div key={c.id} className="upcoming-card">
                <div className="upcoming-date">
                  <span className="upcoming-day">{new Date(c.date).getDate()}</span>
                  <span className="upcoming-month">{new Date(c.date).toLocaleDateString('es-ES', { month: 'short' }).toUpperCase()}</span>
                </div>
                <div className="upcoming-info">
                  <h4>{c.name}</h4>
                  <p>{c.town}{c.state ? `, ${c.state}` : ''}</p>
                </div>
                <span className={`cell-badge ${c.federation === 'AEP' ? 'male' : c.federation === 'EPF' ? 'success' : 'warning'}`}>{c.federation}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="charts-grid">
        <ChartCard title="Competiciones por Año" subtitle="Evolución del número de competiciones en España">
          <ReactECharts option={compsPerYearOption} style={{ height: 300 }} />
        </ChartCard>

        <ChartCard title="Competiciones por CCAA" subtitle="Distribución geográfica de competiciones">
          <ReactECharts option={regionOption} style={{ height: 340 }} />
        </ChartCard>
      </div>

      <ChartCard title={`Histórico de Competiciones (${competitions.length})`} subtitle="Todas las competiciones registradas">
        <DataTable columns={compColumns} data={[...upcoming, ...past]} />
      </ChartCard>
    </div>
  );
}
