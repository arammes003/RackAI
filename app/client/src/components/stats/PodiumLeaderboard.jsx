import React, { useState, useMemo, useEffect } from 'react';
import { Trophy, Medal, User, Crown } from 'lucide-react';
import './PodiumLeaderboard.css';
import adriImage from '../../assets/adri.png'; // Using existing asset for demo

export default function PodiumLeaderboard() {
  const [filter, setFilter] = useState('mixed'); // 'mixed', 'M', 'F'
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        let data = [];
        if (filter === 'mixed') {
            const [menRes, womenRes] = await Promise.all([
                fetch('http://localhost:8000/analytics/historical-leaderboard?sex=M&limit=10'),
                fetch('http://localhost:8000/analytics/historical-leaderboard?sex=F&limit=10')
            ]);
            const menData = await menRes.json();
            const womenData = await womenRes.json();
            // Merge and sort top 10 overall by GL
            data = [...menData, ...womenData].sort((a, b) => b.best_value - a.best_value).slice(0, 10);
        } else {
            const response = await fetch(`http://localhost:8000/analytics/historical-leaderboard?sex=${filter}&limit=10`);
            data = await response.json();
        }

        // Map API response to component structure
        const mappedData = data.map((item, index) => ({
            id: item.athlete_id || index, // fallback index if needed
            name: item.athlete_name,
            club: item.federation || item.competition_name, // Use Fed or Comp as club placeholder
            cat: item.real_weight_class,
            gender: item.sex || (filter === 'mixed' ? '?' : filter),
            total: item.best_total,
            gl: item.best_value,
            sq: item.best_squat,
            bp: item.best_bench,
            dl: item.best_deadlift,
            image: item.image_url
        }));

        setLeaderboardData(mappedData);
      } catch (error) {
        console.error("Failed to fetch leaderboard:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [filter]);

  // Use state data for display variables
  const top3 = loading ? [] : leaderboardData.slice(0, 3);
  const rest = loading ? [] : leaderboardData.slice(3);

  // Reorder top 3 for visualization: 2nd, 1st, 3rd
  const podiumOrder = [top3[1], top3[0], top3[2]];

  if (loading) return <div className="p-4 text-center">Cargando ranking...</div>;

  return (
    <div className="f1-leaderboard-container">
      
      {/* --- Header con Tabs --- */}
      <div className="podium-header">
        <div className="podium-title-group">
          <h3 className="podium-title">Top Atletas 2026</h3>
          <p className="podium-subtitle">Ranking por puntos GL</p>
        </div>

        {/* Selector de Pestañas */}
        <div className="podium-tabs">
          <button onClick={() => setFilter('mixed')} className={`podium-tab ${filter === 'mixed' ? 'active-mixed' : ''}`}>Combinado</button>
          <button onClick={() => setFilter('M')} className={`podium-tab ${filter === 'M' ? 'active-male' : ''}`}>Masculino</button>
          <button onClick={() => setFilter('F')} className={`podium-tab ${filter === 'F' ? 'active-female' : ''}`}>Femenino</button>
        </div>
      </div>

      {/* --- F1 PODIUM SECTION (Horizontal 2-1-3) --- */}
      <div className="f1-podium-display">
        {podiumOrder.map((athlete, index) => {
            if (!athlete) return null;
            
            // Determine rank based on position in podiumOrder array (which is [2nd, 1st, 3rd])
            let rank = 0;
            if (index === 0) rank = 2;
            if (index === 1) rank = 1;
            if (index === 2) rank = 3;

            return (
                <div key={athlete.id} className={`f1-card rank-${rank}`}>
                    {/* Big Background Number */}
                    <div className="f1-big-rank">{rank}</div>

                    {/* Athlete Image (Cutout style) */}
                    <div className="f1-image-container">
                         {/* Using the placeholder image for everyone for demo, or athlete.image if available */}
                         <img src={athlete.image || adriImage} alt={athlete.name} className="f1-athlete-img" />
                    </div>

                    {/* Info Bar */}
                    <div className="f1-info-bar">
                        <div className="f1-flag">🇪🇸</div> {/* Placeholder flag */}
                        <div className="f1-name">{athlete.name.split(' ')[1] || athlete.name}</div> {/* Last Name primarily */}
                    </div>
                    
                    {/* Points Box */}
                    <div className="f1-points-box">
                        <span className="f1-points-value">{Math.round(athlete.gl)}</span>
                        <span className="f1-points-label">PTS</span>
                    </div>

                    {/* Full Name & Club (Sub-info) */}
                    <div className="f1-sub-info">
                        <span className="f1-full-name">{athlete.name}</span>
                        <span className="f1-team">{athlete.club}</span>
                    </div>
                </div>
            );
        })}
      </div>

      {/* --- RIGHT: List Section (Rank 4+) --- */}
      <div className="leaderboard-list">
            
            {/* Headers */}
            <div className="leaderboard-table-header">
                <div className="col-rank">#</div>
                <div className="col-athlete">Atleta</div>
                <div className="col-weight">Categoría</div>
                <div className="col-sq">SQ</div>
                <div className="col-bp">BP</div>
                <div className="col-dl">DL</div>
                <div className="col-total">Total</div>
                <div className="col-gl">GL Pts</div>
            </div>

            {/* List Rows */}
            {rest.map((athlete, index) => {
                // Index in 'rest' starts at 0, so actual rank is index + 4
                const actualRank = index + 4;
                return (
                <div key={athlete.id} className="leaderboard-row">
                    {/* 1. Ranking */}
                    <div className="rank-container">
                    <span className="text-rank">{actualRank}</span>
                    </div>

                    {/* 2. Profile */}
                    <div className="athlete-profile">
                    <div className="athlete-avatar-container">
                        <div className="athlete-avatar">
                        <User size={16} className="icon-user" />
                        </div>
                        {filter === 'mixed' && (
                        <div className={`gender-dot ${athlete.gender === 'M' ? 'male' : 'female'}`}></div>
                        )}
                    </div>
                    
                    <div className="athlete-info">
                        <span className="athlete-name">{athlete.name}</span>
                        <span className="athlete-club">{athlete.club}</span>
                    </div>
                    </div>

                    {/* 3. Stats */}
                    <div className="stat-weight"><span>{athlete.cat}</span></div>
                    <div className="stat-sq">{athlete.sq}</div>
                    <div className="stat-bp">{athlete.bp}</div>
                    <div className="stat-dl">{athlete.dl}</div>
                    
                    <div className="stat-total">{athlete.total} <span>kg</span></div>
                    <div className="stat-gl">
                    <span className="stat-gl-val">{athlete.gl}</span>
                    </div>
                </div>
                );
            })}
        </div>
    </div>
  );
}
