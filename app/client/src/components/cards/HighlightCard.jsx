import React, { useState, useEffect } from 'react';
import { API_URL } from '../../config/api';
import '../../styles/HighlightCard.css';

const HighlightCard = () => {
  const [highlights, setHighlights] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHighlights = async () => {
      try {
        const response = await fetch(`${API_URL}/analytics/monthly-top5-general`);
        if (response.ok) {
          const rawData = await response.json();
          if (rawData && rawData.length > 0) {
            
            // Map API response to component structure
            const mappedData = rawData.map(item => {
                let title = "";
                const sexLabel = item.sex === 'M' ? 'Masculino' : 'Femenino';
                const suffix = item.type === 'goodlift' ? ' GL Pts' : ' kg';
                
                switch(item.type) {
                    case 'squat': title = `Mejor Sentadilla (${sexLabel})`; break;
                    case 'bench': title = `Mejor Press Banca (${sexLabel})`; break;
                    case 'deadlift': title = `Mejor Peso Muerto (${sexLabel})`; break;
                    case 'total': title = `Mejor Total (${sexLabel})`; break;
                    case 'goodlift': title = `Mejor GL (${sexLabel})`; break;
                    default: title = `Top Mes (${sexLabel})`;
                }

                const weightClass = item.weight_class && item.weight_class !== 'nan' ? ` • ${item.weight_class} kg` : '';
                return {
                    title: title,
                    athleteName: item.athlete,
                    stats: `${item.value}${suffix}`,
                    category: `${item.competition_name}${weightClass}`,
                    federation: item.federation,
                    imageUrl: item.image_url
                };
            });

            setHighlights(mappedData);
          }
        }
      } catch (error) {
        console.error("Error fetching highlights:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchHighlights();
  }, []);

  useEffect(() => {
    if (highlights.length <= 1) return;

    const interval = setInterval(() => {
      // 1. Fade out
      setIsVisible(false);

      // 2. Wait for fade out, then swap data and fade in
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % highlights.length);
        setIsVisible(true);
      }, 500); // Matches CSS transition duration
      
    }, 5000); // Change every 5 seconds

    return () => clearInterval(interval);
  }, [highlights]);

  if (loading) return (
    <div className="highlight-card">
        <div className="highlight-card-header">
            <div className="skeleton animate-pulse rounded" style={{width: '8rem', height: '1.25rem'}}></div>
        </div>
        <div className="highlight-card-content">
            <div className="highlight-card-info" style={{gap: '0.5rem'}}>
                <div className="skeleton animate-pulse rounded" style={{width: '60%', height: '2.5rem'}}></div>
                <div className="skeleton animate-pulse rounded" style={{width: '80%', height: '1rem'}}></div>
                <div className="skeleton animate-pulse rounded" style={{width: '50%', height: '0.75rem'}}></div>
            </div>
        </div>
    </div>
  );

  if (highlights.length === 0) return null;

  const current = highlights[currentIndex];

  return (
    <div className="highlight-card">
      <div className="highlight-card-header">
        <span className="highlight-card-badge">{current.title}</span>
      </div>
      
      <div 
        className="highlight-card-content"
        style={{ 
            opacity: isVisible ? 1 : 0, 
            transition: 'opacity 0.5s ease-in-out'
        }}
      >
        <div className="highlight-card-info">
          <p className="highlight-card-stats">{current.stats}</p>
          <h3 className="highlight-card-name" style={{whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%'}}>
            {current.athleteName}
          </h3>
          <span className="highlight-card-category">
            <span className="highlight-card-category-name" title={current.category}>{current.category}</span>
            <span className="highlight-card-federation">&nbsp;• {current.federation}</span>
          </span>
        </div>
        
        <div className="highlight-card-image-container">
          <img 
            src={current.imageUrl || `https://ui-avatars.com/api/?name=${current.athleteName}&background=fbbf24&color=111827&size=128`} 
            alt={current.athleteName} 
            className="highlight-card-image" 
            fetchPriority='high'
            loading='eager'
          />
        </div>
      </div>
    </div>
  );
};

export default HighlightCard;
