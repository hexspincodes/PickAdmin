import axios from 'axios';
import { getToken, clearSession } from '../utils/tokenStorage';

const BACKEND1_URL = import.meta.env.VITE_BACKEND1_URL || 'https://api.backendpickmymaid.site';
const BACKEND2_URL = import.meta.env.VITE_BACKEND2_URL || 'https://api.backendpickmymaid.site';

/**
 * Backend1 — admin, maids/jobs, blog, contact, analytics.
 * Backend2 — auth, payment.
 * Both share the same Admin JWT (`JWT_SECRET`), so one interceptor pair works for either.
 */
function createClient(baseURL) {
  const client = axios.create({ baseURL, timeout: 30000 });

  client.interceptors.request.use((config) => {
    const token = getToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });

  client.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error?.response?.status === 401) {
        clearSession();
        if (!window.location.pathname.startsWith('/login')) {
          window.location.href = '/login';
        }
      }
      return Promise.reject(error);
    },
  );

  return client;
}

export const api1 = createClient(BACKEND1_URL);
export const api2 = createClient(BACKEND2_URL);

/** Unwraps the project's response envelope, or throws a normalized error message. */
export function unwrap(promise) {
  return promise
    .then((res) => res.data)
    .catch((error) => {
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.status ||
        error?.message ||
        'Something went wrong';
      throw new Error(message);
    });
}
