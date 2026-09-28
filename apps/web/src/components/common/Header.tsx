import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useEmail } from '../../context/EmailContext';
import { useTheme } from '../../context/ThemeContext';
import { Smartphone, Monitor, Search, LogOut, User as UserIcon, Plus, RefreshCw, Sun, Moon } from 'lucide-react';

export const Header: React.FC<{ onOpenSettings: () => void }> = ({ onOpenSettings }) => {
  const { user, logout } = useAuth();
  const { viewMode, setViewMode, searchQuery, setSearchQuery, openCompose, refreshAll, loading } = useEmail();
  const { themeMode, toggleTheme } = useTheme();

  return (
    <header className={`px-4 py-2.5 flex items-center justify-between gap-4 sticky top-0 z-30 shadow-md transition-colors border-b ${
      themeMode === 'dark' 
        ? 'bg-slate-900 border-slate-800 text-slate-100' 
        : 'bg-white border-slate-200 text-slate-900 shadow-slate-200/50'
    }`}>
      {/* Brand & View Mode Switcher */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-sky-400 text-white font-black flex items-center justify-center text-sm shadow-md shadow-blue-500/20">
            P
          </div>
          <span className="font-extrabold text-base tracking-tight bg-gradient-to-r from-blue-500 to-sky-400 bg-clip-text text-transparent hidden sm:inline">
            PhoneMail
          </span>
        </div>

        {/* Responsive View Mode Selector for testing Mobile vs Desktop anywhere */}
        <div className={`flex items-center p-1 rounded-xl border text-xs ${
          themeMode === 'dark' ? 'bg-slate-800 border-slate-700/60' : 'bg-slate-100 border-slate-200'
        }`}>
          <button
            onClick={() => setViewMode('auto')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
              viewMode === 'auto'
                ? 'bg-blue-600 text-white font-bold shadow'
                : themeMode === 'dark' ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
            }`}
            title="Auto detect layout based on screen size"
          >
            Auto
          </button>
          <button
            onClick={() => setViewMode('mobile')}
            className={`px-2.5 py-1 rounded-lg font-medium flex items-center gap-1 transition-all ${
              viewMode === 'mobile'
                ? 'bg-blue-600 text-white font-bold shadow'
                : themeMode === 'dark' ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
            }`}
            title="Force WhatsApp-inspired Mobile View"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Mobile</span>
          </button>
          <button
            onClick={() => setViewMode('desktop')}
            className={`px-2.5 py-1 rounded-lg font-medium flex items-center gap-1 transition-all ${
              viewMode === 'desktop'
                ? 'bg-blue-600 text-white font-bold shadow'
                : themeMode === 'dark' ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
            }`}
            title="Force Gmail-inspired Desktop View"
          >
            <Monitor className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Desktop</span>
          </button>
        </div>
      </div>

      {/* Global Search Bar */}
      <div className="flex-1 max-w-xl mx-2 relative">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search email, phone, sender, subject..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full border rounded-xl pl-9 pr-4 py-1.5 text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 ${
              themeMode === 'dark'
                ? 'bg-slate-800 border-slate-700/80 text-slate-200 placeholder-slate-400'
                : 'bg-slate-100 border-slate-200 text-slate-900 placeholder-slate-500'
            }`}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-200 font-bold"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Action Controls */}
      <div className="flex items-center gap-2">
        {/* Dark / Light Mode Toggle Button */}
        <button
          onClick={toggleTheme}
          className={`p-2 rounded-xl border transition-all ${
            themeMode === 'dark'
              ? 'bg-slate-800 hover:bg-slate-700 text-amber-400 border-slate-700/60'
              : 'bg-slate-100 hover:bg-slate-200 text-indigo-600 border-slate-200'
          }`}
          title={themeMode === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {themeMode === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        <button
          onClick={() => refreshAll()}
          disabled={loading}
          className={`p-2 rounded-xl border transition-all ${
            themeMode === 'dark'
              ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700/60'
              : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
          }`}
          title="Refresh Mailbox"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-500' : ''}`} />
        </button>

        <button
          onClick={() => openCompose()}
          className="py-1.5 px-3 bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-500 hover:to-sky-400 text-white font-bold rounded-xl text-xs shadow-md shadow-blue-500/20 flex items-center gap-1.5 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Compose</span>
        </button>

        {/* User Account / Settings Pill */}
        <div className={`flex items-center gap-2 border-l pl-3 ${
          themeMode === 'dark' ? 'border-slate-800' : 'border-slate-200'
        }`}>
          <button
            onClick={onOpenSettings}
            className={`flex items-center gap-2 p-1 rounded-xl transition-all ${
              themeMode === 'dark' ? 'hover:bg-slate-800' : 'hover:bg-slate-100'
            }`}
          >
            <div className="w-7 h-7 rounded-full bg-blue-600/30 border border-blue-400/50 flex items-center justify-center text-blue-400 font-bold text-xs">
              {user?.name ? user.name[0].toUpperCase() : 'P'}
            </div>
            <div className="hidden lg:block text-xs leading-tight">
              <p className={`font-semibold truncate max-w-[120px] ${
                themeMode === 'dark' ? 'text-slate-200' : 'text-slate-800'
              }`}>{user?.name}</p>
              <p className="text-[10px] text-blue-500 font-mono truncate max-w-[120px]">{user?.emailAddress}</p>
            </div>
          </button>

          <button
            onClick={logout}
            className={`p-2 rounded-xl border transition-all ${
              themeMode === 'dark'
                ? 'bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border-slate-700/60'
                : 'bg-slate-100 hover:bg-rose-500/20 text-slate-600 hover:text-rose-500 border-slate-200'
            }`}
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
