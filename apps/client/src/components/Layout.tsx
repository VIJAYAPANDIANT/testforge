import React from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { PlaySquare, LayoutDashboard, FolderGit2, LogOut, User as UserIcon } from 'lucide-react';

export const Layout: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-[#0b0f19] text-slate-100">
      {/* Top Navbar */}
      <header className="bg-[#111827] border-b border-slate-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left Brand & Nav Links */}
            <div className="flex items-center space-x-8">
              <Link to="/dashboard" className="flex items-center space-x-3 text-blue-500 font-bold text-xl tracking-tight">
                <div className="bg-blue-600/20 p-2 rounded-lg border border-blue-500/30">
                  <PlaySquare className="w-5 h-5 text-blue-400" />
                </div>
                <span>TestForge</span>
              </Link>

              <nav className="hidden md:flex space-x-1">
                <NavLink
                  to="/dashboard"
                  className={({ isActive }) =>
                    `flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive ? 'bg-slate-800 text-blue-400' : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                    }`
                  }
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Dashboard</span>
                </NavLink>

                <NavLink
                  to="/projects"
                  className={({ isActive }) =>
                    `flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive ? 'bg-slate-800 text-blue-400' : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                    }`
                  }
                >
                  <FolderGit2 className="w-4 h-4" />
                  <span>Projects</span>
                </NavLink>
              </nav>
            </div>

            {/* Right User & Logout */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-full text-xs text-slate-300">
                <UserIcon className="w-3.5 h-3.5 text-blue-400" />
                <span className="font-medium text-slate-200">{user?.name || user?.email}</span>
              </div>

              <button
                onClick={logout}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-slate-400 hover:text-red-400 hover:bg-slate-800/60 transition-colors"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content View */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-[#0b0f19] py-4 text-center text-xs text-slate-500">
        TestForge Platform &copy; {new Date().getFullYear()} — No-Code Browser Test Automation
      </footer>
    </div>
  );
};
