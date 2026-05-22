/**
 * Browser shim for Electron APIs used by TimeFlow renderer (Chromebook / PWA).
 */

const listeners = new Map();
let isTracking = false;
let lastUserActivityMs = Date.now();
let activityPollInterval = null;
let oauthPopup = null;

function emit(channel, ...args) {
  const handlers = listeners.get(channel) || [];
  handlers.forEach((fn) => {
    try {
      fn({}, ...args);
    } catch (e) {
      console.error(`[platform] listener error on ${channel}:`, e);
    }
  });
}

function trackUserActivity() {
  lastUserActivityMs = Date.now();
}

function startActivityTracking() {
  if (activityPollInterval) return;
  const events = ['mousedown', 'keydown', 'touchstart', 'pointerdown', 'wheel'];
  events.forEach((ev) => {
    document.addEventListener(ev, trackUserActivity, { capture: true, passive: true });
  });
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) trackUserActivity();
  });
  activityPollInterval = setInterval(() => {
    if (!isTracking) return;
    const idleSeconds = (Date.now() - lastUserActivityMs) / 1000;
    if (idleSeconds < 20) {
      emit('system-activity-detected', idleSeconds);
    }
  }, 10000);
}

function stopActivityTracking() {
  if (activityPollInterval) {
    clearInterval(activityPollInterval);
    activityPollInterval = null;
  }
}

function getOverlayElements() {
  return {
    modal: document.getElementById('idle-overlay-modal'),
    title: document.getElementById('overlay-title'),
    message: document.getElementById('overlay-message'),
    icon: document.getElementById('overlay-icon'),
    continueBtn: document.getElementById('overlay-continue-btn'),
    stopBtn: document.getElementById('overlay-stop-btn'),
  };
}

function showInAppOverlay(options = {}) {
  const { title, message, icon, isStopped = false } = options;
  const el = getOverlayElements();
  if (!el.modal) {
    console.warn('Idle overlay modal not found in DOM');
    return;
  }
  if (title && el.title) el.title.textContent = title;
  if (message && el.message) el.message.textContent = message;
  if (icon !== undefined && el.icon) el.icon.textContent = icon;
  if (el.continueBtn) {
    el.continueBtn.textContent = isStopped ? 'Start Tracking' : 'Continue';
  }
  if (el.stopBtn) {
    el.stopBtn.textContent = isStopped ? 'Close' : 'Stop Tracking';
  }
  el.modal.classList.remove('hidden');
}

function hideInAppOverlay() {
  const el = getOverlayElements();
  if (el.modal) el.modal.classList.add('hidden');
}

function setupOverlayButtons() {
  const el = getOverlayElements();
  if (!el.continueBtn || el.continueBtn.dataset.bound) return;
  el.continueBtn.dataset.bound = '1';
  el.continueBtn.addEventListener('click', () => emit('overlay-continue'));
  el.stopBtn.addEventListener('click', () => emit('overlay-stop'));
}

function setupOAuthListener() {
  window.addEventListener('message', (event) => {
    if (!event.data || event.data.type !== 'timeflow-oauth-callback') return;
    emit('azure-sso-callback', event.data.payload || {});
  });
  window.addEventListener('storage', (event) => {
    if (event.key !== 'timeflow-oauth-pending') return;
    try {
      const payload = JSON.parse(event.newValue || '{}');
      if (payload.access_token && payload.refresh_token) {
        emit('azure-sso-callback', payload);
        localStorage.removeItem('timeflow-oauth-pending');
      }
    } catch (_) {
      /* ignore */
    }
  });
}

function setupSystemEvents() {
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && isTracking) {
      emit('system-event', {
        type: 'tab-hidden',
        reason: 'TimeFlow tab was hidden or minimized',
      });
    }
  });
  window.addEventListener('pagehide', () => {
    if (isTracking) {
      emit('system-event', { type: 'app-quitting', reason: 'Page closing' });
    }
  });
}

export const ipcRenderer = {
  invoke(channel, ...args) {
    switch (channel) {
      case 'get-is-tracking':
        return Promise.resolve(isTracking);
      case 'set-is-tracking': {
        isTracking = !!args[0];
        if (isTracking) {
          trackUserActivity();
          startActivityTracking();
        } else {
          stopActivityTracking();
        }
        return Promise.resolve();
      }
      case 'get-system-idle-time': {
        const idle = (Date.now() - lastUserActivityMs) / 1000;
        return Promise.resolve(idle);
      }
      case 'check-screen-off':
        return Promise.resolve(document.hidden);
      case 'minimize-window':
        return Promise.resolve();
      case 'close-window':
        if (window.close) window.close();
        return Promise.resolve();
      case 'show-overlay':
        showInAppOverlay(args[0] || {});
        return Promise.resolve();
      case 'hide-overlay':
        hideInAppOverlay();
        return Promise.resolve();
      case 'close-overlay':
        hideInAppOverlay();
        return Promise.resolve();
      case 'get-desktop-sources':
        return Promise.resolve([]);
      case 'open-azure-sso-window': {
        const { redirectUrl } = args[0] || {};
        const callbackUrl = new URL('oauth-callback.html', window.location.href).href;
        const urlWithCallback = `${redirectUrl}${redirectUrl.includes('?') ? '&' : '?'}callback=${encodeURIComponent(callbackUrl)}`;
        oauthPopup = window.open(urlWithCallback, 'timeflow-sso', 'width=520,height=720');
        if (!oauthPopup) {
          window.location.href = urlWithCallback;
        }
        return Promise.resolve({ success: true, callbackUrl });
      }
      default:
        console.warn(`[platform] unhandled invoke: ${channel}`);
        return Promise.resolve(null);
    }
  },
  on(channel, listener) {
    if (!listeners.has(channel)) listeners.set(channel, []);
    listeners.get(channel).push(listener);
  },
  removeListener(channel, listener) {
    const list = listeners.get(channel);
    if (!list) return;
    const idx = list.indexOf(listener);
    if (idx >= 0) list.splice(idx, 1);
  },
  send() {
    /* not used in renderer */
  },
};

export const shell = {
  openExternal(url) {
    window.open(url, '_blank', 'noopener,noreferrer');
  },
};

setupOverlayButtons();
setupOAuthListener();
setupSystemEvents();

document.addEventListener('DOMContentLoaded', setupOverlayButtons);
