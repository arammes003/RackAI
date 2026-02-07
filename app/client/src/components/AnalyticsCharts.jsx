import React, { useEffect, useState } from 'react';
import ReactECharts from 'echarts-for-react';

const AnalyticsCharts = () => {
  // Original Data
  const [trendsData, setTrendsData] = useState([]);
  const [peakAgeData, setPeakAgeData] = useState([]);
  const [geoData, setGeoData] = useState([]);
  
  // New "Deep Analytics" Data
  const [liftRatios, setLiftRatios] = useState(null);
  const [fedPerf, setFedPerf] = useState([]);
  const [weightEff, setWeightEff] = useState([]);
  
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [trendsRes, peakAgeRes, geoRes, ratiosRes, fedRes, weightRes] = await Promise.all([
          fetch('http://localhost:8000/analytics/market-trends'),
          fetch('http://localhost:8000/analytics/peak-age?sex=M&equipment=Raw'),
          fetch('http://localhost:8000/analytics/geo-hotspots'),
          fetch('http://localhost:8000/analytics/lift-ratios?sex=M&equipment=Raw'),
          fetch('http://localhost:8000/analytics/fed-performance'),
          fetch('http://localhost:8000/analytics/weight-efficiency?sex=M&equipment=Raw')
        ]);

        setTrendsData(await trendsRes.json());
        setPeakAgeData(await peakAgeRes.json());
        setGeoData(await geoRes.json());
        setLiftRatios((await ratiosRes.json())[0]); // Returns a list with 1 dict
        setFedPerf(await fedRes.json());
        setWeightEff(await weightRes.json());

        setLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <div className="text-white p-10 text-center">Loading Data Analytics Suite...</div>;

  // --- 1. Market Trends (Line) ---
  const years = [...new Set(trendsData.map(d => d.year))].sort();
  const fedNames = [...new Set(trendsData.map(d => d.federation))];
  const trendsSeries = fedNames.map(fed => ({
    name: fed, type: 'line', smooth: true, showSymbol: false,
    data: years.map(year => {
      const entry = trendsData.find(d => d.year === year && d.federation === fed);
      return entry ? entry.athletes_count : 0;
    })
  }));
  const trendsOption = {
    title: { text: 'Growth of Federations', left: 'center', textStyle: { color: '#fff' } },
    tooltip: { trigger: 'axis' },
    legend: { top: '30px', textStyle: { color: '#aaa', fontSize: 10 }, type: 'scroll' },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'category', data: years, axisLabel: { color: '#ccc' } },
    yAxis: { type: 'value', axisLabel: { color: '#ccc' }, splitLine: { lineStyle: { color: '#333' } } },
    series: trendsSeries, backgroundColor: '#1e1e1e'
  };

  // --- 2. Peak Age (Curve) ---
  const peakAgeOption = {
    title: { text: 'Peak Strength Age (Male/Raw)', left: 'center', textStyle: { color: '#fff' } },
    tooltip: { trigger: 'axis' },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'category', data: peakAgeData.map(d => d.age), axisLabel: { color: '#ccc' } },
    yAxis: { type: 'value', name: 'DOTS', axisLabel: { color: '#ccc' }, splitLine: { lineStyle: { color: '#333' } } },
    series: [{
      data: peakAgeData.map(d => d.avg_dots), type: 'line', smooth: true, showSymbol: false,
      areaStyle: { color: 'rgba(59, 130, 246, 0.2)' }, lineStyle: { color: '#3b82f6', width: 3 }
    }], backgroundColor: '#1e1e1e'
  };

  // --- 3. Geo Hotspots (Bar) ---
  const geoOption = {
    title: { text: 'Top Nations (Volume)', left: 'center', textStyle: { color: '#fff' } },
    tooltip: { trigger: 'axis' },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'value', axisLabel: { color: '#ccc' }, splitLine: { lineStyle: { color: '#333' } } },
    yAxis: { type: 'category', data: geoData.map(d => d.country), axisLabel: { color: '#ccc' } },
    series: [{ data: geoData.map(d => d.athletes_count), type: 'bar', itemStyle: { color: '#ef4444' } }],
    backgroundColor: '#1e1e1e'
  };

  // --- 4. Lift Ratios (Pie) ---
  const ratiosOption = liftRatios ? {
    title: { text: 'The "Golden Ratio" (S/B/D)', left: 'center', textStyle: { color: '#fff' } },
    tooltip: { trigger: 'item' },
    legend: { bottom: '5%', textStyle: { color: '#ccc' } },
    series: [{
      name: 'Lift Ratio', type: 'pie', radius: ['40%', '70%'], avoidLabelOverlap: false,
      itemStyle: { borderRadius: 10, borderColor: '#1e1e1e', borderWidth: 2 },
      label: { show: false, position: 'center' },
      emphasis: { label: { show: true, fontSize: 20, fontWeight: 'bold', color: '#fff' } },
      data: [
        { value: liftRatios.squat, name: `Squat (${liftRatios.squat}%)` },
        { value: liftRatios.bench, name: `Bench (${liftRatios.bench}%)` },
        { value: liftRatios.deadlift, name: `Deadlift (${liftRatios.deadlift}%)` }
      ]
    }], backgroundColor: '#1e1e1e'
  } : {};

  // --- 5. Federation Quality (Bar) ---
  const fedPerfOption = {
    title: { text: 'Strongest Federations (Avg DOTS)', left: 'center', textStyle: { color: '#fff' } },
    tooltip: { trigger: 'axis' },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'category', data: fedPerf.map(d => d.federation), axisLabel: { color: '#ccc', rotate: 45 } },
    yAxis: { type: 'value', name: 'DOTS', axisLabel: { color: '#ccc' }, splitLine: { lineStyle: { color: '#333' } } },
    series: [{
      data: fedPerf.map(d => d.avg_dots), type: 'bar', itemStyle: { color: '#10b981' },
      markLine: { data: [{ type: 'average', name: 'Global Avg' }] }
    }], backgroundColor: '#1e1e1e'
  };

  // --- 6. Weight Efficiency (Scatter) ---
  const weightEffOption = {
    title: { text: 'Bodyweight vs Strength (Errors)', left: 'center', textStyle: { color: '#fff' } },
    tooltip: {
      trigger: 'item',
      formatter: (params) => `BW: ${params.data[0]}kg <br/> DOTS: ${params.data[1]} <br/> Total: ${params.data[2]}kg`
    },
    xAxis: { type: 'value', name: 'Bodyweight (kg)', nameLocation: 'middle', nameGap: 30, axisLabel: { color: '#ccc' }, splitLine: { lineStyle: { color: '#333' } } },
    yAxis: { type: 'value', name: 'DOTS', axisLabel: { color: '#ccc' }, splitLine: { lineStyle: { color: '#333' } } },
    series: [{
      symbolSize: 5,
      data: weightEff.map(d => [d.bw, d.score, d.total]),
      type: 'scatter',
      itemStyle: { color: 'rgba(245, 158, 11, 0.6)' }
    }], backgroundColor: '#1e1e1e'
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-white mb-6">RackAI Analytics Suite</h1>
      
      {/* Row 1: The Big Picture */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 rounded-xl overflow-hidden shadow-lg border border-gray-700">
          <ReactECharts option={trendsOption} style={{ height: '400px' }} opts={{ renderer: 'canvas' }} />
        </div>
        <div className="lg:col-span-1 rounded-xl overflow-hidden shadow-lg border border-gray-700">
          <ReactECharts option={ratiosOption} style={{ height: '400px' }} opts={{ renderer: 'canvas' }} />
        </div>
      </div>

      {/* Row 2: Deep Dives */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 mb-8">
         <div className="rounded-xl overflow-hidden shadow-lg border border-gray-700">
          <ReactECharts option={fedPerfOption} style={{ height: '350px' }} opts={{ renderer: 'canvas' }} />
        </div>
        <div className="rounded-xl overflow-hidden shadow-lg border border-gray-700">
          <ReactECharts option={weightEffOption} style={{ height: '350px' }} opts={{ renderer: 'canvas' }} />
        </div>
      </div>

      {/* Row 3: Demographics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-xl overflow-hidden shadow-lg border border-gray-700">
          <ReactECharts option={peakAgeOption} style={{ height: '350px' }} opts={{ renderer: 'canvas' }} />
        </div>
        <div className="rounded-xl overflow-hidden shadow-lg border border-gray-700">
          <ReactECharts option={geoOption} style={{ height: '350px' }} opts={{ renderer: 'canvas' }} />
        </div>
      </div>
    </div>
  );
};

export default AnalyticsCharts;
