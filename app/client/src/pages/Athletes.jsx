import React, { useState, useEffect } from 'react';
import '../styles/Athletes.css';
import '../styles/Home.css';
import AthleteCard from '../components/AthleteCard';
import PageLayout from '../layouts/PageLayout';

const Athletes = () => {
  const [selectedId, setSelectedId] = useState(null);
  const [allAthletes, setAllAthletes] = useState([]);
  const [loading, setLoading] = useState(true);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  useEffect(() => {
    const fetchAthletes = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/v1/athletes_profiles');
        let data = await response.json();
        
        data = data.map(athlete => {
          const initialsAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(athlete.name)}&background=random&color=fff`;
          return {
            ...athlete,
            image: athlete.image || initialsAvatar,
            // Proveer valores por defecto en caso de no tener los stats completos
            sq: athlete.sq || '-',
            bp: athlete.bp || '-',
            dl: athlete.dl || '-',
            total: athlete.total || '-',
            gl: athlete.gl || '-',
            weightClass: athlete.weightClass || '-',
            category: athlete.category || 'Open'
          };
        });
        
        setAllAthletes(data);
      } catch (error) {
        console.error('Error fetching athletes:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAthletes();
  }, []);

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = allAthletes.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(allAthletes.length / itemsPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <PageLayout 
        title="Atletas Registrados"
        subtitle="Evolución del Powerlifting en España"
    >
      {loading ? (
        <div style={{ padding: '2rem', textAlign: 'center' }}>Cargando atletas...</div>
      ) : (
        <>
          <div className="athletes-grid">
            {currentItems.map(athlete => (
              <AthleteCard 
                key={athlete.id || athlete.athlete_id} 
                athlete={athlete} 
                selected={selectedId === (athlete.id || athlete.athlete_id)}
                onClick={() => setSelectedId(athlete.id || athlete.athlete_id)}
              />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="pagination-controls">
              <button 
                className="pagination-btn" 
                onClick={() => handlePageChange(currentPage - 1)} 
                disabled={currentPage === 1}
              >
                Anterior
              </button>
              <span className="pagination-info">
                Página {currentPage} de {totalPages}
              </span>
              <button 
                className="pagination-btn" 
                onClick={() => handlePageChange(currentPage + 1)} 
                disabled={currentPage === totalPages}
              >
                Siguiente
              </button>
            </div>
          )}
        </>
      )}
    </PageLayout>
  );
};

export default Athletes;
