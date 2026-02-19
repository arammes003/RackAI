import React, { useState } from 'react';
import '../styles/Athletes.css';

// Mock Data
const MOCK_ATHLETES = [
  {
    id: 1,
    name: 'Alfonso Ramirez',
    weightClass: '-93kg',
    category: 'Open',
    country: 'es',
    sq: 297.5,
    bp: 175,
    dl: 312.5,
    total: 785.5,
    gl: 110.15,
    image: 'https://randomuser.me/api/portraits/men/32.jpg'
  },
  {
    id: 2,
    name: 'Inmaculada Soto',
    weightClass: '-63kg',
    category: 'Open',
    country: 'es',
    sq: 180,
    bp: 110,
    dl: 220.5,
    total: 510.5,
    gl: 111.84,
    image: null // Placeholder
  },
  {
    id: 3,
    name: 'Nrinclada Soto',
    weightClass: '-63kg',
    category: 'Open',
    country: 'es',
    sq: 180,
    bp: 110,
    dl: 220.5,
    total: 599.5,
    gl: 110.15,
    image: 'https://randomuser.me/api/portraits/women/44.jpg'
  },
  {
    id: 4,
    name: 'Alfonso Ramirez',
    weightClass: '-93kg',
    category: 'Open',
    country: 'es',
    sq: 297.5,
    bp: 175,
    dl: 312.5,
    total: 785.5,
    gl: 110.15,
    image: 'https://randomuser.me/api/portraits/men/45.jpg'
  },
  {
    id: 5,
    name: 'Inmaculada Soto',
    weightClass: '-63kg',
    category: 'Open',
    country: 'es',
    sq: 180,
    bp: 110,
    dl: 220.5,
    total: 510.5,
    gl: 111.84,
    image: null
  },
  {
    id: 6,
    name: 'Willando Savat',
    weightClass: '-93kg',
    category: 'Open',
    country: 'be',
    sq: 290,
    bp: 170,
    dl: 300,
    total: 760,
    gl: 110.95,
    image: 'https://randomuser.me/api/portraits/men/22.jpg'
  },
  {
    id: 7,
    name: 'Hakird Soto',
    weightClass: '-63kg',
    category: 'Open',
    country: 'es',
    sq: 180,
    bp: 110,
    dl: 220.5,
    total: 510.5,
    gl: 110.15,
    image: null
  },
  {
    id: 8,
    name: 'Capella Jrmas',
    weightClass: '-93kg',
    category: 'Open',
    country: 'es',
    sq: 280,
    bp: 160,
    dl: 290,
    total: 730,
    gl: 110.95,
    image: 'https://randomuser.me/api/portraits/men/11.jpg'
  },
  {
    id: 9,
    name: 'Inmaculada Soto',
    weightClass: '-63kg',
    category: 'Open',
    country: 'es',
    sq: 180,
    bp: 110,
    dl: 220.5,
    total: 510.5,
    gl: 110.94,
    image: null
  },
    {
    id: 10,
    name: 'Inmaculada Soto',
    weightClass: '-63kg',
    category: 'Open',
    country: 'es',
    sq: 180,
    bp: 110,
    dl: 220.5,
    total: 510.5,
    gl: 110.95,
    image: null
  }
];

const AthleteCard = ({ athlete, selected, onClick }) => {
  return (
    <div 
      className={`athlete-card ${selected ? 'selected' : ''}`}
      onClick={onClick}
    >
      {/* GL Badge */}
      <div className="gl-badge">
        {athlete.gl}
        <span>GL</span>
      </div>

      {/* Image */}
      <div className="athlete-image-container">
        {athlete.image ? (
          <img src={athlete.image} alt={athlete.name} />
        ) : (
            <div className="athlete-placeholder">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                </svg>
            </div>
        )}
      </div>

      {/* Name & Category */}
      <h3 className="athlete-name">{athlete.name}</h3>
      <div className="athlete-category">
        {athlete.country === 'es' && <span title="Spain">🇪🇸</span>}
        {athlete.country === 'be' && <span title="Belgium">🇧🇪</span>}
        <span>{athlete.weightClass} • {athlete.category}</span>
      </div>

      {/* Stats Grid */}
      <div className="athlete-stats-grid">
        <div className="stat-item">
          <span className="stat-label">SQ</span>
          <span className="stat-value">{athlete.sq}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">BP</span>
          <span className="stat-value">{athlete.bp}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">DL</span>
          <span className="stat-value">{athlete.dl}</span>
        </div>
      </div>

      {/* Total */}
      <div className="athlete-total">
        {athlete.total} <span>kg</span>
        <span className="total-label">Total</span>
      </div>
    </div>
  );
};

const Athletes = () => {
    const [selectedId, setSelectedId] = useState(1);

  return (
    <div className="athletes-container">
      <div className="athletes-header">
        <h2 className="athletes-title">Atletas Registrados</h2>
        
        <div className="athletes-filters">
          <button className="filter-btn filter-primary">Filtre</button>
          <button className="filter-btn">F category ⌄</button>
          <button className="filter-btn">Dashboard</button>
          <button className="filter-btn">Critary wants ⌄</button>
        </div>
      </div>

      <div className="athletes-grid">
        {MOCK_ATHLETES.map(athlete => (
          <AthleteCard 
            key={athlete.id} 
            athlete={athlete} 
            selected={selectedId === athlete.id}
            onClick={() => setSelectedId(athlete.id)}
          />
        ))}
      </div>
    </div>
  );
};

export default Athletes;
