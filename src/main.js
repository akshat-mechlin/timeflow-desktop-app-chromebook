import '../styles.css';
import { Buffer } from 'buffer';
import process from 'process/browser';

globalThis.Buffer = Buffer;
globalThis.process = process;

const isChromeOS =
  /\bCrOS\b/.test(navigator.userAgent) ||
  (navigator.userAgentData && navigator.userAgentData.platform === 'Chrome OS');
process.platform = isChromeOS ? 'cros' : 'linux';

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => {});
  });
}

// Defer renderer so polyfills are ready and avoid circular init in the bundle
import('../renderer.js').catch((err) => {
  console.error('Failed to start TimeFlow:', err);
  const loading = document.getElementById('loading-container');
  const login = document.getElementById('login-container');
  if (loading) loading.classList.add('hidden');
  if (login) login.classList.remove('hidden');
  const errEl = document.getElementById('error-message');
  if (errEl) {
    errEl.textContent = 'Failed to load the app. Please refresh the page.';
    errEl.style.color = '#ef4444';
  }
});
