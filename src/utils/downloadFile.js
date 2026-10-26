// <a download> is ignored for cross-origin URLs (media lives on the DO Spaces CDN),
// so fetch the file as a blob and save that. If the CDN blocks the request (CORS),
// fall back to opening the file in a new tab where it can be saved manually.
export async function downloadFile(url, filename) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const blob = await res.blob();
    const objectUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = objectUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(objectUrl);
  } catch {
    window.open(url, '_blank', 'noopener');
  }
}

/** File name for a download: "<base>.<ext of the source key>", e.g. "jane-doe-photo.jpg". */
export function downloadName(base, sourceKey, fallbackExt) {
  const ext = sourceKey?.split('?')[0].match(/\.([a-z0-9]+)$/i)?.[1] || fallbackExt;
  const slug = base.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'maid';
  return `${slug}.${ext}`;
}
