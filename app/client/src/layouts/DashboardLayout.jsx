import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Trophy, Users, Dumbbell, Settings, LogOut, ChevronLeft, Menu } from 'lucide-react';
import Header from '../components/Header';
import logo from '../assets/RackAIv2.png';
import '../styles/DashboardLayout.css';

const DashboardLayout = ({ children }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const menuItems = [
    { name: 'Inicio', path: '/', icon: Home },
    { name: 'Competiciones', path: '/competitions', icon: Trophy },
    { name: 'Clubes', path: '/clubs', icon: Users },
    { name: 'Atletas', path: '/athletes', icon: Dumbbell },
  ];

  const generalItems = [
    { name: 'Ajustes', path: '/settings', icon: Settings },
  ];

  const renderNavItems = (items) => items.map((item) => (
    <NavLink
      key={item.name}
      to={item.path}
      className={({ isActive }) =>
        `sidebar-nav-item ${
          isActive ? 'sidebar-nav-item-active' : 'sidebar-nav-item-inactive'
        }`
      }
      title={isCollapsed ? item.name : ''}
    >
      <div className="sidebar-nav-icon-wrapper">
        <item.icon className="sidebar-nav-icon" />
      </div>
      <span className="sidebar-nav-label">{item.name}</span>
      
      {/* Tooltip for collapsed state */}
      {isCollapsed && (
        <div className="sidebar-nav-tooltip">
            {item.name}
        </div>
      )}
    </NavLink>
  ));

  return (
    <div className="dashboard-layout">
      {/* Sidebar */}
      <aside 
        className={`dashboard-sidebar ${
          isCollapsed ? 'dashboard-sidebar-collapsed' : 'dashboard-sidebar-expanded'
        }`}
      >
        {/* Toggle Button */}
        <div className={`sidebar-header ${isCollapsed ? 'sidebar-header-collapsed' : 'sidebar-header-expanded'}`}>
            <button 
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="sidebar-toggle-button"
            >
                {isCollapsed ? <Menu className="w-6 h-6" /> : <ChevronLeft className="w-6 h-6" />}
            </button>
            {!isCollapsed && (
                <div className="sidebar-title-container">
                    <img src={logo} alt="RackAI Logo" className="sidebar-logo" />
                    <h1 className="sidebar-title">
                        RackAI
                    </h1>
                </div>
            )}
        </div>
        
        <nav className="sidebar-nav">
          <div className="sidebar-nav-group-label">MENU</div>
          {renderNavItems(menuItems)}
          
            <div className="sidebar-nav-group-label">GENERAL</div>
            {renderNavItems(generalItems)}

        </nav>

        <button 
            className="sidebar-logout-button"
            title={isCollapsed ? 'Cerrar Sesión' : ''}
        >
          <LogOut className={`sidebar-logout-icon ${isCollapsed ? '' : 'sidebar-logout-icon-margin'}`} />
          <span className="sidebar-nav-label">Cerrar Sesión</span>
        </button>
      </aside>

      <div className="main-container">
        <Header />
        {/* Main Content */}
        <main className="dashboard-main">
          <div className="dashboard-main-scroll">
            <div className="dashboard-main-content">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
