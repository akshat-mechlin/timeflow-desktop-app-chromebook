/**
 * Screen capture for Chromebook via getDisplayMedia (replaces screenshot-desktop).
 */

let cachedStream = null;

function getBuffer() {
  if (!globalThis.Buffer) {
    throw new Error('Buffer polyfill not loaded');
  }
  return globalThis.Buffer;
}

async function captureFrameFromStream(stream) {
  const video = document.createElement('video');
  video.srcObject = stream;
  video.muted = true;
  video.playsInline = true;
  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Screen capture timeout')), 15000);
    video.onloadedmetadata = () => {
      clearTimeout(timeout);
      video.play().then(resolve).catch(reject);
    };
    video.onerror = () => {
      clearTimeout(timeout);
      reject(new Error('Screen capture video error'));
    };
  });
  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth || 1280;
  canvas.height = video.videoHeight || 720;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  const dataUrl = canvas.toDataURL('image/png');
  const base64 = dataUrl.replace(/^data:image\/png;base64,/, '');
  return getBuffer().from(base64, 'base64');
}

async function getDisplayStream() {
  if (cachedStream && cachedStream.active) {
    const tracks = cachedStream.getVideoTracks();
    if (tracks.length && tracks[0].readyState === 'live') {
      return cachedStream;
    }
  }
  cachedStream = await navigator.mediaDevices.getDisplayMedia({
    video: { displaySurface: 'monitor' },
    audio: false,
    preferCurrentTab: false,
  });
  cachedStream.getVideoTracks().forEach((track) => {
    track.addEventListener('ended', () => {
      cachedStream = null;
    });
  });
  return cachedStream;
}

async function capture(options = {}) {
  const stream = await getDisplayStream();
  return captureFrameFromStream(stream);
}

capture.listDisplays = async () => [{ id: 0, name: 'Screen' }];

export default capture;
