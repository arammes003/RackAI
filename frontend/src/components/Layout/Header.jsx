import { useLocation } from 'react-router-dom';
import { Bell, Search } from 'lucide-react';
import './Header.css';

const pageTitles = {
  '/': { title: 'Dashboard', subtitle: 'Vista general del powerlifting en España' },
  '/rankings': { title: 'Rankings', subtitle: 'Rankings nacionales por categoría de peso' },
  '/atletas': { title: 'Atletas', subtitle: 'Búsqueda y perfiles de atletas españoles' },
  '/competiciones': { title: 'Competiciones', subtitle: 'Calendario y estadísticas de competiciones' },
  '/retencion': { title: 'Retención', subtitle: 'Engagement, churn y fidelización de atletas' },
  '/mercado': { title: 'Mercado', subtitle: 'Inteligencia de mercado y tendencias del deporte' },
  '/plataforma': { title: 'Plataforma', subtitle: 'Métricas de salud y operaciones de la plataforma' },
};

export default function Header() {
  const location = useLocation();
  const page = pageTitles[location.pathname] || pageTitles['/'];

  return (
    <header className="header">
      <div className="header-left">
        <h2 className="header-title">{page.title}</h2>
        <span className="header-subtitle">{page.subtitle}</span>
      </div>
      <div className="header-right">
        <div className="header-search">
          <Search size={16} />
          <input type="text" placeholder="Buscar..." />
        </div>
        <button className="header-icon-btn" aria-label="Notificaciones">
          <Bell size={20} />
          <span className="header-notification-dot" />
        </button>
        <div className="header-avatar">ES</div>
      </div>
    </header>
  );
}
