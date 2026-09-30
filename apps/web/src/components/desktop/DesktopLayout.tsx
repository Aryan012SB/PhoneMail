import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useEmail } from '../../context/EmailContext';
import { useTheme } from '../../context/ThemeContext';
import { api } from '../../services/api';
import {
  Inbox, Send, FileText, AlertOctagon, Trash2, Star, Plus, Paperclip,
  Search, RefreshCw, Lock, ArrowLeft, Mail, ChevronRight, User as UserIcon,
  Tag, Shield, ExternalLink, LogOut, Menu, X
} from 'lucide-react';

export const DesktopLayout: React.FC<{ onOpenSettings: () => void }> = ({ onOpenSettings }) => {
  const { user, logout } = useAuth();
  const { themeMode } = useTheme();
  const isDark = themeMode === 'dark';

  const {
    folder, setFolder, filterChip, setFilterChip, searchQuery, setSearchQuery,
    emails, selectedEmailId, setSelectedEmailId, openCompose,
    toggleEmailState, deleteEmail, refreshAll, loading
  } = useEmail();

  const [replyText, setReplyText] = useState<string>('');
  const [replying, setReplying] = useState<boolean>(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState<boolean>(false);

  const selectedEmail = emails.find(e => e.id === selectedEmailId);

  const handleSendReply = async () => {
    if (!selectedEmail || !replyText.trim()) return;
    setReplying(true);
    try {
      const res = await api.replyEmail(selectedEmail.id, replyText);
      setReplyText('');
      if (res.email?.id) {
        setSelectedEmailId(res.email.id);
      }
      await refreshAll(true);
    } catch (err) {
      console.error('Reply error:', err);
    } finally {
      setReplying(false);
    }
  };

  const navItems = [
    { id: 'inbox', label: 'Inbox', icon: Inbox },
    { id: 'sent', label: 'Sent', icon: Send },
    { id: 'favorites', label: 'Starred', icon: Star },
    { id: 'drafts', label: 'Drafts', icon: FileText },
    { id: 'spam', label: 'Spam', icon: AlertOctagon },
    { id: 'trash', label: 'Trash', icon: Trash2 },
  ];

  return (
    <div className={`flex flex-col md:flex-row h-[calc(100vh-53px)] w-full max-w-full overflow-hidden font-sans transition-colors duration-200 box-border relative ${
      isDark ? 'bg-slate-900 text-slate-100' : 'bg-slate-50 text-slate-800'
    }`}>
      
      {/* --- MOBILE SUB-HEADER BAR INSIDE DESKTOP LAYOUT --- */}
      <div className={`md:hidden p-2.5 border-b flex items-center justify-between gap-2 shrink-0 box-border w-full ${
        isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <button
          onClick={() => setMobileSidebarOpen(true)}
          className={`px-2.5 py-1.5 rounded-xl border flex items-center gap-1.5 text-xs font-semibold ${
            isDark ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-slate-100 border-slate-200 text-slate-700'
          }`}
        >
          <Menu className="w-4 h-4 text-blue-500" />
          <span>Folders</span>
        </button>

        <span className="text-xs font-bold capitalize truncate max-w-[150px]">
          {folder}
        </span>

        <button
          onClick={() => openCompose()}
          className="py-1 px-2.5 bg-gradient-to-r from-blue-600 to-sky-500 text-white font-bold text-xs rounded-xl flex items-center gap-1 shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Compose</span>
        </button>
      </div>

      {/* --- MOBILE SIDEBAR DRAWER BACKDROP --- */}
      {mobileSidebarOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-xs"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* --- GMAIL LEFT SIDEBAR --- */}
      <aside className={`
        fixed md:static inset-y-0 left-0 z-50 md:z-auto
        w-72 md:w-60 max-w-[85vw] md:max-w-none
        p-3 flex flex-col gap-4 shrink-0 border-r transition-transform duration-200 ease-in-out box-border
        ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        ${isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800'}
      `}>
        {/* Mobile Drawer Header with Close Button */}
        <div className="flex items-center justify-between md:hidden pb-2 border-b border-slate-700/40">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-blue-600 to-sky-400 text-white font-black flex items-center justify-center text-xs">
              P
            </div>
            <span className="font-extrabold text-sm tracking-tight text-blue-500">PhoneMail</span>
          </div>
          <button
            onClick={() => setMobileSidebarOpen(false)}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Compose Button (Gmail Style) */}
        <button
          onClick={() => {
            setMobileSidebarOpen(false);
            openCompose();
          }}
          className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-500 hover:to-sky-400 text-white font-extrabold rounded-2xl shadow-lg flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
        >
          <Plus className="w-5 h-5 stroke-[3]" />
          <span>Compose</span>
        </button>

        {/* Navigation Folders */}
        <nav className="flex-1 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = folder === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setFolder(item.id);
                  setSelectedEmailId(null);
                  setMobileSidebarOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  active
                    ? isDark
                      ? 'bg-blue-500/20 text-sky-300 border border-blue-500/30'
                      : 'bg-blue-50 text-blue-600 border border-blue-200 font-bold'
                    : isDark
                      ? 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${active ? (isDark ? 'text-sky-400' : 'text-blue-600') : (isDark ? 'text-slate-400' : 'text-slate-500')}`} />
                  <span>{item.label}</span>
                </div>
              </button>
            );
          })}
        </nav>

        {/* User Alias Box & Sign Out Button */}
        <div className={`p-3 rounded-xl border text-xs space-y-2.5 box-border w-full ${
          isDark ? 'bg-slate-800/60 border-slate-700/60' : 'bg-slate-100 border-slate-200'
        }`}>
          <div className="overflow-hidden">
            <p className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Primary Phone Email
            </p>
            <p className={`font-mono font-semibold truncate ${isDark ? 'text-sky-300' : 'text-blue-600'}`}>
              {user?.emailAddress}
            </p>
            <button
              onClick={() => {
                setMobileSidebarOpen(false);
                onOpenSettings();
              }}
              className={`text-[10px] underline font-medium block pt-1 truncate max-w-full ${
                isDark ? 'text-slate-400 hover:text-sky-400' : 'text-slate-500 hover:text-blue-600'
              }`}
            >
              Manage Alias IDs & Settings →
            </button>
          </div>

          <button
            onClick={logout}
            className={`w-full py-2 px-3 rounded-xl border font-bold flex items-center justify-center gap-2 transition-all text-xs ${
              isDark
                ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border-rose-500/30'
                : 'bg-rose-50 hover:bg-rose-100 text-rose-600 border-rose-200'
            }`}
            title="Sign Out of PhoneMail"
          >
            <LogOut className="w-4 h-4 text-rose-500 shrink-0" />
            <span>Sign Out / Logout</span>
          </button>
        </div>
      </aside>

      {/* --- MIDDLE EMAIL LIST / TABLE --- */}
      <section className={`
        ${selectedEmail ? 'hidden md:flex md:w-80 lg:w-96' : 'flex w-full md:flex-1'}
        border-r flex-col overflow-hidden transition-colors duration-200 box-border min-w-0 ${
        isDark ? 'border-slate-800 bg-slate-900/50' : 'border-slate-200 bg-white'
      }`}>
        
        {/* Filter Chips Bar */}
        <div className={`p-2.5 border-b flex items-center gap-1.5 overflow-x-auto no-scrollbar max-w-full shrink-0 ${
          isDark ? 'border-slate-800' : 'border-slate-200'
        }`}>
          {[
            { id: 'all', label: 'All Mail' },
            { id: 'unread', label: 'Unread' },
            { id: 'attachments', label: 'Attachments' },
            { id: 'favorites', label: 'Starred' },
          ].map(chip => (
            <button
              key={chip.id}
              onClick={() => setFilterChip(chip.id)}
              className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap shrink-0 transition-all ${
                filterChip === chip.id
                  ? 'bg-blue-600 text-white font-bold'
                  : isDark
                    ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {chip.label}
            </button>
          ))}
        </div>

        {/* Email Rows */}
        <div className={`flex-1 overflow-y-auto divide-y ${isDark ? 'divide-slate-800/60' : 'divide-slate-200/80'}`}>
          {emails.length === 0 ? (
            <div className={`p-8 text-center text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              No emails found in {folder}.
            </div>
          ) : (
            emails.map((email) => {
              const isSelected = email.id === selectedEmailId;
              return (
                <div
                  key={email.id}
                  onClick={() => setSelectedEmailId(email.id)}
                  className={`p-3 flex items-start gap-2.5 cursor-pointer transition-all w-full min-w-0 box-border ${
                    isDark ? 'hover:bg-slate-800/70' : 'hover:bg-slate-50'
                  } ${
                    isSelected ? (isDark ? 'bg-blue-500/10 border-l-4 border-blue-500' : 'bg-blue-50 border-l-4 border-blue-600') : ''
                  } ${!email.isRead ? (isDark ? 'font-bold bg-slate-800/40' : 'font-bold bg-blue-50/40') : ''}`}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleEmailState(email.id, { isFavorite: !email.isFavorite });
                    }}
                    className={`mt-0.5 shrink-0 ${isDark ? 'text-slate-500 hover:text-amber-400' : 'text-slate-400 hover:text-amber-500'}`}
                  >
                    <Star className={`w-4 h-4 ${email.isFavorite ? 'text-amber-400 fill-amber-400' : ''}`} />
                  </button>

                  <div className="flex-1 min-w-0 overflow-hidden">
                    <div className="flex items-center justify-between mb-0.5 min-w-0 gap-1">
                      <h4 className={`text-xs truncate font-semibold min-w-0 flex-1 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                        {email.sender?.name} ({email.sender?.phoneNumber})
                      </h4>
                      <span className={`text-[10px] shrink-0 font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        {new Date(email.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      </span>
                    </div>

                    <p className={`text-xs truncate mb-1 min-w-0 ${isDark ? 'text-slate-100' : 'text-slate-900 font-medium'}`}>
                      {email.subject}
                    </p>

                    <p className={`text-[11px] truncate leading-relaxed min-w-0 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      {email.body}
                    </p>
                  </div>

                  {email.attachments && email.attachments.length > 0 && (
                    <Paperclip className={`w-3.5 h-3.5 shrink-0 mt-1 ${isDark ? 'text-slate-400' : 'text-slate-400'}`} />
                  )}
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* --- RIGHT READING PANE / DETAIL VIEW --- */}
      {selectedEmail ? (
        <section className={`flex-1 flex flex-col overflow-hidden transition-colors duration-200 w-full min-w-0 box-border ${
          isDark ? 'bg-slate-900' : 'bg-slate-50'
        }`}>
          
          {/* Action Toolbar */}
          <div className={`p-2.5 border-b flex items-center justify-between gap-2 shrink-0 ${
            isDark ? 'border-slate-800 bg-slate-900/80' : 'border-slate-200 bg-white'
          }`}>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelectedEmailId(null)}
                className={`md:hidden p-1.5 rounded-lg border flex items-center gap-1 text-xs font-bold ${
                  isDark ? 'bg-slate-800 border-slate-700 text-sky-400' : 'bg-blue-50 border-blue-200 text-blue-600'
                }`}
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Mail</span>
              </button>
              <button
                onClick={() => toggleEmailState(selectedEmail.id, { isFavorite: !selectedEmail.isFavorite })}
                className={`p-1.5 rounded-lg ${isDark ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-slate-100 text-slate-700'}`}
                title="Star / Favorite"
              >
                <Star className={`w-4 h-4 ${selectedEmail.isFavorite ? 'text-amber-400 fill-amber-400' : ''}`} />
              </button>
              <button
                onClick={() => toggleEmailState(selectedEmail.id, { isSpam: !selectedEmail.isSpam })}
                className={`p-1.5 rounded-lg ${isDark ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-slate-100 text-slate-700'}`}
                title="Report Spam"
              >
                <AlertOctagon className="w-4 h-4" />
              </button>
              <button
                onClick={() => deleteEmail(selectedEmail.id)}
                className={`p-1.5 rounded-lg hover:text-rose-500 ${isDark ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-slate-100 text-slate-700'}`}
                title="Delete Email"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <span className={`text-[10px] sm:text-xs font-mono truncate max-w-[140px] sm:max-w-none ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              ID: {selectedEmail.messageId.slice(0, 8)}
            </span>
          </div>

          {/* Email Reading Content */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-4 sm:space-y-6 max-w-full">
            
            {/* Subject Header */}
            <div className="min-w-0">
              <h2 className={`text-base sm:text-xl font-bold mb-2 break-words ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {selectedEmail.subject}
              </h2>
              <div className={`flex items-center gap-2.5 p-2.5 sm:p-3 rounded-xl border min-w-0 ${
                isDark ? 'bg-slate-800/50 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
              }`}>
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-r from-blue-600 to-sky-500 text-white font-bold flex items-center justify-center text-xs sm:text-sm shrink-0 shadow">
                  {selectedEmail.sender?.name ? selectedEmail.sender.name[0].toUpperCase() : 'P'}
                </div>
                <div className="flex-1 min-w-0 text-xs">
                  <p className={`font-bold truncate ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                    {selectedEmail.sender?.name} <span className={`font-mono font-normal ${isDark ? 'text-sky-400' : 'text-blue-600'}`}>&lt;{selectedEmail.sender?.emailAddress}&gt;</span>
                  </p>
                  <p className={`text-[11px] truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    To: {selectedEmail.recipients?.map(r => r.recipientEmail).join(', ') || user?.emailAddress}
                  </p>
                </div>
                <span className={`text-[10px] sm:text-xs font-mono shrink-0 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  {new Date(selectedEmail.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                </span>
              </div>
            </div>

            {/* Body */}
            <div className={`text-xs sm:text-sm leading-relaxed whitespace-pre-wrap p-3 sm:p-4 rounded-xl border min-h-[140px] break-words ${
              isDark ? 'bg-slate-800/30 border-slate-800/60 text-slate-200' : 'bg-white border-slate-200 text-slate-800 shadow-xs'
            }`}>
              {selectedEmail.body}
            </div>

            {/* Attachments */}
            {selectedEmail.attachments && selectedEmail.attachments.length > 0 && (
              <div className="space-y-2">
                <p className={`text-xs font-bold flex items-center gap-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  <Paperclip className={`w-4 h-4 ${isDark ? 'text-sky-400' : 'text-blue-600'}`} />
                  Attachments ({selectedEmail.attachments.length})
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {selectedEmail.attachments.map((att: any) => (
                    <div key={att.id} className={`p-2.5 rounded-xl border flex items-center justify-between text-xs min-w-0 ${
                      isDark ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-white border-slate-200 text-slate-800 shadow-xs'
                    }`}>
                      <span className="truncate flex-1 min-w-0 mr-2">{att.filename}</span>
                      <span className={`text-[10px] font-mono shrink-0 ${isDark ? 'text-sky-400' : 'text-blue-600'}`}>{(att.size / 1024).toFixed(1)} KB</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Inline Locked Reply Box */}
            <div className={`p-3 sm:p-4 rounded-2xl border space-y-3 box-border w-full ${
              isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-white border-slate-200 shadow-xs'
            }`}>
              <div className={`flex items-center justify-between text-xs font-semibold border-b pb-2 ${
                isDark ? 'text-slate-300 border-slate-700' : 'text-slate-700 border-slate-200'
              }`}>
                <span className="truncate mr-2">Reply to {selectedEmail.sender?.emailAddress}</span>
                <span className={`text-[10px] flex items-center gap-1 shrink-0 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  <Lock className={`w-3 h-3 ${isDark ? 'text-sky-400' : 'text-blue-600'}`} />
                  <span className="hidden sm:inline">To/CC locked</span>
                </span>
              </div>

              <textarea
                rows={3}
                placeholder="Write your reply message here..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                className={`w-full border rounded-xl p-3 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/50 box-border ${
                  isDark
                    ? 'bg-slate-900 border-slate-700 text-white placeholder-slate-400 focus:border-blue-500'
                    : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-blue-500'
                }`}
              />

              <div className="flex justify-end">
                <button
                  onClick={handleSendReply}
                  disabled={replying || !replyText.trim()}
                  className="py-2 px-5 bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-500 text-white font-bold rounded-xl text-xs shadow-md transition-all disabled:opacity-50"
                >
                  {replying ? 'Sending Reply...' : 'Send Reply'}
                </button>
              </div>
            </div>

          </div>
        </section>
      ) : (
        <section className={`hidden md:flex flex-1 items-center justify-center p-12 text-xs ${
          isDark ? 'text-slate-500' : 'text-slate-400'
        }`}>
          Select an email to view its full details.
        </section>
      )}

    </div>
  );
};


