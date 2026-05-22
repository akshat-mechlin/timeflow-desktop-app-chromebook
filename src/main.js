import '../styles.css';
import { Buffer } from 'buffer';
import process from 'process/browser';

globalThis.Buffer = Buffer;
globalThis.process = process;

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => {});
  });
}

import '../renderer.js';
