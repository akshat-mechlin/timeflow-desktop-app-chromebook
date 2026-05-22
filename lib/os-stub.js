/** Chrome OS / browser platform stub */
const isChromeOS =
  /\bCrOS\b/.test(navigator.userAgent) ||
  (navigator.userAgentData && navigator.userAgentData.platform === 'Chrome OS');

export const platform = isChromeOS ? 'cros' : 'linux';
export const tmpdir = () => '/tmp';

export default { platform, tmpdir };
