import ReactECharts from 'echarts-for-react';
import { TrendingUp, Users, BarChart3, Baby } from 'lucide-react';
import StatCard from '../../components/StatCard/StatCard';
import ChartCard from '../../components/ChartCard/ChartCard';
import { regionalData, genderParityTrend, pipelineData, competitivenessByCategory } from '../../data/mockData';

export default function Market() {
  const regionGrowthOption = {
    textStyle: { color: '#94a3b8', fontFamily: 'Inter' },
    tooltip: { trigger: 'axis', backgroundColor: '#1e293b', borderColor: '#334155', textStyle: { color: '#f1f5f9' }, formatter: (p) => `${p[0].name}<br/>Atletas: ${p[0].data.athletes}<br/>Crecimiento: +${p[0].data.growth}%` },
    grid: { left: 140, right: 60, top: 10, bottom: 10 },
    xAxis: { type: 'value', name: 'Atletas', nameTextStyle: { color: '#64748b' }, axisLine: { lineStyle: { color: '#334155' } }, splitLine: { lineStyle: { color: '#1e293b' } }, axisLabel: { color: '#64748b' } },
    yAxis: {
      type: 'category',
      data: regionalData.map(d => d.region).reverse(),
      axisLine: { lineStyle: { color: '#334155' } },
      axisLabel: { color: '#94a3b8', fontSize: 12 },
    },
    series: [{
      type: 'bar',
      data: regionalData.map(d => ({
        value: d.athletes, athletes: d.athletes, growth: d.growth,
        itemStyle: { color: d.growth > 80 ? '#10b981' : d.growth > 50 ? '#3b82f6' : '#64748b', borderRadius: [0, 4, 4, 0] },
      })).reverse(),
      barWidth: '55%',
      label: { show: true, position: 'right', color: '#f1f5f9', fontSize: 11, fontWeight: 600, formatter: (p) => `+${p.data.growth}%` },
    }],
  };

  const genderOption = {
    textStyle: { color: '#94a3b8', fontFamily: 'Inter' },
    tooltip: { trigger: 'axis', backgroundColor: '#1e293b', borderColor: '#334155', textStyle: { color: '#f1f5f9' } },
    grid: { left: 50, right: 30, top: 30, bottom: 40 },
    xAxis: { type: 'category', data: genderParityTrend.map(d => d.year), axisLine: { lineStyle: { color: '#334155' } }, axisLabel: { color: '#64748b' } },
    yAxis: { type: 'value', name: '% Femenino', nameTextStyle: { color: '#64748b' }, min: 15, max: 35, axisLine: { lineStyle: { color: '#334155' } }, splitLine: { lineStyle: { color: '#1e293b' } }, axisLabel: { color: '#64748b' } },
    series: [{
      name: '% Mujeres', type: 'line', data: genderParityTrend.map(d => d.femalePct),
      smooth: true, lineStyle: { color: '#ec4899', width: 3 }, symbol: 'circle', symbolSize: 8, itemStyle: { color: '#ec4899' },
      areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(236, 72, 153, 0.2)' }, { offset: 1, color: 'rgba(236, 72, 153, 0)' }] } },
      markLine: { data: [{ yAxis: 30, label: { color: '#f59e0b', formatter: 'Objetivo 30%' }, lineStyle: { color: '#f59e0b', type: 'dashed' } }] },
    }],
  };

  const pipelineOption = {
    textStyle: { color: '#94a3b8', fontFamily: 'Inter' },
    tooltip: { trigger: 'axis', backgroundColor: '#1e293b', borderColor: '#334155', textStyle: { color: '#f1f5f9' } },
    grid: { left: 50, right: 30, top: 20, bottom: 80 },
    xAxis: { type: 'category', data: pipelineData.map(d => d.stage), axisLine: { lineStyle: { color: '#334155' } }, axisLabel: { color: '#64748b', rotate: 25, fontSize: 11 } },
    yAxis: { type: 'value', name: 'Atletas', nameTextStyle: { color: '#64748b' }, axisLine: { lineStyle: { color: '#334155' } }, splitLine: { lineStyle: { color: '#1e293b' } }, axisLabel: { color: '#64748b' } },
    series: [{
      type: 'bar', data: pipelineData.map(d => d.athletes),
      itemStyle: { color: (p) => {
        const colors = ['#64748b', '#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#f97316', '#ef4444'];
        return colors[p.dataIndex] || '#64748b';
      }, borderRadius: [4, 4, 0, 0] },
      barWidth: '55%',
      label: { show: true, position: 'top', color: '#f1f5f9', fontSize: 11, fontWeight: 600, fontFamily: 'Oswald' },
    }],
  };

  const competitiveOption = {
    textStyle: { color: '#94a3b8', fontFamily: 'Inter' },
    tooltip: { trigger: 'axis', backgroundColor: '#1e293b', borderColor: '#334155', textStyle: { color: '#f1f5f9' }, formatter: (params) => {
      const cat = params[0].name;
      const data = competitivenessByCategory.find(d => d.category === cat);
      return `${cat}<br/>Min DOTS: ${data.minDots}<br/>Max DOTS: ${data.maxDots}<br/>Avg DOTS: ${data.avgDots}<br/>Rango: ${data.maxDots - data.minDots}`;
    }},
    grid: { left: 60, right: 30, top: 20, bottom: 80 },
    xAxis: { type: 'category', data: competitivenessByCategory.map(d => d.category), axisLine: { lineStyle: { color: '#334155' } }, axisLabel: { color: '#64748b', rotate: 45, fontSize: 11 } },
    yAxis: { type: 'value', name: 'DOTS', nameTextStyle: { color: '#64748b' }, axisLine: { lineStyle: { color: '#334155' } }, splitLine: { lineStyle: { color: '#1e293b' } }, axisLabel: { color: '#64748b' } },
    series: [
      { name: 'Min', type: 'bar', stack: 'range', data: competitivenessByCategory.map(d => d.minDots), itemStyle: { color: 'transparent' }, emphasis: { itemStyle: { color: 'transparent' } } },
      { name: 'Rango', type: 'bar', stack: 'range', data: competitivenessByCategory.map(d => ({
        value: d.maxDots - d.minDots,
        itemStyle: { color: d.category.includes('F') ? '#ec4899' : '#3b82f6', borderRadius: [4, 4, 0, 0], opacity: 0.7 },
      })), barWidth: '55%' },
    ],
  };

  return (
    <div className="page-container">
      <h1 className="page-title">Mercado</h1>
      <p className="page-subtitle">Inteligencia de mercado y tendencias del powerlifting en España</p>

      <div className="stats-grid">
        <StatCard icon={TrendingUp} label="Crecimiento Anual" value="+65.4%" delta={65.4} />
        <StatCard icon={Users} label="Gender Parity" value="28.8% F" delta={1.6} deltaLabel="vs 2024" color="pink" />
        <StatCard icon={Baby} label="Pipeline Cantera" value="697 Sub-Jr" delta={15} deltaLabel="vs 2024" color="purple" />
        <StatCard icon={BarChart3} label="CCAA Activas" value="12" delta={20} color="blue" />
      </div>

      <div className="charts-grid">
        <ChartCard title="Crecimiento por CCAA" subtitle="Atletas y crecimiento interanual por comunidad autónoma">
          <ReactECharts option={regionGrowthOption} style={{ height: 420 }} />
        </ChartCard>

        <ChartCard title="Gender Parity Trend" subtitle="Evolución del % de participación femenina">
          <ReactECharts option={genderOption} style={{ height: 300 }} />
        </ChartCard>
      </div>

      <div className="charts-grid">
        <ChartCard title="Pipeline de Cantera" subtitle="Distribución de atletas por grupo de edad">
          <ReactECharts option={pipelineOption} style={{ height: 340 }} />
        </ChartCard>

        <ChartCard title="Competitividad por Categoría" subtitle="Rango de DOTS entre top-10 atletas de cada categoría">
          <ReactECharts option={competitiveOption} style={{ height: 340 }} />
        </ChartCard>
      </div>
    </div>
  );
}
