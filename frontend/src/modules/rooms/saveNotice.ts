/** Fixed notices shown on My listings after saving; the URL carries only the code, never display text. */
export const ROOM_SAVE_NOTICES = {
  'saved-visible': 'Changes saved. Your room is visible in search.',
  published: 'Published: your room is visible in search.',
  draft: 'Saved as draft. Publish it to make it visible.',
  saved: 'Changes saved.',
} as const;

export type RoomSaveNotice = keyof typeof ROOM_SAVE_NOTICES;

export function roomSaveNoticeText(code: unknown): string | null {
  return typeof code === 'string' && Object.hasOwn(ROOM_SAVE_NOTICES, code)
    ? ROOM_SAVE_NOTICES[code as RoomSaveNotice]
    : null;
}
