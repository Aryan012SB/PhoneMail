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
    <header className={`px-2 sm:px-4 py-2 flex items-center justify-between gap-1.5 sm:gap-3 sticky top-0 z-30 shadow-md transition-colors border-b w-full max-w-full overflow-hidden box-border ${
      themeMode === 'dark' 
        ? 'bg-slate-900 border-slate-800 text-slate-100' 
        : 'bg-white border-slate-200 text-slate-900 shadow-slate-200/50'
    }`}>
      {/* Brand & View Mode Switcher */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        <div className="flex items-center gap-1.5">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-sky-400 text-white font-black flex items-center justify-center text-xs shadow-md shadow-blue-500/20 shrink-0">
            P
          </div>
          <span className="font-extrabold text-sm tracking-tight bg-gradient-to-r from-blue-500 to-sky-400 bg-clip-text text-transparent hidden md:inline">
            PhoneMail
          </span>
        </div>

        {/* Responsive View Mode Selector */}
        <div className={`flex items-center p-0.5 sm:p-1 rounded-xl border text-[11px] sm:text-xs shrink-0 ${
          themeMode === 'dark' ? 'bg-slate-800 border-slate-700/60' : 'bg-slate-100 border-slate-200'
        }`}>
          <button
            onClick={() => setViewMode('desktop')}
            className={`px-1.5 sm:px-2.5 py-1 rounded-lg font-medium flex items-center gap-1 transition-all ${
              viewMode === 'desktop'
                ? 'bg-blue-600 text-white font-bold shadow'
                : themeMode === 'dark' ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
            }`}
            title="Desktop Site View Mode"
          >
            <Monitor className="w-3.5 h-3.5" />
            <span className="hidden xs:inline sm:inline">Desktop</span>
          </button>
          <button
            onClick={() => setViewMode('mobile')}
            className={`px-1.5 sm:px-2.5 py-1 rounded-lg font-medium flex items-center gap-1 transition-all ${
              viewMode === 'mobile'
                ? 'bg-blue-600 text-white font-bold shadow'
                : themeMode === 'dark' ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
            }`}
            title="WhatsApp Mobile View Mode"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span className="hidden xs:inline sm:inline">Mobile</span>
          </button>
          <button
            onClick={() => setViewMode('auto')}
            className={`px-1.5 sm:px-2 py-1 rounded-lg font-medium transition-all ${
              viewMode === 'auto'
                ? 'bg-blue-600 text-white font-bold shadow'
                : themeMode === 'dark' ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
            }`}
            title="Auto Layout Mode"
          >
            Auto
          </button>
        </div>
      </div>

      {/* Global Search Bar */}
      <div className="flex-1 min-w-0 max-w-xl mx-1 relative">
        <div className="relative w-full min-w-0">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full border rounded-xl pl-8 pr-3 py-1 text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 min-w-0 truncate ${
              themeMode === 'dark'
                ? 'bg-slate-800 border-slate-700/80 text-slate-200 placeholder-slate-400'
                : 'bg-slate-100 border-slate-200 text-slate-900 placeholder-slate-500'
            }`}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-200 font-bold"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Action Controls */}
      <div className="flex items-center gap-1 sm:gap-2 shrink-0">
        {/* Dark / Light Mode Toggle Button */}
        <button
          onClick={toggleTheme}
          className={`p-1.5 sm:p-2 rounded-xl border transition-all ${
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
          className={`p-1.5 sm:p-2 rounded-xl border transition-all hidden xs:flex ${
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
          className="py-1.5 px-3 bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-500 hover:to-sky-400 text-white font-bold rounded-xl text-xs shadow-md shadow-blue-500/20 hidden md:flex items-center gap-1.5 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Compose</span>
        </button>

        {/* User Account / Settings Pill */}
        <div className={`flex items-center gap-1.5 sm:gap-2 border-l pl-1.5 sm:pl-3 ${
          themeMode === 'dark' ? 'border-slate-800' : 'border-slate-200'
        }`}>
          <button
            onClick={onOpenSettings}
            className={`flex items-center gap-2 p-1 rounded-xl transition-all ${
              themeMode === 'dark' ? 'hover:bg-slate-800' : 'hover:bg-slate-100'
            }`}
            title="Open Account Settings"
          >
            <div className="w-7 h-7 rounded-full bg-blue-600/30 border border-blue-400/50 flex items-center justify-center text-blue-400 font-bold text-xs shrink-0">
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
            className={`p-1.5 sm:py-1.5 sm:px-2.5 rounded-xl border transition-all flex items-center gap-1.5 font-bold text-xs ${
              themeMode === 'dark'
                ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border-rose-500/30'
                : 'bg-rose-50 hover:bg-rose-100 text-rose-600 border-rose-200'
            }`}
            title="Sign Out / Logout of PhoneMail"
          >
            <LogOut className="w-4 h-4 text-rose-500 shrink-0" />
            <span className="hidden md:inline">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
};
