/**
 * Canvas-based sharp replacement for Chromebook.
 */
import { Buffer } from 'buffer';

function loadImageFromBuffer(buffer) {
  return new Promise((resolve, reject) => {
    const blob = new Blob([buffer], { type: 'image/png' });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };
    img.src = url;
  });
}

function createPipeline(buffer) {
  const state = { buffer, extract: null, resizeW: null, resizeH: null, resizeFit: null, grayscale: false };

  return {
    metadata: async () => {
      const img = await loadImageFromBuffer(state.buffer);
      return { width: img.naturalWidth, height: img.naturalHeight, channels: 4 };
    },
    extract(region) {
      state.extract = region;
      return this;
    },
    resize(w, h, opts = {}) {
      state.resizeW = w;
      state.resizeH = h;
      state.resizeFit = opts.fit || null;
      state.withoutEnlargement = opts.withoutEnlargement;
      return this;
    },
    grayscale() {
      state.grayscale = true;
      return this;
    },
    raw() {
      return {
        toBuffer: async (opts) => {
          const img = await loadImageFromBuffer(state.buffer);
          let sx = 0;
          let sy = 0;
          let sw = img.naturalWidth;
          let sh = img.naturalHeight;
          if (state.extract) {
            sx = state.extract.left;
            sy = state.extract.top;
            sw = state.extract.width;
            sh = state.extract.height;
          }
          let dw = state.resizeW || sw;
          let dh = state.resizeH;
          if (!dh && dw) dh = Math.max(10, Math.round((sh / sw) * dw));
          if (state.resizeFit === 'inside') {
            const scale = Math.min(dw / sw, (dh || dw) / sh, 1);
            dw = Math.max(1, Math.round(sw * scale));
            dh = Math.max(1, Math.round(sh * scale));
          }
          const canvas = document.createElement('canvas');
          canvas.width = dw;
          canvas.height = dh;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, sx, sy, sw, sh, 0, 0, dw, dh);
          const imageData = ctx.getImageData(0, 0, dw, dh);
          if (opts && opts.resolveWithObject) {
            return { data: imageData.data, info: { channels: 4, width: dw, height: dh } };
          }
          if (state.grayscale) {
            const gray = Buffer.alloc(dw * dh);
            for (let i = 0, j = 0; i < imageData.data.length; i += 4, j++) {
              const r = imageData.data[i];
              const g = imageData.data[i + 1];
              const b = imageData.data[i + 2];
              gray[j] = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
            }
            return gray;
          }
          return Buffer.from(imageData.data);
        },
      };
    },
  };
}

export default function sharp(buffer) {
  return createPipeline(buffer);
}
