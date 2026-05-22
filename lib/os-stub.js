/** Chrome OS / browser platform stub (matches Node os.platform() API). */
const isChromeOS =
  /\bCrOS\b/.test(navigator.userAgent) ||
  (navigator.userAgentData && navigator.userAgentData.platform === 'Chrome OS');

export function platform() {
  return isChromeOS ? 'cros' : 'linux';
}

export function tmpdir() {
  return '/tmp';
}
