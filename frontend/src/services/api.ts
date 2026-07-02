import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

let accessToken: string | null = null;
let refreshSubscriber: ((token: string) => void)[] = [];
let isRefreshing = false;

export const setAccessToken = (token: string | null) => {
  accessToken = token;
};

export const getAccessToken = () => accessToken;

const api = axios.create({
  baseURL: '/api/v1',
  withCredentials: true, // Crucial for HTTP-only cookies
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Inject Access Token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (accessToken && config.headers) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Automatically Refresh Token on 401 Unauthorized
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // If response is 401 and it's not a retry and not the login/register requests
    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/login') &&
      !originalRequest.url?.includes('/auth/register')
    ) {
      if (isRefreshing) {
        // Wait for the new token and retry the pending request
        return new Promise((resolve) => {
          refreshSubscriber.push((token: string) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            resolve(api(originalRequest));
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Call refresh endpoint to get new access token
        const response = await axios.post(
          '/api/v1/auth/refresh',
          {},
          { withCredentials: true }
        );

        const newAccessToken = response.data.accessToken;
        setAccessToken(newAccessToken);

        // Resolve queued requests
        refreshSubscriber.forEach((callback) => callback(newAccessToken));
        refreshSubscriber = [];
        isRefreshing = false;

        // Retry original request
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        }
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed (cookie expired/invalid) -> Clear token and propagate error
        isRefreshing = false;
        refreshSubscriber = [];
        setAccessToken(null);

        // Dispatch a custom event to notify AuthContext to log out the user
        window.dispatchEvent(new Event('auth-expired'));
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
