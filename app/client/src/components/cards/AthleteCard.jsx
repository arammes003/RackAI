import '../../styles/Athletes.css';

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

export default AthleteCard;