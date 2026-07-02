import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { clientSocket } from '../services/socket';

export const DashboardLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  // Persist collapsed state in localStorage so it survives page refresh
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('sidebarCollapsed') === 'true';
  });

  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      const deptId =
        typeof user.department === 'object' && user.department
          ? user.department._id
          : user.department;
      clientSocket.connect(user._id, deptId, user.semester);
    }
    return () => {
      clientSocket.disconnect();
    };
  }, [user]);

  const handleSetCollapsed = (c: boolean) => {
    setSidebarCollapsed(c);
    localStorage.setItem('sidebarCollapsed', String(c));
  };

  const toggleSidebar = () => setSidebarOpen((prev) => !prev);

  return (
    <div className="min-h-screen bg-light-bg dark:bg-dark-bg text-light-text dark:text-dark-text transition-colors duration-300 font-sans">
      {/* Sidebar Panel */}
      <Sidebar
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
        collapsed={sidebarCollapsed}
        setCollapsed={handleSetCollapsed}
      />

      {/* Mobile Sidebar Overlay Backdrop */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm md:hidden"
        />
      )}

      {/* Main Content — shifts based on sidebar width */}
      <div
        className={`flex flex-col min-h-screen transition-all duration-300 ease-in-out ${
          sidebarCollapsed ? 'md:pl-[70px]' : 'md:pl-64'
        }`}
      >
        {/* Top Navbar */}
        <Navbar onMenuToggle={toggleSidebar} />

        {/* Scrollable Sub-Page Render Frame */}
        <main className="flex-grow p-6 md:p-8 max-w-7xl w-full mx-auto animate-fade-in">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
export default DashboardLayout;
