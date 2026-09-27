import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useEmail } from '../../context/EmailContext';
import { useTheme } from '../../context/ThemeContext';
import { api } from '../../services/api';
import {
  Menu, X, Search, Plus, Filter, Send, Paperclip, Lock, ArrowLeft, Star,
  Inbox, FileText, AlertOctagon, Trash2, Settings as SettingsIcon, PhoneCall,
  CornerUpLeft, Mail, ChevronRight, User as UserIcon
} from 'lucide-react';

export const MobileLayout: React.FC<{ onOpenSettings: () => void }> = ({ onOpenSettings }) => {
  const { user } = useAuth();
  const { themeMode } = useTheme();
  const isDark = themeMode === 'dark';

  const {
    folder, setFolder, filterChip, setFilterChip, searchQuery, setSearchQuery,
    conversations, selectedConversationId, setSelectedConversationId,
    selectedConversationDetail, openCompose, toggleEmailState, refreshAll
  } = useEmail();

  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);
  const [chatInput, setChatInput] = useState<string>('');
  const [sending, setSending] = useState<boolean>(false);

  // Quick reply inside open WhatsApp-style thread
  const handleQuickSend = async () => {
    if (!chatInput.trim() || !selectedConversationDetail) return;
    setSending(true);
    try {
      const latest = selectedConversationDetail.emails[selectedConversationDetail.emails.length - 1];
      await api.replyEmail(latest.id, chatInput);
      setChatInput('');
      await api.getConversationDetail(selectedConversationDetail.id);
      refreshAll();
    } catch (err) {
      console.error('Quick send error:', err);
    } finally {
      setSending(false);
    }
  };

  const navItems = [
    { id: 'inbox', label: 'Inbox', icon: Inbox },
    { id: 'favorites', label: 'Starred / Favorites', icon: Star },
    { id: 'drafts', label: 'Drafts', icon: FileText },
    { id: 'spam', label: 'Spam', icon: AlertOctagon },
    { id: 'trash', label: 'Trash', icon: Trash2 },
  ];

  return (
    <div className={`flex flex-col h-[calc(100vh-53px)] relative overflow-hidden select-none font-sans transition-colors duration-200 ${
      isDark ? 'bg-[#111B21] text-slate-100' : 'bg-slate-100 text-slate-800'
    }`}>
      
      {/* --- TOP MOBILE HEADER --- */}
      {!selectedConversationId ? (
        <div className={`border-b px-3 py-2.5 flex items-center justify-between gap-2 shadow-md transition-colors ${
          isDark ? 'bg-[#202C33] border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <button
            onClick={() => setDrawerOpen(true)}
            className={`p-2 rounded-full transition-all ${isDark ? 'hover:bg-slate-700/60 text-slate-200' : 'hover:bg-slate-100 text-slate-700'}`}
          >
            <Menu className="w-5 h-5" />
          </button>
          
          <h2 className={`text-base font-bold capitalize flex-1 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
            {folder === 'inbox' ? 'PhoneMail' : folder}
          </h2>

          <button
            onClick={onOpenSettings}
            className={`p-1.5 rounded-full transition-all ${isDark ? 'hover:bg-slate-700/60 text-slate-200' : 'hover:bg-slate-100 text-slate-700'}`}
          >
            <div className="w-7 h-7 rounded-full bg-gradient-to-r from-blue-600 to-sky-500 text-white font-bold flex items-center justify-center text-xs shadow">
              {user?.name ? user.name[0].toUpperCase() : 'P'}
            </div>
          </button>
        </div>
      ) : (
        /* OPEN THREAD HEADER */
        <div className={`border-b px-3 py-2 flex items-center gap-3 shadow-md transition-colors ${
          isDark ? 'bg-[#202C33] border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <button
            onClick={() => setSelectedConversationId(null)}
            className={`p-2 rounded-full transition-all ${isDark ? 'hover:bg-slate-700/60 text-slate-200' : 'hover:bg-slate-100 text-slate-700'}`}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="flex-1 min-w-0">
            <h3 className={`text-sm font-bold truncate ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
              {selectedConversationDetail?.subject || 'Conversation Thread'}
            </h3>
            <p className={`text-[11px] font-mono truncate ${isDark ? 'text-sky-400' : 'text-blue-600'}`}>
              {selectedConversationDetail?.members
                ?.filter((m: any) => m.userId !== user?.id)
                ?.map((m: any) => m.user.emailAddress)
                .join(', ') || 'PhoneMail Thread'}
            </p>
          </div>

          <button
            onClick={() => {
              openCompose({
                to: selectedConversationDetail?.members
                  ?.filter((m: any) => m.userId !== user?.id)
                  ?.map((m: any) => m.user.emailAddress)
                  .join(','),
                subject: selectedConversationDetail?.subject,
                threadId: selectedConversationDetail?.id,
              });
            }}
            className="py-1 px-2.5 bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-500 text-white font-bold text-[11px] rounded-lg transition-all flex items-center gap-1 shadow-xs"
            title="Open in Traditional Email View"
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Traditional View</span>
          </button>
        </div>
      )}

      {/* --- DRAWER MENU SIDEBAR --- */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-xs"
            onClick={() => setDrawerOpen(false)}
          />
          <div className={`relative w-72 max-w-[80vw] border-r flex flex-col h-full z-10 shadow-2xl transition-colors ${
            isDark ? 'bg-[#111B21] border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <div className={`p-4 border-b flex items-center justify-between ${
              isDark ? 'bg-[#202C33] border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-r from-blue-600 to-sky-500 text-white font-black flex items-center justify-center text-sm shadow">
                  {user?.name ? user.name[0].toUpperCase() : 'P'}
                </div>
                <div className="overflow-hidden">
                  <p className={`text-xs font-bold truncate ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{user?.name}</p>
                  <p className={`text-[10px] font-mono truncate ${isDark ? 'text-sky-400' : 'text-blue-600'}`}>{user?.emailAddress}</p>
                </div>
              </div>
              <button
                onClick={() => setDrawerOpen(false)}
                className={`p-1 rounded-full ${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'}`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 py-3 px-2 space-y-1 overflow-y-auto">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = folder === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setFolder(item.id);
                      setSelectedConversationId(null);
                      setDrawerOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                      active
                        ? isDark
                          ? 'bg-blue-500/20 text-sky-300 font-bold border border-blue-500/30'
                          : 'bg-blue-50 text-blue-600 font-bold border border-blue-200'
                        : isDark
                          ? 'text-slate-300 hover:bg-slate-800/60'
                          : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${active ? (isDark ? 'text-sky-400' : 'text-blue-600') : (isDark ? 'text-slate-400' : 'text-slate-500')}`} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>

            <div className={`p-3 border-t ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
              <button
                onClick={() => {
                  setDrawerOpen(false);
                  onOpenSettings();
                }}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs ${
                  isDark ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <SettingsIcon className="w-4 h-4 text-slate-400" />
                <span>Settings & Aliases</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MAIN CONTENT AREA --- */}
      {!selectedConversationId ? (
        <div className="flex-1 flex flex-col overflow-hidden">
          
          {/* SEARCH & FILTER CHIPS */}
          <div className={`p-3 space-y-2 border-b transition-colors ${
            isDark ? 'bg-[#111B21] border-slate-800/60' : 'bg-white border-slate-200'
          }`}>
            <div className="relative">
              <Search className={`w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-slate-400' : 'text-slate-400'}`} />
              <input
                type="text"
                placeholder="Search messages or phone numbers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full border rounded-xl pl-9 pr-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${
                  isDark
                    ? 'bg-[#202C33] border-slate-700/60 text-white placeholder-slate-400 focus:border-blue-500'
                    : 'bg-slate-100 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-blue-500'
                }`}
              />
            </div>

            {/* Filter Chips: All | Unread | Attachments | Favorites */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              {[
                { id: 'all', label: 'All' },
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
                        ? 'bg-[#202C33] text-slate-300 hover:bg-slate-700'
                        : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                  }`}
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </div>

          {/* CONVERSATION THREAD LIST CARD STREAM */}
          <div className={`flex-1 overflow-y-auto divide-y ${isDark ? 'divide-slate-800/40' : 'divide-slate-200'}`}>
            {conversations.length === 0 ? (
              <div className={`p-8 text-center text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                No conversations found in {folder}.
              </div>
            ) : (
              conversations.map((conv) => {
                const other = conv.otherMembers[0] || conv.members[0];
                return (
                  <div
                    key={conv.id}
                    onClick={() => setSelectedConversationId(conv.id)}
                    className={`p-3 flex items-center gap-3 cursor-pointer transition-all ${
                      isDark
                        ? `hover:bg-[#202C33]/60 ${!conv.isRead ? 'bg-[#202C33]/30' : ''}`
                        : `hover:bg-slate-50 ${!conv.isRead ? 'bg-blue-50/50' : ''}`
                    }`}
                  >
                    {/* User Avatar */}
                    <div className="relative shrink-0">
                      <div className={`w-12 h-12 rounded-full border flex items-center justify-center font-bold text-base shadow ${
                        isDark ? 'bg-slate-700 border-slate-600 text-sky-300' : 'bg-blue-100 border-blue-200 text-blue-600'
                      }`}>
                        {other?.name ? other.name[0].toUpperCase() : 'P'}
                      </div>
                      {conv.isGroup && (
                        <span className={`absolute -bottom-1 -right-1 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-full border ${
                          isDark ? 'bg-blue-600 border-slate-900' : 'bg-blue-600 border-white'
                        }`}>
                          GROUP
                        </span>
                      )}
                    </div>

                    {/* Content preview */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <h4 className={`text-xs truncate ${!conv.isRead ? 'font-bold text-blue-600 dark:text-white' : (isDark ? 'font-semibold text-slate-200' : 'font-semibold text-slate-800')}`}>
                          {conv.isGroup ? conv.subject : other?.name || other?.emailAddress}
                        </h4>
                        <span className={`text-[10px] shrink-0 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                          {new Date(conv.latestEmail.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <p className={`text-[11px] font-medium truncate mb-0.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                        {conv.subject}
                      </p>

                      <p className={`text-[11px] truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        {conv.latestEmail.body}
                      </p>
                    </div>

                    {/* Status Badges */}
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleEmailState(conv.latestEmail.id, { isFavorite: !conv.isFavorite });
                        }}
                        className={`hover:text-amber-400 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}
                      >
                        <Star className={`w-3.5 h-3.5 ${conv.isFavorite ? 'text-amber-400 fill-amber-400' : ''}`} />
                      </button>
                      {!conv.isRead && (
                        <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* FLOATING ACTION COMPOSE BUTTON */}
          <button
            onClick={() => openCompose()}
            className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-gradient-to-tr from-blue-600 to-sky-500 text-white shadow-2xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all z-20"
            title="Compose New Email / Chat"
          >
            <Plus className="w-7 h-7 font-black" />
          </button>

        </div>
      ) : (
        /* --- CHAT ROOM VIEW --- */
        <div className={`flex-1 flex flex-col overflow-hidden relative ${
          isDark ? 'bg-[#0B141A]' : 'bg-slate-100'
        }`}>
          
          {/* Messages Stream */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {selectedConversationDetail?.emails?.map((msg: any) => {
              const isMe = msg.senderId === user?.id;
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl p-3 shadow-md text-xs relative ${
                      isMe
                        ? 'bg-blue-600 text-white rounded-tr-none'
                        : isDark
                          ? 'bg-[#202C33] text-slate-100 rounded-tl-none'
                          : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none'
                    }`}
                  >
                    {!isMe && (
                      <p className={`text-[10px] font-bold mb-1 ${isDark ? 'text-sky-400' : 'text-blue-600'}`}>
                        {msg.sender?.name} ({msg.sender?.phoneNumber})
                      </p>
                    )}

                    {msg.subject && (
                      <p className={`font-semibold border-b pb-1 mb-1 ${isMe ? 'text-amber-200/90 border-white/20' : (isDark ? 'text-amber-200/90 border-white/10' : 'text-slate-900 border-slate-200')}`}>
                        {msg.subject}
                      </p>
                    )}

                    <p className="whitespace-pre-wrap leading-relaxed">{msg.body}</p>

                    {/* Attachments */}
                    {msg.attachments && msg.attachments.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-white/10 space-y-1">
                        {msg.attachments.map((att: any) => (
                          <div key={att.id} className="flex items-center gap-2 p-1.5 bg-black/20 rounded-lg text-[10px]">
                            <Paperclip className={`w-3.5 h-3.5 ${isDark ? 'text-sky-300' : 'text-blue-600'}`} />
                            <span className="truncate flex-1">{att.filename}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    <span className={`text-[9px] block text-right mt-1.5 font-mono ${isMe ? 'text-white/70' : (isDark ? 'text-slate-300/60' : 'text-slate-400')}`}>
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Locked Recipient Notice & Quick Input Footer */}
          <div className={`p-3 border-t flex items-center gap-2 ${
            isDark ? 'bg-[#202C33] border-slate-800' : 'bg-white border-slate-200 shadow-lg'
          }`}>
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Type a reply inside this conversation..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleQuickSend()}
                className={`w-full border rounded-full pl-4 pr-10 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${
                  isDark
                    ? 'bg-[#111B21] border-slate-700/80 text-white placeholder-slate-400 focus:border-blue-500'
                    : 'bg-slate-100 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-blue-500'
                }`}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" title="To/CC Locked inside active thread">
                <Lock className="w-3.5 h-3.5" />
              </span>
            </div>

            <button
              onClick={handleQuickSend}
              disabled={sending || !chatInput.trim()}
              className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-500 text-white font-bold flex items-center justify-center shrink-0 shadow-lg disabled:opacity-50 transition-all"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

