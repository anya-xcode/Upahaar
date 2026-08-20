import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

/** The token lives in localStorage so a refresh keeps you signed in. */
export const TOKEN_KEY = 'upahaar_token';

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    const { response } = error;

    // An expired session should drop you back to sign-in rather than showing a
    // wall of failures — but never bounce a guest browsing the storefront.
    if (response?.status === 401 && localStorage.getItem(TOKEN_KEY)) {
      localStorage.removeItem(TOKEN_KEY);
      const path = window.location.pathname;
      if (path.startsWith('/admin')) window.location.href = '/admin/login';
      else if (path.startsWith('/seller')) window.location.href = '/seller/login';
      else if (path.startsWith('/account') || path.startsWith('/checkout')) window.location.href = '/login';
    }

    // Normalise every failure to a readable sentence for the toast layer.
    error.message = response?.data?.message || error.message || 'Something went wrong';
    return Promise.reject(error);
  }
);

export default api;
