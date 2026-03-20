import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Trophy, Users, CalendarDays,
  RefreshCcw, TrendingUp, Settings, Dumbbell
} from 'lucide-react';
import './Sidebar.css';

const navigation = [
  {
    items: [
      { to: '/', icon: LayoutDashboard, label: 'Inicio' },
    ],
  },
  {
    section: 'Datos',
    items: [
      { to: '/rankings', icon: Trophy, label: 'Rankings' },
      { to: '/atletas', icon: Users, label: 'Atletas' },
      { to: '/competiciones', icon: CalendarDays, label: 'Competiciones' },
      { to: '/clubes', icon: Users, label: 'Clubes' },
    ],
  },
  {
    section: 'Análisis',
    items: [
      { to: '/evolucion', icon: TrendingUp, label: 'Evolución' },
      { to: '/retencion', icon: RefreshCcw, label: 'Retención' },
      { to: '/mercado', icon: TrendingUp, label: 'Mercado' },
    ],
  },
  {
    section: 'Herramientas',
    items: [
      { to: '/comparador', icon: RefreshCcw, label: 'Comparador' }
    ],
  },
  {
    section: 'Sistema',
    items: [
      { to: '/plataforma', icon: Settings, label: 'Plataforma' },
    ],
  },
];

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">
          <Dumbbell size={22} />
        </div>
        <div className="sidebar-logo-text">
          <h1>RackAI</h1>
          <span>Powerlifting España</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        {navigation.map((section) => (
          <div key={section.section} className="sidebar-section">
            <div className="sidebar-section-title">{section.section}</div>
            {section.items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `sidebar-link${isActive ? ' active' : ''}`
                }
              >
                <item.icon />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <p className="sidebar-version">RackAI v2.0 — España</p>
      </div>
    </aside>
  );
}
