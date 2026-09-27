import React, { useState, useEffect } from 'react';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { EmailProvider, useEmail } from './context/EmailContext';
import { OnboardingScreens } from './components/auth/OnboardingScreens';
import { Header } from './components/common/Header';
import { MobileLayout } from './components/mobile/MobileLayout';
import { DesktopLayout } from './components/desktop/DesktopLayout';
import { ComposeModal } from './components/common/ComposeModal';
import { SettingsModal } from './components/settings/SettingsModal';

const MainAppContent: React.FC = () => {
  const { user, loading } = useAuth();
  const { viewMode } = useEmail();
  const { themeMode } = useTheme();

  const [isMobileScreen, setIsMobileScreen] = useState<boolean>(window.innerWidth < 768);
  const [settingsOpen, setSettingsOpen] = useState<boolean>(false);

  useEffect(() => {
    const handleResize = () => setIsMobileScreen(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${themeMode === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-sky-400 text-white font-black flex items-center justify-center text-xl mx-auto shadow-lg shadow-blue-500/30 animate-pulse">
            P
          </div>
          <p className="text-xs text-blue-500 font-semibold tracking-wider">Loading PhoneMail...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <OnboardingScreens />;
  }

  const showMobileView = viewMode === 'mobile' || (viewMode === 'auto' && isMobileScreen);

  return (
    <div className={`min-h-screen flex flex-col font-sans ${themeMode === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      <Header onOpenSettings={() => setSettingsOpen(true)} />

      <main className="flex-1 overflow-hidden">
        {showMobileView ? (
          <MobileLayout onOpenSettings={() => setSettingsOpen(true)} />
        ) : (
          <DesktopLayout onOpenSettings={() => setSettingsOpen(true)} />
        )}
      </main>

      <ComposeModal />
      <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <EmailProvider>
          <MainAppContent />
        </EmailProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
