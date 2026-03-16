import React, { useState, useEffect } from 'react';
import { API_URL } from '../config/api';
import '../styles/Athletes.css';
import AthleteCard from '../components/cards/AthleteCard';
import PageLayout from '../layouts/PageLayout';

const Athletes = () => {
  const initialQuery = new URLSearchParams(window.location.search).get('q') || '';
  const [selectedId, setSelectedId] = useState(null);
  const [allAthletes, setAllAthletes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [showSort, setShowSort] = useState(false);
  const [filters, setFilters] = useState({
    name: initialQuery,
    category: '',
    weightClass: '',
    country: ''
  });
  const [sort, setSort] = useState({ key: 'gl', dir: 'desc' });

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);

  useEffect(() => {
    const fetchAthletes = async () => {
      try {
        const response = await fetch(`${API_URL}/athletes_profiles`);
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

  const filteredAthletes = allAthletes.filter((athlete) => {
    const nameOk =
      !filters.name ||
      (athlete.name || '').toLowerCase().includes(filters.name.toLowerCase());
    const categoryOk =
      !filters.category ||
      (athlete.category || '').toLowerCase() === filters.category.toLowerCase();
    const weightClassOk =
      !filters.weightClass ||
      (athlete.weightClass || '').toLowerCase() === filters.weightClass.toLowerCase();
    const countryOk =
      !filters.country ||
      (athlete.country || '').toLowerCase() === filters.country.toLowerCase();

    return nameOk && categoryOk && weightClassOk && countryOk;
  });

  const sortedAthletes = [...filteredAthletes].sort((a, b) => {
    const dir = sort.dir === 'asc' ? 1 : -1;

    const num = (v) => {
      const n = Number(v);
      return Number.isFinite(n) ? n : -Infinity;
    };

    if (sort.key === 'name') {
      const an = (a.name || '').toLowerCase();
      const bn = (b.name || '').toLowerCase();
      return dir * an.localeCompare(bn);
    }

    if (sort.key === 'total') return dir * (num(a.total) - num(b.total));
    if (sort.key === 'sq') return dir * (num(a.sq) - num(b.sq));
    if (sort.key === 'bp') return dir * (num(a.bp) - num(b.bp));
    if (sort.key === 'dl') return dir * (num(a.dl) - num(b.dl));

    // default: gl
    return dir * (num(a.gl) - num(b.gl));
  });

  const uniqueCategories = Array.from(
    new Set(allAthletes.map(a => a.category).filter(Boolean))
  ).sort((a, b) => a.localeCompare(b));

  const uniqueWeightClasses = Array.from(
    new Set(allAthletes.map(a => a.weightClass).filter(Boolean))
  ).sort((a, b) => a.localeCompare(b));

  useEffect(() => {
    setCurrentPage(1);
  }, [filters.name, filters.category, filters.weightClass, filters.country, sort.key, sort.dir]);

  useEffect(() => {
    setCurrentPage(1);
  }, [itemsPerPage]);

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = sortedAthletes.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(sortedAthletes.length / itemsPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    const scrollContainer = document.querySelector('.layout-container');
    if (scrollContainer) {
      scrollContainer.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const clearFilters = () => {
    setFilters({ name: '', category: '', weightClass: '', country: '' });
    setShowFilters(false);
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
          <div className="athletes-toolbar">
            <div className="athletes-toolbar-left">
              <button
                className="filter-btn"
                onClick={() => setShowFilters(v => !v)}
                aria-expanded={showFilters}
              >
                {showFilters ? 'Cerrar filtros' : 'Filtrar'}
              </button>
              <div className="athletes-results">
                {sortedAthletes.length} resultados
              </div>
            </div>
            <div className="athletes-toolbar-right">
              <button
                className="filter-btn"
                onClick={() => setShowSort(v => !v)}
                aria-expanded={showSort}
              >
                Ordenar
              </button>
              {(filters.name || filters.category || filters.weightClass || filters.country) && (
                <button className="filter-btn secondary" onClick={clearFilters}>
                  Limpiar
                </button>
              )}
            </div>
          </div>

          {showSort && (
            <div className="filters-panel sort-panel">
              <div className="filters-grid sort-grid">
                <label className="filter-field">
                  <span>Criterio</span>
                  <select
                    value={sort.key}
                    onChange={(e) => setSort(s => ({ ...s, key: e.target.value }))}
                  >
                    <option value="gl">GL</option>
                    <option value="total">Total</option>
                    <option value="sq">SQ</option>
                    <option value="bp">BP</option>
                    <option value="dl">DL</option>
                    <option value="name">Nombre</option>
                  </select>
                </label>

                <label className="filter-field">
                  <span>Dirección</span>
                  <select
                    value={sort.dir}
                    onChange={(e) => setSort(s => ({ ...s, dir: e.target.value }))}
                  >
                    <option value="desc">Descendente</option>
                    <option value="asc">Ascendente</option>
                  </select>
                </label>
              </div>
            </div>
          )}

          {showFilters && (
            <div className="filters-panel">
              <div className="filters-grid">
                <label className="filter-field">
                  <span>Nombre</span>
                  <input
                    value={filters.name}
                    onChange={(e) => setFilters(f => ({ ...f, name: e.target.value }))}
                    placeholder="Buscar por nombre…"
                  />
                </label>

                <label className="filter-field">
                  <span>Categoría</span>
                  <select
                    value={filters.category}
                    onChange={(e) => setFilters(f => ({ ...f, category: e.target.value }))}
                  >
                    <option value="">Todas</option>
                    {uniqueCategories.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </label>

                <label className="filter-field">
                  <span>Weight class</span>
                  <select
                    value={filters.weightClass}
                    onChange={(e) => setFilters(f => ({ ...f, weightClass: e.target.value }))}
                  >
                    <option value="">Todas</option>
                    {uniqueWeightClasses.map((w) => (
                      <option key={w} value={w}>{w}</option>
                    ))}
                  </select>
                </label>

                <label className="filter-field">
                  <span>País</span>
                  <select
                    value={filters.country}
                    onChange={(e) => setFilters(f => ({ ...f, country: e.target.value }))}
                  >
                    <option value="">Todos</option>
                    <option value="es">España</option>
                    <option value="be">Bélgica</option>
                  </select>
                </label>
              </div>
            </div>
          )}

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
                onClick={() => handlePageChange(1)}
                disabled={currentPage === 1}
                aria-label="Ir a la primera página"
                title="Primera"
              >
                Primera
              </button>
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
              <button
                className="pagination-btn"
                onClick={() => handlePageChange(totalPages)}
                disabled={currentPage === totalPages}
                aria-label="Ir a la última página"
                title="Última"
              >
                Última
              </button>

              <div className="pagination-per-page">
                <span className="pagination-per-page-label">Por página</span>
                <select
                  className="pagination-select"
                  value={itemsPerPage}
                  onChange={(e) => setItemsPerPage(Number(e.target.value))}
                >
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                  <option value={200}>200</option>
                </select>
              </div>
            </div>
          )}
        </>
      )}
    </PageLayout>
  );
};

export default Athletes;
