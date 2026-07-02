import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { Menu, Sun, Moon, Bell, ChevronDown, Check, Trash2, ShoppingBag, Briefcase, Megaphone, User, LogOut } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { clientSocket } from '../services/socket';

interface NavbarProps {
  onMenuToggle: () => void;
}

interface NotificationItem {
  id: string;
  text: string;
  timestamp: string;
  unread: boolean;
  type: 'announcement' | 'marketplace' | 'placement' | 'general';
}

export const Navbar: React.FC<NavbarProps> = ({ onMenuToggle }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Theme States
  const [theme, setTheme] = useState<'light' | 'dark'>(
    (localStorage.getItem('theme') as 'light' | 'dark') || 'dark'
  );

  // Notification States
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  // Synchronize document theme class
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Load notifications from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem('notifications');
    if (saved) {
      setNotifications(JSON.parse(saved));
    } else {
      // Default welcoming alert
      const defaults: NotificationItem[] = [
        {
          id: 'welcome',
          text: `Welcome to CampusHub, ${user?.name || 'User'}! Live notices and chat systems are now active.`,
          timestamp: new Date().toISOString(),
          unread: true,
          type: 'general',
        },
      ];
      setNotifications(defaults);
      localStorage.setItem('notifications', JSON.stringify(defaults));
    }
  }, [user]);

  // Listen to Socket.io events
  useEffect(() => {
    let activeSocket: any = null;

    const handleNewAnnouncement = (data: any) => {
      const newNotif: NotificationItem = {
        id: Math.random().toString(),
        text: `📢 Announcement: "${data.title}" posted under ${data.departmentCode || 'Global'}`,
        timestamp: new Date().toISOString(),
        unread: true,
        type: 'announcement',
      };
      setNotifications((prev) => {
        const updated = [newNotif, ...prev];
        localStorage.setItem('notifications', JSON.stringify(updated));
        return updated;
      });
    };

    const handleMarketplaceUpdate = (data: any) => {
      const newNotif: NotificationItem = {
        id: Math.random().toString(),
        text: `🛍️ Marketplace: "${data.title}" listing has been marked as ${data.status}!`,
        timestamp: new Date().toISOString(),
        unread: true,
        type: 'marketplace',
      };
      setNotifications((prev) => {
        const updated = [newNotif, ...prev];
        localStorage.setItem('notifications', JSON.stringify(updated));
        return updated;
      });
    };

    const handlePlacementJob = (data: any) => {
      const newNotif: NotificationItem = {
        id: Math.random().toString(),
        text: `💼 Placements: ${data.company} posted a new opening: ${data.title}!`,
        timestamp: new Date().toISOString(),
        unread: true,
        type: 'placement',
      };
      setNotifications((prev) => {
        const updated = [newNotif, ...prev];
        localStorage.setItem('notifications', JSON.stringify(updated));
        return updated;
      });
    };

    const bindListeners = () => {
      const socket = clientSocket.getSocket();
      if (socket) {
        activeSocket = socket;
        socket.on('new-announcement', handleNewAnnouncement);
        socket.on('marketplace-status-updated', handleMarketplaceUpdate);
        socket.on('new-placement-job', handlePlacementJob);
        clearInterval(checkInterval);
      }
    };

    const checkInterval = setInterval(bindListeners, 1000);
    bindListeners(); // run immediately

    return () => {
      clearInterval(checkInterval);
      if (activeSocket) {
        activeSocket.off('new-announcement', handleNewAnnouncement);
        activeSocket.off('marketplace-status-updated', handleMarketplaceUpdate);
        activeSocket.off('new-placement-job', handlePlacementJob);
      }
    };
  }, [user]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  const getInitials = (name: string): string => {
    return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
  };

  // True only when user has a real (non-dummy) avatar uploaded
  const hasAvatar = (avatar?: string | null): boolean => {
    if (!avatar) return false;
    if (avatar.includes('res.cloudinary.com/dummy')) return false;
    if (avatar.includes('ui-avatars.com')) return false;
    return true;
  };

  const getPageTitle = () => {
    const path = location.pathname;
    if (path.includes('/dashboard')) return 'Dashboard';
    if (path.includes('/announcements')) return 'Campus Announcements';
    if (path.includes('/notes')) return 'Study Materials';
    if (path.includes('/lost-found')) return 'Lost & Found';
    if (path.includes('/attendance')) return 'Attendance';
    if (path.includes('/events')) return 'Events';
    if (path.includes('/marketplace')) return 'Marketplace';
    if (path.includes('/placements')) return 'Placements';
    if (path.includes('/ai-assistant')) return 'Campus AI';
    if (path.includes('/profile')) return 'My Profile';
    return 'CampusHub';
  };

  // Notification Actions
  const unreadCount = notifications.filter((n) => n.unread).length;

  const markAllAsRead = () => {
    const updated = notifications.map((n) => ({ ...n, unread: false }));
    setNotifications(updated);
    localStorage.setItem('notifications', JSON.stringify(updated));
  };

  const deleteNotification = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = notifications.filter((n) => n.id !== id);
    setNotifications(updated);
    localStorage.setItem('notifications', JSON.stringify(updated));
  };

  const getNotifIcon = (type: string) => {
    switch (type) {
      case 'announcement':
        return <Megaphone className="w-3.5 h-3.5 text-brand-500" />;
      case 'marketplace':
        return <ShoppingBag className="w-3.5 h-3.5 text-amber-500" />;
      case 'placement':
        return <Briefcase className="w-3.5 h-3.5 text-green-500" />;
      default:
        return <Bell className="w-3.5 h-3.5 text-blue-500" />;
    }
  };

  return (
    <header className="h-16 sticky top-0 z-30 bg-white/80 dark:bg-dark-bg/85 backdrop-blur-md border-b border-light-border dark:border-dark-border/40 px-6 flex items-center justify-between transition-colors duration-300">
      {/* Mobile Menu & Page Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="p-2 md:hidden hover:bg-light-bg dark:hover:bg-dark-card rounded-xl text-light-muted dark:text-dark-muted hover:text-light-text dark:hover:text-dark-text transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
        <h1 className="font-sans font-bold text-xl text-light-text dark:text-dark-text">
          {getPageTitle()}
        </h1>
      </div>

      {/* Action Badges */}
      <div className="flex items-center gap-4 relative">
        {/* Dark/Light mode toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 bg-light-bg dark:bg-dark-card hover:bg-light-border dark:hover:bg-dark-border/50 text-light-muted dark:text-dark-muted rounded-xl transition-all border border-light-border dark:border-dark-border/30"
          aria-label="Toggle Theme"
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-500 animate-fade-in" />
          ) : (
            <Moon className="w-4 h-4 text-violet-500 animate-fade-in" />
          )}
        </button>

        {/* Notifications Bell Button */}
        <button
          onClick={() => setDropdownOpen((prev) => !prev)}
          className="p-2.5 bg-light-bg dark:bg-dark-card hover:bg-light-border dark:hover:bg-dark-border/50 text-light-muted dark:text-dark-muted rounded-xl border border-light-border dark:border-dark-border/30 relative transition-all"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white font-extrabold text-[10px] min-w-[18px] h-[18px] rounded-full flex items-center justify-center border-2 border-white dark:border-dark-card shadow-sm animate-pulse px-1">
              {unreadCount}
            </span>
          )}
        </button>

        {/* Dropdown notifications box */}
        {dropdownOpen && (
          <div className="absolute right-0 top-12 w-80 bg-white dark:bg-dark-card border border-light-border dark:border-dark-border/40 rounded-2xl shadow-2xl overflow-hidden py-2 z-50 animate-scale-in">
            <div className="px-4 py-2 border-b border-light-border dark:border-dark-border/20 flex items-center justify-between text-xs">
              <span className="font-extrabold text-light-text dark:text-dark-text">Campus Notifications</span>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-[10px] font-bold text-brand-500 hover:underline flex items-center gap-1"
                >
                  <Check className="w-3.5 h-3.5" />
                  Mark all read
                </button>
              )}
            </div>

            <div className="max-h-72 overflow-y-auto divide-y divide-light-border/40 dark:divide-dark-border/10">
              {notifications.length === 0 ? (
                <div className="p-6 text-center text-light-muted dark:text-dark-muted text-sm">
                  No notifications recorded
                </div>
              ) : (
                notifications.map((notif) => (
                  <div
                    key={notif.id}
                    onClick={() => {
                      const updated = notifications.map((n) => (n.id === notif.id ? { ...n, unread: false } : n));
                      setNotifications(updated);
                      localStorage.setItem('notifications', JSON.stringify(updated));
                    }}
                    className={`p-3 flex items-start gap-3 hover:bg-light-bg/50 dark:hover:bg-dark-bg/40 cursor-pointer transition-colors ${
                      notif.unread ? 'bg-brand-500/5 font-semibold' : ''
                    }`}
                  >
                    <div className="w-7 h-7 rounded-lg bg-light-bg dark:bg-dark-bg border border-light-border/40 dark:border-dark-border/30 flex items-center justify-center flex-shrink-0">
                      {getNotifIcon(notif.type)}
                    </div>
                    <div className="flex-grow min-w-0">
                      <p className="text-sm text-light-text dark:text-dark-text leading-snug break-words">
                        {notif.text}
                      </p>
                      <span className="text-xs text-light-muted dark:text-dark-muted block mt-1">
                        {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <button
                      onClick={(e) => deleteNotification(notif.id, e)}
                      className="p-1 hover:bg-red-500/10 text-light-muted dark:text-dark-muted hover:text-red-500 rounded transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* User Profile Dropdown */}
        <div className="h-8 w-[1px] bg-light-border dark:bg-dark-border/40 hidden sm:block"></div>

        <div className="relative hidden sm:block" ref={profileRef}>
          <button
            onClick={() => setProfileOpen((p) => !p)}
            className="flex items-center gap-2 cursor-pointer p-1 rounded-xl hover:bg-light-bg dark:hover:bg-dark-card transition-all"
          >
            {/* Avatar: show real photo if available, otherwise initials */}
            {hasAvatar(user?.avatar) ? (
              <img
                src={user!.avatar}
                alt="Profile"
                className="w-8 h-8 rounded-lg object-cover border border-light-border dark:border-dark-border/30"
              />
            ) : (
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-extrabold ${getAvatarColor(user?.name || 'User')}`}
              >
                {getInitials(user?.name || 'U')}
              </div>
            )}
            <span className="text-sm font-bold text-light-text dark:text-dark-text">
              {user?.name?.split(' ')[0]}
            </span>
            <ChevronDown className={`w-3.5 h-3.5 text-light-muted dark:text-dark-muted transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Profile Dropdown Menu */}
          {profileOpen && (
            <div className="absolute right-0 top-12 w-48 bg-white dark:bg-dark-card border border-light-border dark:border-dark-border/40 rounded-2xl shadow-2xl overflow-hidden py-1.5 z-50">
              <div className="px-4 py-2 border-b border-light-border dark:border-dark-border/20">
                <p className="text-sm font-bold text-light-text dark:text-dark-text truncate">{user?.name}</p>
                <p className="text-xs text-light-muted dark:text-dark-muted truncate capitalize">{user?.role}</p>
              </div>
              <button
                onClick={() => { navigate('/profile'); setProfileOpen(false); }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-light-text dark:text-dark-text hover:bg-brand-500/5 hover:text-brand-500 transition-colors"
              >
                <User className="w-4 h-4" />
                My Profile
              </button>
              <button
                onClick={() => logout()}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-red-500 hover:bg-red-500/5 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
export default Navbar;
