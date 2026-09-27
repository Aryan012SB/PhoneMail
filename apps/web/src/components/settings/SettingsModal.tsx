import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { api } from '../../services/api';
import { X, User, Shield, Tag, Bell, Key, Plus, Trash2, CheckCircle2, RefreshCw, Sun, Moon, Palette } from 'lucide-react';
import { Alias } from '../../types';

export const SettingsModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { user, refreshUser } = useAuth();
  const { themeMode, setThemeMode, toggleTheme } = useTheme();

  const [activeTab, setActiveTab] = useState<'profile' | 'aliases' | 'theme' | 'notifications' | 'security'>('profile');
  const [nameInput, setNameInput] = useState<string>(user?.name || '');
  const [languageInput, setLanguageInput] = useState<string>(user?.language || 'en');
  const [newPassword, setNewPassword] = useState<string>('');
  
  const [aliases, setAliases] = useState<Alias[]>([]);
  const [newAliasInput, setNewAliasInput] = useState<string>('');
  
  const [loading, setLoading] = useState<boolean>(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setNameInput(user.name);
      setLanguageInput(user.language || 'en');
      loadAliases();
    }
  }, [user, isOpen]);

  const loadAliases = async () => {
    try {
      const data = await api.getAliases();
      setAliases(data);
    } catch (err) {
      console.error(err);
    }
  };

  if (!isOpen) return null;

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMsg(null);
    try {
      await api.updateProfile({
        name: nameInput,
        language: languageInput,
        newPassword: newPassword || undefined,
      });
      await refreshUser();
      setMsg('Profile updated successfully!');
      setNewPassword('');
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleAddAlias = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAliasInput.trim()) return;
    setLoading(true);
    setError(null);
    setMsg(null);
    try {
      await api.addAlias(newAliasInput);
      setNewAliasInput('');
      await loadAliases();
      await refreshUser();
      setMsg('New alias ID added!');
    } catch (err: any) {
      setError(err.message || 'Failed to add alias');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAlias = async (id: string) => {
    setLoading(true);
    try {
      await api.deleteAlias(id);
      await loadAliases();
      await refreshUser();
      setMsg('Alias removed.');
    } catch (err: any) {
      setError(err.message || 'Failed to delete alias');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className={`border w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col md:flex-row overflow-hidden max-h-[85vh] transition-colors ${
        themeMode === 'dark' ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        
        {/* Settings Navigation Sidebar */}
        <div className={`w-full md:w-56 border-b md:border-b-0 md:border-r p-3 space-y-1 ${
          themeMode === 'dark' ? 'bg-slate-800/80 border-slate-700' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="p-2 mb-2">
            <h3 className={`text-sm font-extrabold ${themeMode === 'dark' ? 'text-white' : 'text-slate-900'}`}>Settings</h3>
            <p className="text-[10px] text-blue-500 font-mono truncate">{user?.emailAddress}</p>
          </div>

          {[
            { id: 'profile', label: 'Account Profile', icon: User },
            { id: 'aliases', label: 'Alias IDs', icon: Tag },
            { id: 'theme', label: 'Theme & Appearance', icon: Palette },
            { id: 'notifications', label: 'SMS Preferences', icon: Bell },
            { id: 'security', label: 'Security & Auth', icon: Shield },
          ].map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                  active
                    ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-500/20'
                    : themeMode === 'dark' ? 'text-slate-300 hover:bg-slate-700/60' : 'text-slate-700 hover:bg-slate-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content Body */}
        <div className="flex-1 p-5 flex flex-col justify-between overflow-y-auto">
          <div>
            <div className={`flex items-center justify-between border-b pb-3 mb-4 ${
              themeMode === 'dark' ? 'border-slate-800' : 'border-slate-200'
            }`}>
              <h4 className={`text-sm font-bold capitalize ${themeMode === 'dark' ? 'text-white' : 'text-slate-900'}`}>{activeTab} Settings</h4>
              <button onClick={onClose} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="mb-4 p-2.5 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs rounded-xl">
                {error}
              </div>
            )}

            {msg && (
              <div className="mb-4 p-2.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs rounded-xl flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                {msg}
              </div>
            )}

            {/* 1. PROFILE TAB */}
            {activeTab === 'profile' && (
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Primary Email ID (Phone Based)</label>
                  <input
                    type="text"
                    disabled
                    value={user?.emailAddress || ''}
                    className={`w-full border rounded-xl px-3 py-2 text-xs font-mono text-blue-500 ${
                      themeMode === 'dark' ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Display Name</label>
                  <input
                    type="text"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    className={`w-full border rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500 ${
                      themeMode === 'dark' ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-100 border-slate-200 text-slate-900'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Interface Language</label>
                  <select
                    value={languageInput}
                    onChange={(e) => setLanguageInput(e.target.value)}
                    className={`w-full border rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500 ${
                      themeMode === 'dark' ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-100 border-slate-200 text-slate-900'
                    }`}
                  >
                    <option value="en">English</option>
                    <option value="es">Español</option>
                    <option value="fr">Français</option>
                    <option value="hi">Hindi (हिंदी)</option>
                    <option value="de">Deutsch</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Update Password (Optional)</label>
                  <input
                    type="password"
                    placeholder="New password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className={`w-full border rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500 ${
                      themeMode === 'dark' ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-100 border-slate-200 text-slate-900'
                    }`}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs shadow-md transition-all"
                >
                  Save Profile Changes
                </button>
              </form>
            )}

            {/* 2. ALIAS TAB */}
            {activeTab === 'aliases' && (
              <div className="space-y-4">
                <p className="text-xs text-slate-400">
                  Add secondary email aliases that redirect directly to your main PhoneMail mailbox.
                </p>

                <form onSubmit={handleAddAlias} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. alex.rivera@phonemail.com"
                    value={newAliasInput}
                    onChange={(e) => setNewAliasInput(e.target.value)}
                    className={`flex-1 border rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500 ${
                      themeMode === 'dark' ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-100 border-slate-200 text-slate-900'
                    }`}
                  />
                  <button
                    type="submit"
                    disabled={loading || !newAliasInput.trim()}
                    className="py-2 px-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs flex items-center gap-1 shadow-md"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Alias</span>
                  </button>
                </form>

                <div className="space-y-2">
                  <h5 className="text-xs font-bold text-slate-400">Your Active Aliases:</h5>
                  {aliases.length === 0 ? (
                    <p className="text-xs text-slate-500 italic">No custom aliases added yet.</p>
                  ) : (
                    aliases.map(al => (
                      <div key={al.id} className={`p-2.5 rounded-xl border flex items-center justify-between text-xs ${
                        themeMode === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-slate-100 border-slate-200'
                      }`}>
                        <span className="font-mono text-blue-500 font-semibold">{al.alias}</span>
                        <button
                          onClick={() => handleDeleteAlias(al.id)}
                          className="text-slate-400 hover:text-rose-400"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* 3. THEME & APPEARANCE TAB */}
            {activeTab === 'theme' && (
              <div className="space-y-4">
                <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-xl space-y-1">
                  <h5 className="text-xs font-bold text-blue-400">Primary Theme Color</h5>
                  <p className="text-[11px] text-slate-400">Theme updated from Green (Teal) to Modern Electric Blue & Sky Accent.</p>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-400">Select Mode:</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setThemeMode('dark')}
                      className={`p-4 rounded-2xl border text-left flex flex-col items-center gap-2 transition-all ${
                        themeMode === 'dark'
                          ? 'bg-slate-800 border-blue-500 ring-2 ring-blue-500/50 text-white'
                          : 'bg-slate-900/60 border-slate-700 text-slate-400 hover:bg-slate-800'
                      }`}
                    >
                      <Moon className="w-6 h-6 text-blue-400" />
                      <span className="font-bold text-xs">Dark Mode</span>
                      <span className="text-[10px] text-slate-400">Dark background with blue accents</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setThemeMode('light')}
                      className={`p-4 rounded-2xl border text-left flex flex-col items-center gap-2 transition-all ${
                        themeMode === 'light'
                          ? 'bg-blue-50 border-blue-600 ring-2 ring-blue-600/50 text-slate-900'
                          : 'bg-slate-100 border-slate-300 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      <Sun className="w-6 h-6 text-amber-500" />
                      <span className="font-bold text-xs">Light Mode</span>
                      <span className="text-[10px] text-slate-500">Clean light background with crisp text</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 4. SMS TAB */}
            {activeTab === 'notifications' && (
              <div className="space-y-4 text-xs text-slate-300">
                <div className={`p-3 rounded-xl border space-y-2 ${
                  themeMode === 'dark' ? 'bg-slate-800/80 border-slate-700' : 'bg-slate-100 border-slate-200 text-slate-800'
                }`}>
                  <p className="font-bold text-blue-500">SMS Mail Notification Engine</p>
                  <p>When you receive new emails from other PhoneMail users, an instant SMS alert is triggered to your phone number: <span className="font-mono text-blue-400 font-bold">{user?.phoneNumber}</span>.</p>
                  <p className="text-[11px] text-slate-400">Target SMS format: "You have received an email from &lt;Sender&gt;. Subject: &lt;Subject&gt;."</p>
                </div>
              </div>
            )}

            {/* 5. SECURITY TAB */}
            {activeTab === 'security' && (
              <div className="space-y-3 text-xs text-slate-300">
                <div className={`p-3 rounded-xl border space-y-1 ${
                  themeMode === 'dark' ? 'bg-slate-800/80 border-slate-700' : 'bg-slate-100 border-slate-200 text-slate-800'
                }`}>
                  <p className="font-bold text-blue-500">Authentication Method</p>
                  <p>Phone Number & OTP Authentication Active.</p>
                </div>
              </div>
            )}
          </div>

          <div className={`pt-4 border-t flex justify-end ${
            themeMode === 'dark' ? 'border-slate-800' : 'border-slate-200'
          }`}>
            <button
              onClick={onClose}
              className={`py-2 px-4 font-bold rounded-xl text-xs transition-all ${
                themeMode === 'dark' ? 'bg-slate-800 hover:bg-slate-700 text-slate-200' : 'bg-slate-200 hover:bg-slate-300 text-slate-800'
              }`}
            >
              Close
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
