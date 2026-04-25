import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import {
  LayoutDashboard, MapPin, List, Users, ClipboardList,
  LogOut, User, Menu, X, Leaf, BarChart
} from 'lucide-react';
import { useState } from 'react';

const navItems = [
  { to: '/dashboard',  icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/needs',      icon: List,            label: 'Needs' },
  { to: '/volunteers', icon: Users,           label: 'Volunteers' },
  { to: '/tasks',      icon: ClipboardList,   label: 'Tasks' },
  { to: '/needs-map',  icon: MapPin,          label: 'Needs Map' },
  { to: '/impact',     icon: BarChart,        label: 'Impact Report' },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const roleBadge = {
    COORDINATOR: 'badge-blue',
    VOLUNTEER:   'badge-green',
    FIELD_WORKER:'badge-yellow',
  }[user?.role] ?? 'badge-gray';

  return (
    <div className="flex h-screen overflow-hidden bg-surface">
      {/* ── Mobile overlay ── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/60 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ── */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 w-64 bg-surface-card border-r border-surface-border
          flex flex-col transition-transform duration-300
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static`}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-surface-border">
          <div className="w-9 h-9 bg-brand-500 rounded-xl flex items-center justify-center shadow-lg shadow-brand-500/30">
            <Leaf className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-gradient">SevaSetu</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
                ${isActive
                  ? 'bg-brand-500/15 text-brand-400 shadow-inner'
                  : 'text-slate-400 hover:bg-surface hover:text-slate-200'}`
              }
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* User footer */}
        <div className="px-4 py-4 border-t border-surface-border">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-brand-500/20 flex items-center justify-center text-brand-400 font-bold text-sm flex-shrink-0">
              {user?.name?.[0]?.toUpperCase() ?? 'U'}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white truncate">{user?.name}</p>
              <span className={`${roleBadge} text-[10px]`}>{user?.role}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => { navigate('/profile'); setSidebarOpen(false); }}
              className="flex-1 btn-secondary text-xs py-1.5 justify-center"
            >
              <User className="w-3.5 h-3.5" /> Profile
            </button>
            <button onClick={handleLogout} className="btn-danger text-xs py-1.5 px-3">
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar (mobile) */}
        <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-surface-card border-b border-surface-border">
          <button onClick={() => setSidebarOpen(true)} className="text-slate-400 hover:text-white transition-colors">
            <Menu className="w-6 h-6" />
          </button>
          <span className="font-bold text-gradient">SevaSetu</span>
          <div className="w-6" />
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8 animate-fade-in">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
