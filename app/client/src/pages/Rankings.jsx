import React, { useEffect, useState } from 'react';
import './Rankings.css'; // We will create this next
import '../pages/Home.css'; // Reuse table styles

const Rankings = () => {
  const [rankings, setRankings] = useState({ male: [], female: [] });
  const [loading, setLoading] = useState(true);
  const [federation, setFederation] = useState('ALL'); // Changed default to ALL as per user request scope
  const [limit, setLimit] = useState(10);
  const [tested, setTested] = useState('TESTED');

  // List of common federations to start with
  // ideally this should come from API, but hardcoding main ones for now is safer
  const federations = ["ALL", "AEP", "IPF", "EPF", "GPE", "DT", "WRPF"];

  useEffect(() => {
    const fetchRankings = async () => {
      setLoading(true);
      try {
        const response = await fetch(`http://localhost:8000/analytics/rankings?federation=${federation}&limit=${limit}&tested=${tested}`);
        const data = await response.json();
        setRankings(data);
      } catch (error) {
        console.error("Error fetching rankings:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRankings();
  }, [federation, limit, tested]);

  const renderTable = (data, title, colorClass) => (
    <div className="stat-card" style={{ height: 'auto', minHeight: '400px' }}>
        <div className="card-header" style={{ marginBottom: '1rem' }}>
            <h3 className="card-title">{title}</h3>
        </div>
        <div className={`table-wrapper ${loading ? 'opacity-50' : 'opacity-100'}`} style={{transition: 'opacity 0.3s'}}>
            <table className="ranking-table">
                <thead>
                    <tr>
                        <th>#</th>
                        <th>Atleta</th>
                        <th>Fed.</th>
                        <th>Cat.</th>
                        <th>Total</th>
                        <th>S / B / D</th>
                        <th>GL Pts</th>
                    </tr>
                </thead>
                <tbody>
                    {data && data.length > 0 ? data.map((r, i) => (
                        <tr key={r._id}>
                            <td className="rank-cell">{i + 1}</td>
                            <td className="name-cell">{r.name}</td>
                            <td style={{fontSize: '0.7rem', color: '#6b7280'}}>{r.federation}</td>
                            <td>{r.weight_class}</td>
                            <td style={{ fontWeight: 600 }}>{r.total} kg</td>
                            <td className="sbd-cell">
                                {r.squat} / {r.bench} / {r.deadlift}
                            </td>
                            <td className={`points-cell ${colorClass}`}>{r.score.toFixed(2)}</td>
                        </tr>
                    )) : (
                        <tr>
                            <td colSpan="7" style={{textAlign: 'center', padding: '2rem'}}>
                                {loading ? "Cargando datos..." : "No hay atletas con estos filtros"}
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    </div>
  );

  return (
    <div className="rankings-container">
      <div className="rankings-header">
          <h1 className="home-title">Rankings por Federación</h1>
          
          <div className="filters-bar">
              <div className="filter-group">
                  <label>Federación:</label>
                  <select value={federation} onChange={(e) => setFederation(e.target.value)}>
                      {federations.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
              </div>

              <div className="filter-group">
                  <label>Control:</label>
                  <select value={tested} onChange={(e) => setTested(e.target.value)}>
                      <option value="TESTED">Tested (Doping Control)</option>
                      <option value="UNTESTED">Untested / Open</option>
                  </select>
              </div>

              <div className="filter-group">
                  <label>Mostrar:</label>
                  <select value={limit} onChange={(e) => setLimit(Number(e.target.value))}>
                      <option value={10}>Top 10</option>
                      <option value={20}>Top 20</option>
                      <option value={50}>Top 50</option>
                      <option value={100}>Top 100</option>
                  </select>
              </div>
          </div>
      </div>

      <div className="rankings-grid">
          {renderTable(rankings.male || [], "Ranking Masculino", "text-blue-600")}
          {renderTable(rankings.female || [], "Ranking Femenino", "text-pink-600")}
      </div>
    </div>
  );
};

export default Rankings;
