/**
 * Minimal fs stub — uploads use in-memory buffers on Chromebook.
 */
const memoryFiles = new Map();

export const existsSync = (p) => memoryFiles.has(p);
export const writeFileSync = (p, data) => memoryFiles.set(p, data);
export const readFileSync = (p) => {
  const d = memoryFiles.get(p);
  if (!d) throw new Error(`ENOENT: ${p}`);
  return d;
};
export const unlinkSync = (p) => memoryFiles.delete(p);

export default {
  existsSync,
  writeFileSync,
  readFileSync,
  unlinkSync,
};
