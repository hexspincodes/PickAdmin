// Backend stores DO Spaces object keys (e.g. "videos/2026-10-01/abc.mp4"),
// not full URLs — prefix them with the Spaces CDN base to display.
const MEDIA_BASE_URL = (
  import.meta.env.VITE_MEDIA_BASE_URL || 'https://pickmymaidbucket.sfo3.cdn.digitaloceanspaces.com'
).replace(/\/$/, '');

export function mediaUrl(key) {
  if (!key) return '';
  if (/^https?:\/\//.test(key)) return key;
  return `${MEDIA_BASE_URL}/${key.replace(/^\//, '')}`;
}
