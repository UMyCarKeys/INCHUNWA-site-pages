/**
 * Prepend the Astro base path to a URL.
 * Handles both development (base = "/") and GitHub Pages (base = "/INCHUNWA-site-pages").
 */
export function url(path: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  if (cleanPath === '/') return `${base}/`;
  return `${base}${cleanPath}`;
}
