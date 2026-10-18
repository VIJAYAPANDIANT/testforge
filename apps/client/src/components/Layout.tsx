import React, { useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ThemeToggle } from './ThemeToggle';
import { PlaySquare, LayoutDashboard, FolderGit2, LogOut, User as UserIcon, Menu, X, Home } from 'lucide-react';

export const Layout: React.FC = () => {
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#0b0f19] text-slate-900 dark:text-slate-100 font-sans antialiased">
      {/* Top Navbar */}
      <header className="bg-white/95 dark:bg-[#111827]/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left Brand & Nav Links */}
            <div className="flex items-center space-x-8">
              <Link to="/" className="flex items-center space-x-3 text-blue-400 font-bold text-xl tracking-tight group" title="TestForge Home">
                <img src="/logo.jpg" alt="TestForge Logo" className="w-8 h-8 rounded-lg border border-blue-500/30 object-cover shadow-sm group-hover:border-blue-500/60 transition-colors" />
                <span className="text-slate-100 font-extrabold group-hover:text-blue-400 transition-colors">TestForge</span>
              </Link>

              <nav className="hidden md:flex items-center space-x-1">
                <NavLink
                  to="/"
                  end
                  className={({ isActive }) =>
                    `flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30 shadow-sm'
                        : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                    }`
                  }
                >
                  <Home className="w-4 h-4" />
                  <span>Home</span>
                </NavLink>

                <NavLink
                  to="/dashboard"
                  className={({ isActive }) =>
                    `flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30 shadow-sm'
                        : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                    }`
                  }
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Dashboard</span>
                </NavLink>

                <NavLink
                  to="/projects"
                  className={({ isActive }) =>
                    `flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30 shadow-sm'
                        : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                    }`
                  }
                >
                  <FolderGit2 className="w-4 h-4" />
                  <span>Projects</span>
                </NavLink>
              </nav>
            </div>

            {/* Right Theme Toggle, User & Logout */}
            <div className="hidden md:flex items-center space-x-3">
              <ThemeToggle />

              <div className="flex items-center space-x-2 px-3 py-1.5 bg-slate-900/90 border border-slate-800 rounded-full text-xs text-slate-300 shadow-inner">
                <div className="w-5 h-5 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                  <UserIcon className="w-3 h-3" />
                </div>
                <span className="font-semibold text-slate-200">{user?.name || user?.email}</span>
              </div>

              <button
                onClick={logout}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/30 border border-transparent transition-all"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>

            {/* Mobile menu button and theme toggle */}
            <div className="flex md:hidden items-center space-x-2">
              <ThemeToggle />
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                aria-label="Toggle navigation menu"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-slate-800 bg-[#111827] px-4 pt-2 pb-4 space-y-3">
            <div className="flex items-center justify-between gap-2 px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-300">
              <div className="flex items-center space-x-2 truncate">
                <UserIcon className="w-4 h-4 text-blue-400 shrink-0" />
                <span className="font-semibold text-slate-200 truncate">{user?.name || user?.email}</span>
              </div>
              <ThemeToggle showLabel className="shrink-0" />
            </div>

            <nav className="space-y-1">
              <NavLink
                to="/"
                end
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center space-x-2.5 px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-colors ${
                    isActive ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30' : 'text-slate-300 hover:bg-slate-800'
                  }`
                }
              >
                <Home className="w-4 h-4" />
                <span>Home</span>
              </NavLink>

              <NavLink
                to="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center space-x-2.5 px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-colors ${
                    isActive ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30' : 'text-slate-300 hover:bg-slate-800'
                  }`
                }
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Dashboard</span>
              </NavLink>

              <NavLink
                to="/projects"
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center space-x-2.5 px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-colors ${
                    isActive ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30' : 'text-slate-300 hover:bg-slate-800'
                  }`
                }
              >
                <FolderGit2 className="w-4 h-4" />
                <span>Projects</span>
              </NavLink>
            </nav>

            <button
              onClick={() => {
                setMobileMenuOpen(false);
                logout();
              }}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold rounded-lg hover:bg-red-500/20 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        )}
      </header>

      {/* Main Content View */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-900 bg-slate-50 dark:bg-[#0b0f19] py-5 text-center text-xs text-slate-500">
        TestForge Platform &copy; {new Date().getFullYear()} — No-Code Browser Test Automation Platform
      </footer>
    </div>
  );
};
