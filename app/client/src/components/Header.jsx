import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Moon, Sun, Search, Camera } from 'lucide-react';
import '../styles/Header.css';
import ProfileUploadModal from './ProfileUploadModal';
import { API_URL } from '../config/api';

const Header = () => {
  const navigate = useNavigate();
  const searchRef = useRef(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) return savedTheme === 'dark';
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [athletesCache, setAthletesCache] = useState(null);
  const [competitionsCache, setCompetitionsCache] = useState(null);
  const [results, setResults] = useState({ athletes: [], competitions: [], clubs: [] });

  useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) {
      root.setAttribute('data-theme', 'dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.removeAttribute('data-theme');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  useEffect(() => {
    const onDocMouseDown = (e) => {
      if (!searchRef.current) return;
      if (!searchRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocMouseDown);
    return () => document.removeEventListener('mousedown', onDocMouseDown);
  }, []);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults({ athletes: [], competitions: [], clubs: [] });
      setIsSearching(false);
      return;
    }

    let cancelled = false;
    setIsSearching(true);

    const t = setTimeout(async () => {
      try {
        const lower = q.toLowerCase();

        const fetchAthletes = async () => {
          if (athletesCache) return athletesCache;
          const res = await fetch(`${API_URL}/athletes`);
          const data = await res.json();
          setAthletesCache(data);
          return data;
        };

        const fetchCompetitions = async () => {
          if (competitionsCache) return competitionsCache;
          const res = await fetch(`${API_URL}/analytics/upcoming-competitions`);
          const data = await res.json();
          setCompetitionsCache(data);
          return data;
        };

        const fetchClubs = async () => {
          const res = await fetch(`${API_URL}/clubs?q=${encodeURIComponent(q)}&limit=8`);
          if (!res.ok) return [];
          return await res.json();
        };

        const [athletes, competitions, clubs] = await Promise.all([
          fetchAthletes(),
          fetchCompetitions(),
          fetchClubs(),
        ]);

        if (cancelled) return;

        const athleteMatches = (athletes || [])
          .filter(a => (a.name || '').toLowerCase().includes(lower))
          .slice(0, 8);

        const competitionMatches = (competitions || [])
          .filter(c => (c.name || '').toLowerCase().includes(lower))
          .slice(0, 6);

        const clubMatches = (clubs || []).slice(0, 8);

        setResults({ athletes: athleteMatches, competitions: competitionMatches, clubs: clubMatches });
      } catch (e) {
        if (!cancelled) setResults({ athletes: [], competitions: [], clubs: [] });
      } finally {
        if (!cancelled) setIsSearching(false);
      }
    }, 200);

    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [query, athletesCache, competitionsCache]);

  const onPick = (type, item) => {
    setIsOpen(false);

    if (type === 'athlete') {
      navigate(`/atletas?q=${encodeURIComponent(item.name || '')}`);
      return;
    }
    if (type === 'competition') {
      navigate(`/competiciones?q=${encodeURIComponent(item.name || '')}`);
      return;
    }
    if (type === 'club') {
      navigate(`/clubes?q=${encodeURIComponent(item.name || '')}`);
    }
  };

  return (
    <div className="header-wrapper">
      <header className="header">
        <div className="header-left">
          <div className="search-bar" ref={searchRef}>
            <Search size={20} className="search-icon" />
            <input 
              type="text" 
              placeholder="Buscar..." 
              className="search-input"
              value={query}
              onChange={(e) => {
                const next = e.target.value;
                setQuery(next);
                setIsOpen(next.trim().length >= 1);
              }}
              onFocus={() => setIsOpen(query.trim().length >= 1)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') setIsOpen(false);
              }}
            />

            {isOpen && (
              <div className="search-dropdown" role="listbox">
                {isSearching && (
                  <div className="search-empty">Buscando…</div>
                )}

                {!isSearching &&
                  !results.athletes.length &&
                  !results.competitions.length &&
                  !results.clubs.length && (
                    <div className="search-empty">Escribe para buscar atletas, clubes o competiciones</div>
                  )}

                {!!results.athletes.length && (
                  <div className="search-section">
                    <div className="search-section-title">Atletas</div>
                    {results.athletes.map((a) => (
                      <button
                        key={a.athlete_id || a.slug || a.id || a.name}
                        className="search-item"
                        onClick={() => onPick('athlete', a)}
                      >
                        <span className="search-item-main">{a.name}</span>
                        <span className="search-badge athlete">Atleta</span>
                      </button>
                    ))}
                  </div>
                )}

                {!!results.competitions.length && (
                  <div className="search-section">
                    <div className="search-section-title">Competiciones</div>
                    {results.competitions.map((c) => (
                      <button
                        key={c._id || c.slug || c.id || c.name}
                        className="search-item"
                        onClick={() => onPick('competition', c)}
                      >
                        <span className="search-item-main">
                          {c.name}
                          {(c.town || c.federation) && (
                            <span className="search-item-sub">
                              {c.town ? ` · ${c.town}` : ''}{c.federation ? ` · ${c.federation}` : ''}
                            </span>
                          )}
                        </span>
                        <span className="search-badge competition">Competición</span>
                      </button>
                    ))}
                  </div>
                )}

                {!!results.clubs.length && (
                  <div className="search-section">
                    <div className="search-section-title">Clubes</div>
                    {results.clubs.map((cl) => (
                      <button
                        key={cl.name}
                        className="search-item"
                        onClick={() => onPick('club', cl)}
                      >
                        <span className="search-item-main">{cl.name}</span>
                        <span className="search-badge club">Club</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        
        <div className="header-right">
          <button className="icon-button">
            <Bell size={20} />
          </button>
          <button className="icon-button" onClick={toggleTheme} aria-label="Toggle Dark Mode">
            {isDarkMode ? <Sun size={20} className="active-theme-icon" /> : <Moon size={20} />}
          </button>
          <div className="user-section">
            <button className="upload-btn" onClick={() => setIsModalOpen(true)}>
              <Camera size={20} />
              <span>Reclamar mi Perfil</span>
            </button>
          </div>
        </div>
      </header>
      
      <ProfileUploadModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </div>
  );
};

export default Header;
