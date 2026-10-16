export const isEmail = (v = '') => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
export const minLength = (v = '', n) => v.length >= n;
