import React, { useState, useEffect } from 'react';
import { useEmail } from '../../context/EmailContext';
import { useTheme } from '../../context/ThemeContext';
import { api } from '../../services/api';
import { X, Send, Paperclip, Save, Lock, Search, UserCheck } from 'lucide-react';

export const ComposeModal: React.FC = () => {
  const {
    composeOpen, setComposeOpen, composePreset, refreshAll,
    setSelectedConversationId, setSelectedConversationDetail, setSelectedEmailId
  } = useEmail();
  const { themeMode } = useTheme();
  const isDark = themeMode === 'dark';

  const [toInput, setToInput] = useState<string>('');
  const [ccInput, setCcInput] = useState<string>('');
  const [subjectInput, setSubjectInput] = useState<string>('');
  const [bodyInput, setBodyInput] = useState<string>('');
  const [attachments, setAttachments] = useState<File[]>([]);
  
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [sending, setSending] = useState<boolean>(false);
  const [savingDraft, setSavingDraft] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (composePreset) {
      if (composePreset.to) setToInput(composePreset.to);
      if (composePreset.subject) setSubjectInput(composePreset.subject);
      if (composePreset.body) setBodyInput(composePreset.body);
    } else {
      setToInput('');
      setCcInput('');
      setSubjectInput('');
      setBodyInput('');
      setAttachments([]);
    }
  }, [composePreset, composeOpen]);

  if (!composeOpen) return null;

  // Search autocomplete for recipients
  const handleToSearch = async (val: string) => {
    setToInput(val);
    const query = val.split(',').pop()?.trim() || '';
    if (query.length >= 2) {
      try {
        const users = await api.searchUsers(query);
        setSearchResults(users);
      } catch (err) {
        console.error(err);
      }
    } else {
      setSearchResults([]);
    }
  };

  const selectUserTo = (userEmail: string) => {
    const parts = toInput.split(',');
    parts.pop();
    parts.push(userEmail);
    setToInput(parts.join(', ') + ', ');
    setSearchResults([]);
  };

  const handleSend = async (isDraft = false) => {
    setError(null);
    if (!isDraft && !toInput.trim()) {
      setError('Recipient (To) field is required.');
      return;
    }

    if (isDraft) setSavingDraft(true);
    else setSending(true);

    try {
      const formData = new FormData();
      formData.append('to', toInput);
      formData.append('cc', ccInput);
      formData.append('subject', subjectInput);
      formData.append('body', bodyInput);
      if (isDraft) formData.append('isDraft', 'true');
      if (composePreset?.threadId) formData.append('threadId', composePreset.threadId);
      if (composePreset?.draftId) formData.append('draftId', composePreset.draftId);

      attachments.forEach((file) => {
        formData.append('attachments', file);
      });

      const res = await api.sendEmail(formData);
      setComposeOpen(false);
      setToInput('');
      setCcInput('');
      setSubjectInput('');
      setBodyInput('');
      setAttachments([]);

      if (res.threadId) {
        setSelectedConversationId(res.threadId);
        try {
          const detail = await api.getConversationDetail(res.threadId);
          setSelectedConversationDetail(detail);
        } catch (_) {}
      } else if (res.emailId) {
        setSelectedEmailId(res.emailId);
      }

      await refreshAll(true);
    } catch (err: any) {
      setError(err.message || 'Failed to process email');
    } finally {
      setSending(false);
      setSavingDraft(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className={`w-full max-w-xl rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-colors border ${
        isDark ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-800'
      }`}>
        
        {/* Header */}
        <div className={`px-4 py-3 border-b flex items-center justify-between ${
          isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-100 border-slate-200'
        }`}>
          <h3 className={`text-xs font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
            {composePreset?.threadId ? 'Reply inside Conversation' : 'Compose New Message'}
          </h3>
          <button
            onClick={() => setComposeOpen(false)}
            className={`p-1 rounded-lg ${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'}`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="p-3 bg-rose-500/10 border-b border-rose-500/30 text-rose-500 text-xs font-medium">
            {error}
          </div>
        )}

        {/* Inputs */}
        <div className="p-4 space-y-3 flex-1 overflow-y-auto">
          
          {/* To Field */}
          <div className="relative">
            <div className={`flex items-center gap-2 border-b pb-2 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
              <span className={`text-xs font-bold w-12 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>To:</span>
              <input
                type="text"
                disabled={Boolean(composePreset?.threadId)}
                placeholder="Enter phone number or email (e.g. 9876543210@phonemail.com)"
                value={toInput}
                onChange={(e) => handleToSearch(e.target.value)}
                className={`flex-1 bg-transparent text-xs focus:outline-none ${
                  isDark
                    ? 'text-white placeholder-slate-500 disabled:text-slate-500'
                    : 'text-slate-900 placeholder-slate-400 disabled:text-slate-400'
                }`}
              />
              {composePreset?.threadId && <span title="Locked inside active thread"><Lock className={`w-3.5 h-3.5 ${isDark ? 'text-sky-400' : 'text-blue-600'}`} /></span>}
            </div>

            {/* Autocomplete Dropdown */}
            {searchResults.length > 0 && (
              <div className={`absolute left-14 right-0 top-full mt-1 border rounded-xl shadow-xl z-20 overflow-hidden ${
                isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
              }`}>
                {searchResults.map((u) => (
                  <div
                    key={u.id}
                    onClick={() => selectUserTo(u.emailAddress)}
                    className={`p-2.5 cursor-pointer flex items-center justify-between text-xs ${
                      isDark ? 'hover:bg-slate-700' : 'hover:bg-slate-100'
                    }`}
                  >
                    <div>
                      <p className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{u.name}</p>
                      <p className={`text-[10px] font-mono ${isDark ? 'text-sky-400' : 'text-blue-600'}`}>{u.emailAddress}</p>
                    </div>
                    <UserCheck className={`w-3.5 h-3.5 ${isDark ? 'text-sky-400' : 'text-blue-600'}`} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* CC Field */}
          {!composePreset?.threadId && (
            <div className={`flex items-center gap-2 border-b pb-2 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
              <span className={`text-xs font-bold w-12 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>CC:</span>
              <input
                type="text"
                placeholder="Optional CC recipients"
                value={ccInput}
                onChange={(e) => setCcInput(e.target.value)}
                className={`flex-1 bg-transparent text-xs focus:outline-none ${
                  isDark ? 'text-white placeholder-slate-500' : 'text-slate-900 placeholder-slate-400'
                }`}
              />
            </div>
          )}

          {/* Subject Field */}
          <div className={`flex items-center gap-2 border-b pb-2 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
            <span className={`text-xs font-bold w-12 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Subject:</span>
            <input
              type="text"
              placeholder="Subject title..."
              value={subjectInput}
              onChange={(e) => setSubjectInput(e.target.value)}
              className={`flex-1 bg-transparent text-xs focus:outline-none ${
                isDark ? 'text-white placeholder-slate-500' : 'text-slate-900 placeholder-slate-400'
              }`}
            />
          </div>

          {/* Body Textarea */}
          <textarea
            rows={7}
            placeholder="Type your message..."
            value={bodyInput}
            onChange={(e) => setBodyInput(e.target.value)}
            className={`w-full border rounded-xl p-3 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${
              isDark
                ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-500 focus:border-blue-500'
                : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-blue-500'
            }`}
          />

          {/* Selected Attachments Badge Stream */}
          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {attachments.map((file, idx) => (
                <div key={idx} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] border ${
                  isDark ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-slate-100 border-slate-200 text-slate-800'
                }`}>
                  <Paperclip className={`w-3 h-3 ${isDark ? 'text-sky-400' : 'text-blue-600'}`} />
                  <span className="truncate max-w-[120px]">{file.name}</span>
                  <button
                    onClick={() => setAttachments(attachments.filter((_, i) => i !== idx))}
                    className="text-slate-400 hover:text-rose-500 font-bold ml-1"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className={`px-4 py-3 border-t flex items-center justify-between ${
          isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-100 border-slate-200'
        }`}>
          <label className={`p-2 rounded-xl cursor-pointer transition-all flex items-center gap-1.5 text-xs font-semibold ${
            isDark ? 'bg-slate-700 hover:bg-slate-600 text-slate-300' : 'bg-slate-200 hover:bg-slate-300 text-slate-800'
          }`}>
            <Paperclip className={`w-4 h-4 ${isDark ? 'text-sky-400' : 'text-blue-600'}`} />
            <span>Attach File</span>
            <input
              type="file"
              multiple
              onChange={(e) => {
                if (e.target.files) setAttachments([...attachments, ...Array.from(e.target.files)]);
              }}
              className="hidden"
            />
          </label>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleSend(true)}
              disabled={savingDraft || sending}
              className={`py-2 px-3 font-semibold rounded-xl text-xs flex items-center gap-1.5 transition-all ${
                isDark ? 'bg-slate-700 hover:bg-slate-600 text-slate-200' : 'bg-slate-200 hover:bg-slate-300 text-slate-800'
              }`}
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Draft</span>
            </button>

            <button
              onClick={() => handleSend(false)}
              disabled={sending || savingDraft}
              className="py-2 px-4 bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md transition-all disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{sending ? 'Sending...' : 'Send Email'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

