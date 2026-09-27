const API_BASE = import.meta.env.VITE_API_URL || '/api';

export function getToken(): string | null {
  return localStorage.getItem('phonemail_token');
}

export function setToken(token: string) {
  localStorage.setItem('phonemail_token', token);
}

export function removeToken() {
  localStorage.removeItem('phonemail_token');
}

async function fetchApi(endpoint: string, options: RequestInit = {}) {
  const token = getToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || 'API Request failed');
  }

  return data;
}

export const api = {
  // Auth
  demoLogin: (phoneNumber: string) =>
    fetchApi('/auth/demo-login', { method: 'POST', body: JSON.stringify({ phoneNumber }) }),

  requestOtp: (phoneNumber: string) =>
    fetchApi('/auth/otp/request', { method: 'POST', body: JSON.stringify({ phoneNumber }) }),

  verifyOtp: (phoneNumber: string, otp: string) =>
    fetchApi('/auth/otp/verify', { method: 'POST', body: JSON.stringify({ phoneNumber, otp }) }),

  register: (payload: { phoneNumber: string; name?: string; password?: string }) =>
    fetchApi('/auth/register', { method: 'POST', body: JSON.stringify(payload) }),

  login: (phoneNumber: string, password?: string) =>
    fetchApi('/auth/login', { method: 'POST', body: JSON.stringify({ phoneNumber, password }) }),

  getMe: () => fetchApi('/auth/me'),

  // User & Aliases
  updateProfile: (payload: any) =>
    fetchApi('/users/profile', { method: 'PUT', body: JSON.stringify(payload) }),

  getAliases: () => fetchApi('/users/aliases'),

  addAlias: (alias: string) =>
    fetchApi('/users/aliases', { method: 'POST', body: JSON.stringify({ alias }) }),

  deleteAlias: (id: string) => fetchApi(`/users/aliases/${id}`, { method: 'DELETE' }),

  searchUsers: (q: string) => fetchApi(`/users/search?q=${encodeURIComponent(q)}`),

  // Emails & Conversations
  getConversations: (folder = 'inbox', filter = 'all', q = '') =>
    fetchApi(`/emails/conversations?folder=${folder}&filter=${filter}&q=${encodeURIComponent(q)}`),

  getConversationDetail: (id: string) => fetchApi(`/emails/conversations/${id}`),

  getEmails: (folder = 'inbox', filter = 'all', q = '') =>
    fetchApi(`/emails?folder=${folder}&filter=${filter}&q=${encodeURIComponent(q)}`),

  sendEmail: (formData: FormData) =>
    fetchApi('/emails/send', { method: 'POST', body: formData }),

  replyEmail: (id: string, body: string) =>
    fetchApi(`/emails/${id}/reply`, { method: 'POST', body: JSON.stringify({ body }) }),

  updateEmailState: (id: string, state: { isRead?: boolean; isFavorite?: boolean; isSpam?: boolean; isTrash?: boolean }) =>
    fetchApi(`/emails/${id}/state`, { method: 'PATCH', body: JSON.stringify(state) }),

  deleteEmail: (id: string) => fetchApi(`/emails/${id}`, { method: 'DELETE' }),

  // IVR Simulation
  simulateIvrCall: (callerPhone: string, digits = '1') =>
    fetchApi('/ivr/webhook', { method: 'POST', body: JSON.stringify({ callerPhone, digits }) }),
};
