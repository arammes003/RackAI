import { useState, useEffect } from 'react';
import { Bell, Moon, Sun, Search, Camera } from 'lucide-react';
import '../styles/Header.css';
import ProfileUploadModal from './ProfileUploadModal';

const Header = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) return savedTheme === 'dark';
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

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

  return (
    <div className="header-wrapper">
      <header className="header">
        <div className="header-left">
          <div className="search-bar">
            <Search size={20} className="search-icon" />
            <input 
              type="text" 
              placeholder="Buscar..." 
              className="search-input"
            />
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
