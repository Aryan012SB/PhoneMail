export function getApiBaseUrl(): string {
  let url = (import.meta.env.VITE_API_URL as string) || '';

  if (url && url.trim()) {
    url = url.trim();
    // Fix internal Render service hostname (e.g. "phonemail-api" -> "https://phonemail-api.onrender.com/api")
    if (!url.includes('.') && !url.startsWith('/')) {
      url = `https://${url}.onrender.com/api`;
    } else {
      if (!url.startsWith('http') && !url.startsWith('/')) {
        url = `https://${url}`;
      }
      if (url.startsWith('http') && !url.endsWith('/api')) {
        url = `${url.replace(/\/$/, '')}/api`;
      }
    }
  }

  // Dynamic runtime fallback based on browser domain
  if (typeof window !== 'undefined' && window.location) {
    const host = window.location.hostname;

    // Always prefer local server when developing locally
    if (host === 'localhost' || host === '127.0.0.1') {
      return 'http://localhost:5000/api';
    }

    if (!url || url.includes('phonemail-api/api')) {
      if (host.includes('onrender.com')) {
        const apiHost = host.replace('-web.onrender.com', '-api.onrender.com');
        return `https://${apiHost}/api`;
      }
    }
  }

  return url || '/api';
}

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

  const primaryUrl = getApiBaseUrl();

  try {
    const response = await fetch(`${primaryUrl}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.error || `Request failed with status ${response.status}`);
    }

    return data;
  } catch (err: any) {
    // If network error occurred, perform automatic fallback check
    if (err.name === 'TypeError' || (err.message && err.message.includes('fetch'))) {
      const fallbackUrl = primaryUrl.includes('localhost:5000') ? '/api' : 'http://localhost:5000/api';
      if (fallbackUrl !== primaryUrl) {
        try {
          const fallbackResp = await fetch(`${fallbackUrl}${endpoint}`, { ...options, headers });
          const fallbackData = await fallbackResp.json().catch(() => ({}));
          if (fallbackResp.ok) return fallbackData;
        } catch (_) {}
      }
      throw new Error(`Unable to connect to PhoneMail API service (${primaryUrl}). Please ensure the API backend is running.`);
    }
    throw err;
  }
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

  updateEmailState: (id: string, state: { isRead?: boolean; isFavorite?: boolean; isSpam?: boolean; isTrash?: boolean; isArchived?: boolean; isImportant?: boolean }) =>
    fetchApi(`/emails/${id}/state`, { method: 'PATCH', body: JSON.stringify(state) }),

  deleteEmail: (id: string, permanent: boolean = false) =>
    fetchApi(`/emails/${id}${permanent ? '?permanent=true' : ''}`, { method: 'DELETE' }),

  // IVR Simulation
  simulateIvrCall: (callerPhone: string, digits = '1') =>
    fetchApi('/ivr/webhook', { method: 'POST', body: JSON.stringify({ callerPhone, digits }) }),
};
