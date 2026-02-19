import { useState } from 'react';
import { Bell, Moon, Search, Camera } from 'lucide-react';
import '../styles/Header.css';
import ProfileUploadModal from './ProfileUploadModal';

const Header = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

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
          <button className="icon-button">
            <Moon size={20} />
          </button>
          <div className="user-section">
            <button className="upload-btn" onClick={() => setIsModalOpen(true)}>
              <Camera size={20} />
              <span>Sube tu foto</span>
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
