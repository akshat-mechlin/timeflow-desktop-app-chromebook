export function join(...parts) {
  return parts.filter(Boolean).join('/').replace(/\/+/g, '/');
}

export const dirname = (p) => {
  const i = p.lastIndexOf('/');
  return i >= 0 ? p.slice(0, i) : '.';
};

export default { join, dirname };
