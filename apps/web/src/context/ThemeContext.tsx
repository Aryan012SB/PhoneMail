import React, { createContext, useContext, useState, useEffect } from 'react';

type ThemeMode = 'dark' | 'light';

interface ThemeContextType {
  themeMode: ThemeMode;
  toggleTheme: () => void;
  setThemeMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themeMode, setThemeModeState] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('phonemail_theme_mode');
    return (saved === 'light' || saved === 'dark') ? saved : 'dark';
  });

  const setThemeMode = (mode: ThemeMode) => {
    setThemeModeState(mode);
    localStorage.setItem('phonemail_theme_mode', mode);
  };

  const toggleTheme = () => {
    setThemeMode(themeMode === 'dark' ? 'light' : 'dark');
  };

  useEffect(() => {
    const root = document.documentElement;
    if (themeMode === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
      document.body.style.backgroundColor = '#020617'; // slate-950
      document.body.style.color = '#f8fafc';
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
      document.body.style.backgroundColor = '#f8fafc'; // slate-50
      document.body.style.color = '#0f172a';
    }
  }, [themeMode]);

  return (
    <ThemeContext.Provider value={{ themeMode, toggleTheme, setThemeMode }}>
      <div className={themeMode === 'dark' ? 'dark text-slate-100 bg-slate-950 min-h-screen' : 'light text-slate-900 bg-slate-50 min-h-screen'}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
