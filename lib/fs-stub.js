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

export const statSync = (p) => {
  const d = memoryFiles.get(p);
  if (!d) {
    const err = new Error(`ENOENT: no such file, stat '${p}'`);
    err.code = 'ENOENT';
    throw err;
  }
  return { size: d.length, isFile: () => true };
};

