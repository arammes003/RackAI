import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Settings, Menu, HelpCircle, PanelLeftClose, Medal, Calendar, User, Shield, TrendingUp, PieChart, RefreshCw, Scale, Monitor } from 'lucide-react';
import logo from '../assets/RackAIv2.avif';
import '../styles/Sidebar.css';

const Sidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Group items by section
  const dashboardItems = [
    { name: 'Inicio', path: '/', icon: Home },
  ];

  const datosItems = [
    { name: 'Competiciones', path: '/competiciones', icon: Calendar },
    { name: 'Rankings', path: '/rankings', icon: Medal },
    { name: 'Atletas', path: '/atletas', icon: User },
    { name: 'Clubes', path: '/clubes', icon: Shield },
  ];

  const herramientasItems = [
    { name: 'Comparador', path: '/comparador', icon: Scale },
  ];

  const analisisItems = [
    { name: 'Evolución', path: '/evolucion', icon: TrendingUp },
    { name: 'Mercado', path: '/mercado', icon: PieChart },
    { name: 'Retención', path: '/retencion', icon: RefreshCw },
  ];

  const sistemaItems = [
    { name: 'Plataforma', path: '/plataforma', icon: Monitor },
  ];

  const generalItems = [
    { name: 'Ajustes', path: '/ajustes', icon: Settings },
    { name: 'Ayuda', path: '/ayuda', icon: HelpCircle },
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
        {renderNavItems(dashboardItems)}
        
        <div className="sidebar-nav-group-label">DATOS</div>
        {renderNavItems(datosItems)}

        <div className="sidebar-nav-group-label">ANÁLISIS</div>
        {renderNavItems(analisisItems)}

        <div className="sidebar-nav-group-label">HERRAMIENTAS</div>
        {renderNavItems(herramientasItems)}

        <div className="sidebar-nav-group-label">SISTEMA</div>
        {renderNavItems(sistemaItems)}

        <div className="sidebar-nav-group-label">GENERAL</div>
        {renderNavItems(generalItems)}
      </nav>
    </aside>
  );
};

export default Sidebar;
