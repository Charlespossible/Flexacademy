import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from 'axios';
import toast from 'react-hot-toast';
import { useAuthStore, refreshTokenStorage } from '@/stores/authStore';

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5000/api/v1';

// ─── Primary API instance ─────────────────────────────────────────────────────
export const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// ─── Refresh instance (no interceptors — prevents infinite loop) ──────────────
const refreshApi = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
});

// ─── Request interceptor — inject Authorization header ────────────────────────
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = useAuthStore.getState().accessToken;
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Token refresh queue (prevents multiple concurrent refresh calls) ─────────
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

function processQueue(error: unknown, token: string | null = null) {
  failedQueue.forEach(({ resolve, reject }) => {
    if (token) resolve(token);
    else reject(error);
  });
  failedQueue = [];
}

// Auth endpoints must never trigger the refresh-token flow — they are the ones
// that produce intentional 401s (wrong password, bad token in request body).
const AUTH_ENDPOINTS = ['/auth/login', '/auth/register', '/auth/forgot-password', '/auth/reset-password', '/auth/verify'];
const isAuthEndpoint = (url?: string) => AUTH_ENDPOINTS.some((e) => url?.includes(e));

// ─── Response interceptor — handle 401 + token refresh ───────────────────────
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };
    const url = originalRequest?.url;
    const status = error.response?.status as number | undefined;

    // Auth endpoints: never refresh, never redirect — let the calling mutation
    // handle the error message so the user sees exactly one toast.
    if (isAuthEndpoint(url)) {
      return Promise.reject(error);
    }

    // ── 401 on a protected endpoint ───────────────────────────────────────────
    if (status === 401 && !originalRequest._retry) {
      const refreshToken = refreshTokenStorage.get();

      // No stored refresh token — session is gone, send to login
      if (!refreshToken) {
        useAuthStore.getState().clearAuth();
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: (token) => {
              if (originalRequest.headers) {
                originalRequest.headers['Authorization'] = `Bearer ${token}`;
              }
              resolve(api(originalRequest));
            },
            reject,
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const response = await refreshApi.post<{
          success: boolean;
          data: { accessToken: string; refreshToken: string };
        }>('/auth/refresh', { refreshToken });

        const { accessToken, refreshToken: newRefreshToken } = response.data.data;

        useAuthStore.getState().setAccessToken(accessToken);
        refreshTokenStorage.set(newRefreshToken);
        processQueue(null, accessToken);

        if (originalRequest.headers) {
          originalRequest.headers['Authorization'] = `Bearer ${accessToken}`;
        }
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        useAuthStore.getState().clearAuth();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // ── All other errors — show a single toast ────────────────────────────────
    if (status !== 401) {
      const message = (error.response?.data?.message as string | undefined) ?? 'Something went wrong';
      const skipToast =
        status === 404 ||
        url?.includes('notifications');

      if (!skipToast) {
        toast.error(message, { id: `api-error-${status ?? 'network'}` });
      }
    }

    return Promise.reject(error);
  }
);

// ─── Auth API calls ───────────────────────────────────────────────────────────
export const authApi = {
  register: (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role?: string;
    gradeLevel?: string;
    curriculum?: string;
  }) => api.post('/auth/register', data),

  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),

  logout: () => api.post('/auth/logout'),

  refreshToken: (refreshToken: string) =>
    refreshApi.post('/auth/refresh', { refreshToken }),

  forgotPassword: (email: string) =>
    api.post('/auth/forgot-password', { email }),

  resetPassword: (token: string, newPassword: string) =>
    api.post('/auth/reset-password', { token, newPassword }),

  verifyEmail: (token: string) =>
    api.get(`/auth/verify/${token}`),

  getMe: () => api.get('/users/me'),
};

export default api;
