import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Conversation, Email } from '../types';
import { api } from '../services/api';
import { useAuth } from './AuthContext';

interface EmailContextType {
  folder: string;
  setFolder: (f: string) => void;
  filterChip: string;
  setFilterChip: (c: string) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  viewMode: 'auto' | 'mobile' | 'desktop';
  setViewMode: (v: 'auto' | 'mobile' | 'desktop') => void;
  
  conversations: Conversation[];
  emails: Email[];
  loading: boolean;
  
  selectedConversationId: string | null;
  setSelectedConversationId: (id: string | null) => void;
  selectedConversationDetail: any | null;
  setSelectedConversationDetail: (detail: any) => void;
  
  selectedEmailId: string | null;
  setSelectedEmailId: (id: string | null) => void;
  
  composeOpen: boolean;
  setComposeOpen: (open: boolean) => void;
  composePreset: { to?: string; subject?: string; threadId?: string } | null;
  openCompose: (preset?: { to?: string; subject?: string; threadId?: string }) => void;
  
  refreshAll: (isSilent?: boolean) => Promise<void>;
  toggleEmailState: (id: string, updates: { isRead?: boolean; isFavorite?: boolean; isSpam?: boolean; isTrash?: boolean }) => Promise<void>;
  deleteEmail: (id: string) => Promise<void>;
}

const EmailContext = createContext<EmailContextType | null>(null);

export const EmailProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [folder, setFolder] = useState<string>('inbox');
  const [filterChip, setFilterChip] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'auto' | 'mobile' | 'desktop'>('auto');

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [emails, setEmails] = useState<Email[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [selectedConversationDetail, setSelectedConversationDetail] = useState<any | null>(null);

  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null);

  const [composeOpen, setComposeOpen] = useState<boolean>(false);
  const [composePreset, setComposePreset] = useState<{ to?: string; subject?: string; threadId?: string } | null>(null);

  const folderRef = React.useRef(folder);
  const filterChipRef = React.useRef(filterChip);
  const searchQueryRef = React.useRef(searchQuery);
  const selectedConversationIdRef = React.useRef(selectedConversationId);

  useEffect(() => { folderRef.current = folder; }, [folder]);
  useEffect(() => { filterChipRef.current = filterChip; }, [filterChip]);
  useEffect(() => { searchQueryRef.current = searchQuery; }, [searchQuery]);
  useEffect(() => { selectedConversationIdRef.current = selectedConversationId; }, [selectedConversationId]);

  const refreshAll = useCallback(async (isSilent: boolean = false) => {
    if (!user) return;
    if (!isSilent) setLoading(true);
    try {
      const activeConvId = selectedConversationIdRef.current;
      const currentFolder = folderRef.current;
      const currentChip = filterChipRef.current;
      const currentSearch = searchQueryRef.current;

      const promises: Promise<any>[] = [
        api.getConversations(currentFolder, currentChip, currentSearch),
        api.getEmails(currentFolder, currentChip, currentSearch),
      ];
      if (activeConvId) {
        promises.push(api.getConversationDetail(activeConvId));
      }

      const [convsData, emailsData, detailData] = await Promise.all(promises);
      setConversations(convsData);
      setEmails(emailsData);
      if (activeConvId && detailData) {
        setSelectedConversationDetail(detailData);
      }
    } catch (err) {
      console.error('Failed to load email data:', err);
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refreshAll(false);
  }, [refreshAll, folder, filterChip, searchQuery]);

  // Automatic background refresh every 2 seconds for live auto-updating messages
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(() => {
      refreshAll(true);
    }, 2000);
    return () => clearInterval(interval);
  }, [user, refreshAll]);

  // Load conversation detail when selected
  useEffect(() => {
    if (!selectedConversationId) {
      setSelectedConversationDetail(null);
      return;
    }
    api.getConversationDetail(selectedConversationId)
      .then(detail => {
        setSelectedConversationDetail(detail);
      })
      .catch(err => console.error('Error fetching conversation detail:', err));
  }, [selectedConversationId]);

  const openCompose = (preset?: { to?: string; subject?: string; threadId?: string }) => {
    setComposePreset(preset || null);
    setComposeOpen(true);
  };

  const toggleEmailState = async (id: string, updates: { isRead?: boolean; isFavorite?: boolean; isSpam?: boolean; isTrash?: boolean }) => {
    try {
      await api.updateEmailState(id, updates);
      await refreshAll();
      if (selectedConversationId) {
        const detail = await api.getConversationDetail(selectedConversationId);
        setSelectedConversationDetail(detail);
      }
    } catch (err) {
      console.error('Error toggling state:', err);
    }
  };

  const deleteEmailItem = async (id: string) => {
    try {
      await api.deleteEmail(id);
      if (selectedEmailId === id) setSelectedEmailId(null);
      await refreshAll();
    } catch (err) {
      console.error('Error deleting email:', err);
    }
  };

  return (
    <EmailContext.Provider
      value={{
        folder,
        setFolder,
        filterChip,
        setFilterChip,
        searchQuery,
        setSearchQuery,
        viewMode,
        setViewMode,
        conversations,
        emails,
        loading,
        selectedConversationId,
        setSelectedConversationId,
        selectedConversationDetail,
        setSelectedConversationDetail,
        selectedEmailId,
        setSelectedEmailId,
        composeOpen,
        setComposeOpen,
        composePreset,
        openCompose,
        refreshAll,
        toggleEmailState,
        deleteEmail: deleteEmailItem,
      }}
    >
      {children}
    </EmailContext.Provider>
  );
};

export const useEmail = () => {
  const ctx = useContext(EmailContext);
  if (!ctx) throw new Error('useEmail must be used within EmailProvider');
  return ctx;
};
