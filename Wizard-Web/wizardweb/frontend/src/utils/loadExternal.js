// Utility to dynamically load external scripts/styles.
// For legacy assets from the Play backend (e.g., /assets/javascripts/menu.js),
// we prefix with BACKEND to avoid 404s on the Vite dev server when no proxy is used.

import { BACKEND } from '../api/client';

export function loadScript(src, { fromBackend = false, async = true, defer = true } = {}) {
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.async = async;
    s.defer = defer;
    s.src = fromBackend || src.startsWith('/assets/') || src.startsWith('/jsroutes')
      ? `${BACKEND}${src.startsWith('/') ? '' : '/'}${src}`
      : src;
    s.onload = () => resolve(s);
    s.onerror = (e) => reject(e);
    document.head.appendChild(s);
  });
}

export function loadStyle(href, { fromBackend = false } = {}) {
  return new Promise((resolve, reject) => {
    const l = document.createElement('link');
    l.rel = 'stylesheet';
    l.href = fromBackend || href.startsWith('/assets/')
      ? `${BACKEND}${href.startsWith('/') ? '' : '/'}${href}`
      : href;
    l.onload = () => resolve(l);
    l.onerror = (e) => reject(e);
    document.head.appendChild(l);
  });
}
