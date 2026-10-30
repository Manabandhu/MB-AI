import { useCallback, useEffect, useRef, useState } from 'react';

/** How long a success notice stays before it clears itself. */
export const NOTICE_MS = 6000;

export type TimedNotice = {
  text: string;
  /** Which control the notice belongs to, so it renders beside that action. */
  anchor: string;
  /** Optional follow-up link, e.g. the new ride after "Repeat trip". */
  href?: string;
  hrefLabel?: string;
};

/**
 * A short-lived confirmation shown next to the action that caused it. It clears after `NOTICE_MS`, when a new
 * notice replaces it, or when `clear` is called. Failures are not notices: they go through `showError`.
 */
export function useTimedNotice(duration = NOTICE_MS) {
  const [notice, setNotice] = useState<TimedNotice | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clear = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    setNotice(null);
  }, []);

  const show = useCallback(
    (next: TimedNotice) => {
      if (timer.current) clearTimeout(timer.current);
      setNotice(next);
      timer.current = setTimeout(() => {
        timer.current = null;
        setNotice(null);
      }, duration);
    },
    [duration],
  );

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  /** The notice text when it belongs to `anchor`. */
  const at = useCallback((anchor: string) => (notice?.anchor === anchor ? notice : null), [notice]);

  return { notice, show, clear, at };
}
