/**
 * True if the string is a DekuDeals catalog item URL (with or without scheme).
 */
export function isDekuItemUrl(raw: string): boolean {
  const s = raw.trim();
  if (!s) return false;
  try {
    const href = /^https?:\/\//i.test(s) ? s : `https://${s}`;
    const u = new URL(href);
    const host = u.hostname.toLowerCase();
    if (host !== 'dekudeals.com' && host !== 'www.dekudeals.com') return false;
    return u.pathname.toLowerCase().includes('/items/');
  } catch {
    return false;
  }
}
