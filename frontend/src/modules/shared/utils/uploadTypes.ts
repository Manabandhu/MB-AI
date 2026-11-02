const ALLOWED = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/gif']);

/** The type the server accepts for a picked image, or null when it is not a supported image. */
export function uploadContentType(mimeType: string | null | undefined, uri: string): string | null {
  const type = (mimeType ?? '').toLowerCase();
  if (ALLOWED.has(type)) return type;
  if (type === 'image/jpg') return 'image/jpeg';
  const extension = uri.split('?')[0].split('.').pop()?.toLowerCase();
  const byExtension: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
    heic: 'image/heic',
    gif: 'image/gif',
  };
  return (extension && byExtension[extension]) || null;
}
