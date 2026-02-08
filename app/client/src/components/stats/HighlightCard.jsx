import React from 'react';
import '../../styles/Home.css';

const HighlightCard = ({ title, athleteName, stats, category, imageUrl }) => {
  return (
    <div className="highlight-card">
      <div className="highlight-card-header">
        <span className="highlight-card-title">{title}</span>
      </div>
      
      <div className="highlight-card-content">
        <div className="highlight-card-image-container">
          <img src={imageUrl} alt={athleteName} className="highlight-card-image" />
        </div>
        
        <div className="highlight-card-info">
          <h3 className="highlight-card-name">{athleteName}</h3>
          <p className="highlight-card-stats">{stats}</p>
          <span className="highlight-card-category">{category}</span>
        </div>
      </div>
    </div>
  );
};

export default HighlightCard;
