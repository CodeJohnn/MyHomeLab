// Cole a URL HTTPS do seu Web Service no Render (sem /api).
// Vazio usa o servidor local que entrega o site.
export const API_BASE_URL = 'https://myhomelab.onrender.com';

export function apiUrl(path) {
  return new URL(path, API_BASE_URL || globalThis.location.origin).href;
}
