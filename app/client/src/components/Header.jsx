import { Bell, Mail, Search } from 'lucide-react';
import '../styles/Header.css';

const Header = () => {
  return (
    <div className="header-wrapper">
      <header className="header">
        <div className="header-left">
          <div className="search-bar">
            <Search size={22} className="search-icon" />
            <input 
              type="text" 
              placeholder="Search task" 
              className="search-input"
            />
          </div>
        </div>
        
        <div className="header-right">
          <button className="icon-button">
            <Mail size={24} />
          </button>
          <button className="icon-button">
            <Bell size={24} />
          </button>
          <div className="user-section">
            <div className="user-avatar-container">
              <img 
                src="https://imgs.search.brave.com/hBN2I03fDLcovnqJJypBATrSytlToeOW87L29RIt_Iw/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9kMmdq/cWg5ajI2dW5wMC5j/bG91ZGZyb250Lm5l/dC9wcm9maWxlcGlj/Lzk4ZmM5OTBlYmUy/ZTZiYTViOTc3ZGFi/ZDYzYTRmNDY2" 
                alt="Avatar" 
                className="user-avatar-img" 
              />
            </div>
            <div className="user-info">
              <span className="user-name">Alfonso Ramirez</span>
              <span className="user-email">alfonso.ramirez@rackai.com</span>
            </div>
          </div>
        </div>
      </header>
    </div>
  );
};

export default Header;
