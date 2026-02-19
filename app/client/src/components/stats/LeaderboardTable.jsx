import React, { useEffect, useState } from 'react';
import { Trophy, Medal, User, Crown, Loader2 } from 'lucide-react';
import './LeaderboardTable.css'; // Component specific styles

export default function LeaderboardWidget() {
  const [filter, setFilter] = useState('mixed'); // 'mixed', 'M', 'F'
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [loading, setLoading] = useState(true);

  const [cache, setCache] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        let rawData = [];
        let newCacheUpdates = {};
        let hasUpdates = false;

        const fetchIfNeeded = async (sex) => {
            if (cache[sex]) return cache[sex];
            
            const response = await fetch(`http://localhost:8000/analytics/historical-leaderboard?sex=${sex}&limit=10`);
            const data = await response.json();
            newCacheUpdates[sex] = data;
            hasUpdates = true;
            return data;
        };

        if (filter === 'mixed') {
            const [menData, womenData] = await Promise.all([
                fetchIfNeeded('M'),
                fetchIfNeeded('F')
            ]);
            // Merge and sort top 10 overall by GL
            rawData = [...menData, ...womenData].sort((a, b) => b.best_value - a.best_value).slice(0, 10);
        } else {
            rawData = await fetchIfNeeded(filter);
        }

        // Update cache if new data was fetched
        if (hasUpdates) {
            setCache(prev => ({ ...prev, ...newCacheUpdates }));
        }

        // Map API response to component structure
        const mappedData = rawData.map((item, index) => ({
            id: item._id || index, 
            name: item.athlete_name,
            club: item.federation || item.competition_name,
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
  }, [filter]); // Cache intentionally omitted from dependency array to avoid loops, as filter change captures latest cache closure

  // Use fetched data
  const filteredData = leaderboardData;

  // Iconos de Ranking
  const getRankIcon = (index) => {
    if (index === 0) return <Crown className="icon-crown" size={22} />;
    if (index === 1) return <Medal className="icon-medal-silver" size={20} />;
    if (index === 2) return <Medal className="icon-medal-bronze" size={20} />;
    return <span className="text-rank">{index + 1}</span>;
  };

  return (
    <div className="leaderboard-card">
      
      {/* --- Header con Tabs --- */}
      <div className="leaderboard-header">
        <div className="leaderboard-title-group">
          <h3 className="leaderboard-title">Ranking Histórico</h3>
          <p className="leaderboard-subtitle">Atletas con mayor rendimiento en España</p>
        </div>

        {/* Selector de Pestañas (Segmented Control) */}
        <div className="leaderboard-tabs">
          <button 
            onClick={() => setFilter('mixed')}
            className={`leaderboard-tab ${filter === 'mixed' ? 'active-mixed' : ''}`}
          >
            Combinado
          </button>
          <button 
            onClick={() => setFilter('M')}
            className={`leaderboard-tab ${filter === 'M' ? 'active-male' : ''}`}
          >
            Masculino
          </button>
          <button 
            onClick={() => setFilter('F')}
            className={`leaderboard-tab ${filter === 'F' ? 'active-female' : ''}`}
          >
            Femenino
          </button>
        </div>
      </div>

      {/* --- Tabla --- */}
      <div className="leaderboard-list">
        
        {/* Encabezados de Columna */}
        <div className="leaderboard-table-header">
          <div className="col-rank">Pos</div>
          <div className="col-athlete">Atleta</div>
          <div className="col-weight">Categoría</div>
          <div className="col-weight">Mejor SQ</div>
          <div className="col-weight">Mejor BP</div>
          <div className="col-weight">Mejor DL</div>
          <div className="col-total">Mejor Total</div>
          <div className="col-gl">GL Points</div>
        </div>

        {/* Lista de Filas */}
        {loading ? (
          <div className="leaderboard-loader">
            <Loader2 className="animate-spin" size={64} />
          </div>
        ) : (
          filteredData.map((athlete, index) => (
          <div 
            key={athlete.id} 
            className={`leaderboard-row ${index === 0 ? 'rank-1' : ''} ${index === 1 ? 'rank-2' : ''} ${index === 2 ? 'rank-3' : ''}`}
          >
            {/* 1. Ranking */}
            <div className="rank-container">
              {getRankIcon(index)}
            </div>

            {/* 2. Perfil */}
            <div className="athlete-profile">
              <div className="athlete-avatar-container">
                <div className="athlete-avatar">
                  {athlete.image ? (
                    <img 
                      src={athlete.image} 
                      alt={athlete.name} 
                      style={{width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%'}}
                    />
                  ) : (
                    <User size={16} className="icon-user" />
                  )}
                </div>
                {/* Indicador de sexo (Solo en modo Mixto) */}
                {filter === 'mixed' && (
                  <div className={`gender-dot ${athlete.gender === 'M' ? 'male' : 'female'}`}></div>
                )}
              </div>
              
              <div className="athlete-info">
                <span className="athlete-name">
                  {athlete.name}
                </span>
                <span className="athlete-club">{athlete.club}</span>
              </div>
            </div>

            {/* 3. Datos */}
            <div className="stat-weight">
              <span>{athlete.cat}</span>
            </div>

            <div className="stat-sq">
              {athlete.sq}
            </div>
            <div className="stat-bp">
              {athlete.bp}
            </div>
            <div className="stat-dl">
              {athlete.dl}
            </div>
            
            <div className="stat-total">
              {athlete.total}
            </div>

            <div className="stat-gl">
              <span className="stat-gl-val">
                {athlete.gl}
              </span>
            </div>

          </div>
        ))
        )}
      </div>
    </div>
  );
}