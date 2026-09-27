import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useEmail } from '../../context/EmailContext';
import { useTheme } from '../../context/ThemeContext';
import { api } from '../../services/api';
import {
  Inbox, Send, FileText, AlertOctagon, Trash2, Star, Plus, Paperclip,
  Search, RefreshCw, Lock, ArrowLeft, Mail, ChevronRight, User as UserIcon,
  Tag, Shield, ExternalLink
} from 'lucide-react';

export const DesktopLayout: React.FC<{ onOpenSettings: () => void }> = ({ onOpenSettings }) => {
  const { user } = useAuth();
  const { themeMode } = useTheme();
  const isDark = themeMode === 'dark';

  const {
    folder, setFolder, filterChip, setFilterChip, searchQuery, setSearchQuery,
    emails, selectedEmailId, setSelectedEmailId, openCompose,
    toggleEmailState, deleteEmail, refreshAll, loading
  } = useEmail();

  const [replyText, setReplyText] = useState<string>('');
  const [replying, setReplying] = useState<boolean>(false);

  const selectedEmail = emails.find(e => e.id === selectedEmailId);

  const handleSendReply = async () => {
    if (!selectedEmail || !replyText.trim()) return;
    setReplying(true);
    try {
      await api.replyEmail(selectedEmail.id, replyText);
      setReplyText('');
      await refreshAll();
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
    <div className={`flex h-[calc(100vh-53px)] overflow-hidden font-sans transition-colors duration-200 ${
      isDark ? 'bg-slate-900 text-slate-100' : 'bg-slate-50 text-slate-800'
    }`}>
      
      {/* --- GMAIL LEFT SIDEBAR --- */}
      <aside className={`w-60 p-3 flex flex-col gap-4 shrink-0 border-r transition-colors duration-200 ${
        isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        {/* Compose Button (Gmail Style) */}
        <button
          onClick={() => openCompose()}
          className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-500 hover:to-sky-400 text-white font-extrabold rounded-2xl shadow-lg flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
        >
          <Plus className="w-5 h-5 stroke-[3]" />
          <span>Compose</span>
        </button>

        {/* Navigation Folders */}
        <nav className="flex-1 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = folder === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setFolder(item.id);
                  setSelectedEmailId(null);
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

        {/* User Alias Box */}
        <div className={`p-3 rounded-xl border text-xs space-y-1 ${
          isDark ? 'bg-slate-800/60 border-slate-700/60' : 'bg-slate-100 border-slate-200'
        }`}>
          <p className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Primary Phone Email
          </p>
          <p className={`font-mono font-semibold truncate ${isDark ? 'text-sky-300' : 'text-blue-600'}`}>
            {user?.emailAddress}
          </p>
          <button
            onClick={onOpenSettings}
            className={`text-[10px] underline font-medium block pt-1 ${
              isDark ? 'text-slate-400 hover:text-sky-400' : 'text-slate-500 hover:text-blue-600'
            }`}
          >
            Manage Alias IDs & Settings →
          </button>
        </div>
      </aside>

      {/* --- MIDDLE EMAIL LIST / TABLE --- */}
      <section className={`${selectedEmail ? 'w-96 hidden lg:flex' : 'flex-1'} border-r flex flex-col overflow-hidden transition-colors duration-200 ${
        isDark ? 'border-slate-800 bg-slate-900/50' : 'border-slate-200 bg-white'
      }`}>
        
        {/* Filter Chips Bar */}
        <div className={`p-3 border-b flex items-center gap-2 overflow-x-auto ${
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
              className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
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
            <div className={`p-12 text-center text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              No emails found in {folder}.
            </div>
          ) : (
            emails.map((email) => {
              const isSelected = email.id === selectedEmailId;
              return (
                <div
                  key={email.id}
                  onClick={() => setSelectedEmailId(email.id)}
                  className={`p-3 flex items-start gap-3 cursor-pointer transition-all ${
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
                    className={`mt-0.5 ${isDark ? 'text-slate-500 hover:text-amber-400' : 'text-slate-400 hover:text-amber-500'}`}
                  >
                    <Star className={`w-4 h-4 ${email.isFavorite ? 'text-amber-400 fill-amber-400' : ''}`} />
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <h4 className={`text-xs truncate font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                        {email.sender?.name} ({email.sender?.phoneNumber})
                      </h4>
                      <span className={`text-[10px] shrink-0 font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        {new Date(email.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      </span>
                    </div>

                    <p className={`text-xs truncate mb-1 ${isDark ? 'text-slate-100' : 'text-slate-900 font-medium'}`}>
                      {email.subject}
                    </p>

                    <p className={`text-[11px] truncate leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
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
        <section className={`flex-1 flex flex-col overflow-hidden transition-colors duration-200 ${
          isDark ? 'bg-slate-900' : 'bg-slate-50'
        }`}>
          
          {/* Action Toolbar */}
          <div className={`p-3 border-b flex items-center justify-between gap-2 ${
            isDark ? 'border-slate-800 bg-slate-900/80' : 'border-slate-200 bg-white'
          }`}>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelectedEmailId(null)}
                className={`lg:hidden p-1.5 rounded-lg ${isDark ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-slate-100 text-slate-700'}`}
              >
                <ArrowLeft className="w-4 h-4" />
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

            <span className={`text-xs font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Message ID: {selectedEmail.messageId.slice(0, 8)}
            </span>
          </div>

          {/* Email Reading Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            
            {/* Subject Header */}
            <div>
              <h2 className={`text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>{selectedEmail.subject}</h2>
              <div className={`flex items-center gap-3 p-3 rounded-xl border ${
                isDark ? 'bg-slate-800/50 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
              }`}>
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-600 to-sky-500 text-white font-bold flex items-center justify-center text-sm shadow">
                  {selectedEmail.sender?.name ? selectedEmail.sender.name[0].toUpperCase() : 'P'}
                </div>
                <div className="flex-1 min-w-0 text-xs">
                  <p className={`font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                    {selectedEmail.sender?.name} <span className={`font-mono font-normal ${isDark ? 'text-sky-400' : 'text-blue-600'}`}>&lt;{selectedEmail.sender?.emailAddress}&gt;</span>
                  </p>
                  <p className={`text-[11px] truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    To: {selectedEmail.recipients?.map(r => r.recipientEmail).join(', ') || user?.emailAddress}
                  </p>
                </div>
                <span className={`text-xs font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  {new Date(selectedEmail.createdAt).toLocaleString()}
                </span>
              </div>
            </div>

            {/* Body */}
            <div className={`text-sm leading-relaxed whitespace-pre-wrap p-4 rounded-xl border min-h-[160px] ${
              isDark ? 'bg-slate-800/30 border-slate-800/60 text-slate-200' : 'bg-white border-slate-200 text-slate-800 shadow-sm'
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
                <div className="grid grid-cols-2 gap-2">
                  {selectedEmail.attachments.map((att: any) => (
                    <div key={att.id} className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
                      isDark ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-white border-slate-200 text-slate-800 shadow-sm'
                    }`}>
                      <span className="truncate">{att.filename}</span>
                      <span className={`text-[10px] font-mono ${isDark ? 'text-sky-400' : 'text-blue-600'}`}>{(att.size / 1024).toFixed(1)} KB</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Inline Locked Reply Box */}
            <div className={`p-4 rounded-2xl border space-y-3 ${
              isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-white border-slate-200 shadow-sm'
            }`}>
              <div className={`flex items-center justify-between text-xs font-semibold border-b pb-2 ${
                isDark ? 'text-slate-300 border-slate-700' : 'text-slate-700 border-slate-200'
              }`}>
                <span>Reply to {selectedEmail.sender?.emailAddress}</span>
                <span className={`text-[10px] flex items-center gap-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  <Lock className={`w-3 h-3 ${isDark ? 'text-sky-400' : 'text-blue-600'}`} />
                  To / CC locked inside thread
                </span>
              </div>

              <textarea
                rows={3}
                placeholder="Write your reply message here..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                className={`w-full border rounded-xl p-3 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${
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
        <section className={`hidden lg:flex flex-1 items-center justify-center p-12 text-xs ${
          isDark ? 'text-slate-500' : 'text-slate-400'
        }`}>
          Select an email to view its full details.
        </section>
      )}

    </div>
  );
};

