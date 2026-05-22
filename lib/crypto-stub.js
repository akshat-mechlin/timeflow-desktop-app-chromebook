import { sha256 } from 'js-sha256';
import { Buffer } from 'buffer';

export function createHash(algo) {
  if (algo !== 'sha256') throw new Error(`Unsupported hash: ${algo}`);
  const hasher = sha256.create();
  return {
    update(chunk) {
      hasher.update(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      return this;
    },
    digest(encoding) {
      if (encoding === 'hex') return hasher.hex();
      throw new Error(`Unsupported encoding: ${encoding}`);
    },
  };
}

export default { createHash };
