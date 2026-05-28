import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLang } from '../../context/LangContext';
import ChatbotWidget from '../chatbot/ChatbotWidget';
import {
  LayoutDashboard, FileText, Quote, Users, Package,
  CreditCard, BarChart2, Settings, LogOut, Menu, X, Globe
} from 'lucide-react';

export default function AppLayout() {
  const { user, logout, isAdmin } = useAuth();
  const { t, lang, toggle } = useLang();
  const [sideOpen, setSideOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  const navItems = [
    ...(user?.canViewData !== false ? [{ to: '/', icon: LayoutDashboard, label: t.nav.dashboard, end: true }] : []),
    { to: '/invoices', icon: FileText, label: t.nav.invoices },
    { to: '/quotes', icon: Quote, label: t.nav.quotes },
    { to: '/clients', icon: Users, label: t.nav.clients },
    { to: '/catalog', icon: Package, label: t.nav.catalog },
    { to: '/payments', icon: CreditCard, label: t.nav.payments },
    ...(user?.canViewData !== false ? [{ to: '/reports', icon: BarChart2, label: t.nav.reports }] : []),
  ];

  return (
    <div className="app-shell">
      {/* Mobile overlay */}
      {sideOpen && <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 150 }} onClick={() => setSideOpen(false)} />}

      {/* Sidebar */}
      <aside className={`sidebar ${sideOpen ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <img src="/logo.png" alt="SOS DIGITAL" style={{ width: 40, height: 40, borderRadius: 10, objectFit: 'cover' }} />
          <div>
            <div className="brand-name">SOS DIGITAL</div>
            <div className="brand-sub">{t.app.subtitle}</div>
          </div>
        </div>

        <nav className="nav-section" style={{ flex: 1 }}>
          <div className="nav-label">Menu</div>
          {navItems.map(({ to, icon: Icon, label, end }) => (
            <NavLink
              key={to} to={to} end={end}
              className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
              onClick={() => setSideOpen(false)}
            >
              <Icon size={17} />{label}
            </NavLink>
          ))}
          {isAdmin && (
            <NavLink to="/settings" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`} onClick={() => setSideOpen(false)}>
              <Settings size={17} />{t.nav.settings}
            </NavLink>
          )}
        </nav>

        {/* User info */}
        <div style={{ padding: '16px', borderTop: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg,var(--primary),var(--primary-dark))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13, color: 'white' }}>
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{user?.name}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{user?.role}</div>
            </div>
          </div>
          <button className="nav-item" style={{ width: '100%', border: 'none', background: 'transparent' }} onClick={handleLogout}>
            <LogOut size={15} />{t.nav.logout}
          </button>
        </div>
      </aside>

      <div className="main-area">
        {/* Topbar */}
        <header className="topbar">
          <button className="btn-icon" onClick={() => setSideOpen(!sideOpen)} style={{ display: 'flex' }}>
            {sideOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
          <div style={{ flex: 1 }} />
          <div className="lang-toggle">
            <button className={`lang-btn${lang === 'fr' ? ' active' : ''}`} onClick={() => lang !== 'fr' && toggle()}>FR</button>
            <button className={`lang-btn${lang === 'en' ? ' active' : ''}`} onClick={() => lang !== 'en' && toggle()}>EN</button>
          </div>
        </header>

        <main className="page-content">
          <Outlet />
        </main>
      </div>

      <ChatbotWidget />
    </div>
  );
}
