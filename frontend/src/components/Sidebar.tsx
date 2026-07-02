import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Megaphone,
  BookOpen,
  MapPin,
  LogOut,
  Users,
  Settings,
  ShoppingBag,
  Briefcase,
  Bot,
  Calendar,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;       // mobile drawer open
  setIsOpen: (open: boolean) => void;
  collapsed: boolean;    // desktop icon-only rail
  setCollapsed: (c: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen, collapsed, setCollapsed }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const getDashboardLink = () => {
    if (user?.role === 'admin') return '/admin/dashboard';
    if (user?.role === 'faculty') return '/faculty/dashboard';
    return '/student/dashboard';
  };

  // Avatar helpers
  const getAvatarColor = (name: string): string => {
    const colors = [
      'bg-brand-500', 'bg-purple-500', 'bg-indigo-500',
      'bg-blue-500', 'bg-teal-500', 'bg-amber-500', 'bg-rose-500',
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  const getInitials = (name: string): string =>
    name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

  const hasAvatar = (avatar?: string | null): boolean => {
    if (!avatar) return false;
    if (avatar.includes('res.cloudinary.com/dummy')) return false;
    return true;
  };

  const baseLinks = [
    { name: 'Dashboard', path: getDashboardLink(), icon: LayoutDashboard },
    { name: 'Attendance', path: '/attendance', icon: Calendar },
    { name: 'Announcements', path: '/announcements', icon: Megaphone },
    { name: 'Study Materials', path: '/notes', icon: BookOpen },
    { name: 'Events', path: '/events', icon: Users },
    { name: 'Marketplace', path: '/marketplace', icon: ShoppingBag },
    { name: 'Placement Hub', path: '/placements', icon: Briefcase },
    { name: 'Campus AI', path: '/ai-assistant', icon: Bot },
    { name: 'Lost & Found', path: '/lost-found', icon: MapPin },
  ];

  const adminLinks = [
    { name: 'Manage Users', path: '/admin/users', icon: Users },
    { name: 'Settings', path: '/settings', icon: Settings, disabled: true },
  ];

  const handleLinkClick = () => {
    if (window.innerWidth < 768) setIsOpen(false);
  };

  const avatarBg = getAvatarColor(user?.name || 'User');
  const initials = getInitials(user?.name || 'U');

  return (
    <>
      {/* ── Sidebar panel ─────────────────────────────── */}
      <aside
        className={`
          fixed top-0 bottom-0 left-0 z-40 flex flex-col
          bg-white dark:bg-dark-card border-r border-light-border dark:border-dark-border/40
          transition-all duration-300 ease-in-out
          ${collapsed ? 'w-[70px]' : 'w-64'}
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0
        `}
      >
        {/* Brand Header */}
        <div className={`h-16 border-b border-light-border dark:border-dark-border/40 flex items-center ${collapsed ? 'justify-center px-2' : 'px-5 gap-2.5'}`}>
          <img
            src="/college-logo.png"
            alt="FXEC Logo"
            className="w-9 h-9 object-contain flex-shrink-0"
          />
          {!collapsed && (
            <div className="min-w-0">
              <span className="font-sans font-extrabold text-base tracking-tight text-light-text dark:text-dark-text whitespace-nowrap block leading-none">
                Campus<span className="text-brand-500">Hub</span>
              </span>
              <span className="text-[10px] font-semibold text-light-muted dark:text-dark-muted tracking-wide block mt-0.5 truncate">
                FXEC Campus Portal
              </span>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className={`flex-grow py-5 overflow-y-auto overflow-x-hidden space-y-6 ${collapsed ? 'px-2' : 'px-3'}`}>
          {/* Section label */}
          {!collapsed && (
            <span className="px-3 text-[10px] font-bold text-light-muted dark:text-dark-muted uppercase tracking-widest block">
              Core Utilities
            </span>
          )}

          <nav className="space-y-1">
            {baseLinks.map((link) => (
              <NavLink
                key={link.name}
                to={link.path}
                onClick={handleLinkClick}
                title={collapsed ? link.name : undefined}
                className={({ isActive }) =>
                  `group relative flex items-center rounded-xl text-sm font-semibold transition-all
                   ${collapsed ? 'justify-center w-full px-0 py-3' : 'gap-3 px-3 py-2.5'}
                   ${isActive
                     ? 'bg-brand-500 text-white shadow-md shadow-brand-500/20'
                     : 'text-light-muted dark:text-dark-muted hover:bg-light-bg dark:hover:bg-dark-bg/60 hover:text-light-text dark:hover:text-dark-text'
                   }`
                }
              >
                <link.icon className="w-5 h-5 flex-shrink-0" />
                {!collapsed && <span>{link.name}</span>}

                {/* Tooltip on hover when collapsed */}
                {collapsed && (
                  <span className="pointer-events-none absolute left-full ml-3 px-2.5 py-1.5 rounded-lg bg-dark-card dark:bg-white text-white dark:text-dark-card text-xs font-semibold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-50 shadow-lg">
                    {link.name}
                  </span>
                )}
              </NavLink>
            ))}
          </nav>

          {/* Admin section */}
          {user?.role === 'admin' && (
            <div>
              {!collapsed && (
                <span className="px-3 text-[10px] font-bold text-light-muted dark:text-dark-muted uppercase tracking-widest block mb-2">
                  Administration
                </span>
              )}
              <nav className="space-y-1">
                {adminLinks.map((link) => (
                  link.disabled ? (
                    <div
                      key={link.name}
                      title={collapsed ? link.name : undefined}
                      className={`flex items-center rounded-xl text-sm font-semibold text-light-muted/40 dark:text-dark-muted/40 cursor-not-allowed
                        ${collapsed ? 'justify-center py-3' : 'gap-3 px-3 py-2.5'}`}
                    >
                      <link.icon className="w-5 h-5 flex-shrink-0" />
                      {!collapsed && <span>{link.name}</span>}
                    </div>
                  ) : (
                    <NavLink
                      key={link.name}
                      to={link.path}
                      onClick={handleLinkClick}
                      title={collapsed ? link.name : undefined}
                      className={({ isActive }) =>
                        `group relative flex items-center rounded-xl text-sm font-semibold transition-all
                         ${collapsed ? 'justify-center w-full px-0 py-3' : 'gap-3 px-3 py-2.5'}
                         ${isActive
                           ? 'bg-brand-500 text-white shadow-md shadow-brand-500/20'
                           : 'text-light-muted dark:text-dark-muted hover:bg-light-bg dark:hover:bg-dark-bg/60 hover:text-light-text dark:hover:text-dark-text'
                         }`
                      }
                    >
                      <link.icon className="w-5 h-5 flex-shrink-0" />
                      {!collapsed && <span>{link.name}</span>}
                      {collapsed && (
                        <span className="pointer-events-none absolute left-full ml-3 px-2.5 py-1.5 rounded-lg bg-dark-card dark:bg-white text-white dark:text-dark-card text-xs font-semibold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-50 shadow-lg">
                          {link.name}
                        </span>
                      )}
                    </NavLink>
                  )
                ))}
              </nav>
            </div>
          )}
        </div>

        {/* Footer — user info only (no buttons) */}
        <div className={`border-t border-light-border dark:border-dark-border/40 bg-light-bg/30 dark:bg-dark-bg/10 ${collapsed ? 'p-2' : 'p-4'}`}>
          {collapsed ? (
            /* Collapsed: just avatar centered */
            <button
              onClick={() => { navigate('/profile'); setIsOpen(false); }}
              title={user?.name}
              className="w-full flex justify-center"
            >
              {hasAvatar(user?.avatar) ? (
                <img src={user!.avatar!} alt="Profile" className="w-9 h-9 rounded-xl object-cover border border-light-border dark:border-dark-border" />
              ) : (
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-extrabold ${avatarBg}`}>
                  {initials}
                </div>
              )}
            </button>
          ) : (
            /* Expanded: full user card */
            <div
              onClick={() => { navigate('/profile'); setIsOpen(false); }}
              className="flex items-center gap-3 cursor-pointer group rounded-xl p-1 hover:bg-light-border/30 dark:hover:bg-dark-border/20 transition-colors"
            >
              {hasAvatar(user?.avatar) ? (
                <img src={user!.avatar!} alt="Profile" className="w-9 h-9 rounded-xl object-cover border border-light-border dark:border-dark-border flex-shrink-0" />
              ) : (
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-extrabold flex-shrink-0 ${avatarBg}`}>
                  {initials}
                </div>
              )}
              <div className="min-w-0 flex-grow">
                <p className="text-sm font-bold text-light-text dark:text-dark-text truncate leading-none">{user?.name}</p>
                <p className="text-xs text-light-muted dark:text-dark-muted truncate mt-0.5">{user?.email}</p>
              </div>
              <LogOut
                onClick={(e) => { e.stopPropagation(); logout(); }}
                className="w-4 h-4 text-light-muted dark:text-dark-muted opacity-0 group-hover:opacity-100 hover:text-red-500 transition-all flex-shrink-0"
              />
            </div>
          )}
        </div>

        {/* ── Desktop collapse toggle button ── */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden md:flex absolute -right-3.5 top-[72px] w-7 h-7 bg-white dark:bg-dark-card border border-light-border dark:border-dark-border/50 rounded-full items-center justify-center shadow-md text-light-muted dark:text-dark-muted hover:text-brand-500 hover:border-brand-500/40 transition-all z-50"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed
            ? <ChevronRight className="w-3.5 h-3.5" />
            : <ChevronLeft className="w-3.5 h-3.5" />
          }
        </button>
      </aside>
    </>
  );
};
export default Sidebar;
