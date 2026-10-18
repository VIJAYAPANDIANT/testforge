import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ className = '', showLabel = false }) => {
  const { theme, toggleTheme, isDark } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`inline-flex items-center justify-center p-2 rounded-lg text-xs font-medium transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 select-none ${
        isDark
          ? 'text-amber-400 hover:text-amber-300 hover:bg-slate-800/80 border border-slate-800'
          : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 shadow-sm'
      } ${className}`}
      aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
    >
      <div className="flex items-center space-x-2">
        {isDark ? (
          <Sun className="w-4 h-4 text-amber-400 transition-transform duration-300 rotate-0 hover:rotate-45 shrink-0" />
        ) : (
          <Moon className="w-4 h-4 text-blue-600 transition-transform duration-300 -rotate-12 hover:rotate-0 shrink-0" />
        )}
        {showLabel && (
          <span className="font-semibold text-xs whitespace-nowrap">
            {isDark ? 'Light Mode' : 'Dark Mode'}
          </span>
        )}
      </div>
    </button>
  );
};
