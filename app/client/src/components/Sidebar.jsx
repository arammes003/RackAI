import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Trophy, Users, Dumbbell, Settings, Menu, HelpCircle, PanelLeftClose, Medal, Calendar } from 'lucide-react';
import logo from '../assets/RackAIv2.png';
import '../styles/Sidebar.css';

const Sidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Group items by section
  const dashboardItems = [
    { name: 'Inicio', path: '/', icon: Home },
  ];

  const datosItems = [
    { name: 'Competiciones', path: '/competitions', icon: Calendar },
    { name: 'Rankings', path: '/rankings', icon: Medal },
    { name: 'Atletas', path: '/athletes', icon: Dumbbell },
    { name: 'Clubes', path: '/clubs', icon: Users },
  ];


  const generalItems = [
    { name: 'Ajustes', path: '/settings', icon: Settings },
    { name: 'Ayuda', path: '/help', icon: HelpCircle },
  ];

  const renderNavItems = (items) => items.map((item) => {
    const isLink = !item.onClick;
    const Wrapper = isLink ? NavLink : 'div';
    const wrapperProps = isLink ? {
      to: item.path,
      className: ({ isActive }) =>
        `sidebar-nav-item ${isActive ? 'sidebar-nav-item-active' : 'sidebar-nav-item-inactive'}`,
      title: isCollapsed ? item.name : ''
    } : {
      className: 'sidebar-nav-item sidebar-nav-item-inactive',
      onClick: item.onClick,
      title: isCollapsed ? item.name : '',
      style: { cursor: 'pointer' }
    };

    return (
      <Wrapper key={item.name} {...wrapperProps}>
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
      </Wrapper>
    );
  });

  return (
    <aside 
      className={`dashboard-sidebar ${
        isCollapsed ? 'dashboard-sidebar-collapsed' : 'dashboard-sidebar-expanded'
      }`}
    >
      <div className={`sidebar-header ${isCollapsed ? 'sidebar-header-collapsed' : 'sidebar-header-expanded'}`}>
          {!isCollapsed && (
              <div className="sidebar-title-container">
                  <img src={logo} alt="RackAI Logo" className="sidebar-logo" />
                  <h1 className="sidebar-title">
                      RackAI
                  </h1>
              </div>
          )}
          <button 
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="sidebar-toggle-button"
          >
              {isCollapsed ? <Menu /> : <PanelLeftClose />}
          </button>
      </div>
      
      <nav className="sidebar-nav">
        <div className="sidebar-nav-group-label">DASHBOARD</div>
        {renderNavItems(dashboardItems)}
        
        <div className="sidebar-nav-group-label">DATOS</div>
        {renderNavItems(datosItems)}

        <div className="sidebar-nav-group-label">GENERAL</div>
        {renderNavItems(generalItems)}
      </nav>
    </aside>
  );
};

export default Sidebar;
