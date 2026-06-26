const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

class ApiError extends Error {
  constructor(public status: number, public code: string, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (res.status === 401) {
    // Try refreshing token
    const refreshRes = await fetch(`${BASE_URL}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    });
    if (refreshRes.ok) {
      // Retry original request
      const retryRes = await fetch(`${BASE_URL}${path}`, {
        ...options,
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', ...options.headers },
      });
      if (!retryRes.ok) {
        const err = await retryRes.json().catch(() => ({}));
        throw new ApiError(retryRes.status, err.error?.code || 'UNKNOWN', err.error?.message || 'Request failed');
      }
      return retryRes.json();
    } else {
      // Redirect to login
      if (typeof window !== 'undefined') window.location.href = '/login';
      throw new ApiError(401, 'UNAUTHORIZED', 'Session expired');
    }
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new ApiError(res.status, err.error?.code || 'UNKNOWN', err.error?.message || 'Request failed');
  }

  return res.json();
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) => request<T>(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),
  patch: <T>(path: string, body?: unknown) => request<T>(path, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};

export { ApiError };

// ── Auth ──────────────────────────────────────────────────────────────────
export const authApi = {
  register: (data: { email: string; password: string }) =>
    api.post('/auth/register', data),
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  googleLogin: (idToken: string) =>
    api.post('/auth/google', { idToken }),
  verifyOtp: (email: string, code: string) =>
    api.post('/auth/verify-otp', { email, code }),
  resendOtp: (email: string) =>
    api.post('/auth/resend-otp', { email }),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/users/me'),
  getConfig: () => api.get('/auth/config'),
  setupProfile: (data: any) =>
    api.post('/users/profile/setup', data),
  updateProfile: (data: any) =>
    api.patch('/users/profile', data),
};

// ── Dashboard ─────────────────────────────────────────────────────────────
export const dashboardApi = {
  getSummary: () => api.get('/dashboard/summary'),
  getMastery: () => api.get('/dashboard/mastery'),
  getHistory: () => api.get('/dashboard/history'),
};

// ── Content ───────────────────────────────────────────────────────────────
export const kanaApi = {
  list: (script?: string) => api.get(`/kana${script ? `?script=${script}` : ''}`),
};

export const kanjiApi = {
  list: (params?: { level?: string; page?: number }) => {
    const q = new URLSearchParams();
    if (params?.level) q.set('level', params.level);
    if (params?.page) q.set('page', String(params.page));
    return api.get(`/kanji?${q}`);
  },
  get: (id: string) => api.get(`/kanji/${id}`),
  addToSRS: (id: string) => api.post(`/kanji/${id}/srs`),
};

export const grammarApi = {
  list: (params?: { level?: string; category?: string; page?: number }) => {
    const q = new URLSearchParams();
    if (params?.level) q.set('level', params.level);
    if (params?.category) q.set('category', params.category);
    if (params?.page) q.set('page', String(params.page));
    return api.get(`/grammar?${q}`);
  },
  get: (id: string) => api.get(`/grammar/${id}`),
  addToSRS: (id: string) => api.post(`/grammar/${id}/srs`),
};

export const vocabApi = {
  list: (params?: { level?: string; category?: string; search?: string; page?: number }) => {
    const q = new URLSearchParams();
    if (params?.level) q.set('level', params.level);
    if (params?.category) q.set('category', params.category);
    if (params?.search) q.set('search', params.search);
    if (params?.page) q.set('page', String(params.page));
    return api.get(`/vocabulary?${q}`);
  },
  get: (id: string) => api.get(`/vocabulary/${id}`),
  addToSRS: (id: string) => api.post(`/vocabulary/${id}/srs`),
};

// ── SRS ───────────────────────────────────────────────────────────────────
export const srsApi = {
  getDue: (limit?: number) => api.get(`/srs/due${limit ? `?limit=${limit}` : ''}`),
  review: (cardId: string, grade: number) => api.post('/srs/review', { cardId, grade }),
  getStats: () => api.get('/srs/stats'),
  seed: (limit?: number) => api.post(`/srs/seed${limit ? `?limit=${limit}` : ''}`),
};

// ── Tests ─────────────────────────────────────────────────────────────────
export const testsApi = {
  list: (level?: string) => api.get(`/tests${level ? `?level=${level}` : ''}`),
  start: (id: string) => api.post(`/tests/${id}/start`),
  submit: (attemptId: string, answers: unknown[]) => api.post(`/tests/attempts/${attemptId}/submit`, { answers }),
  getReport: (attemptId: string) => api.get(`/tests/attempts/${attemptId}/report`),
};

// ── AI ────────────────────────────────────────────────────────────────────
export const aiApi = {
  generateQuiz: (topic: string, level: string, count?: number, sectionType?: string) =>
    api.post('/ai/quiz/generate', { topic, level, count, sectionType }),
  screenHelp: (imageBase64: string, question: string, currentRoute: string) =>
    api.post('/ai/screen-help', { imageBase64, question, currentRoute }),
};
