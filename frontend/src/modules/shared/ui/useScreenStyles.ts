import type { palette as lightPalette } from '@manabandhu/design-system';
import { useMemo } from 'react';
import { useAppearance } from '@/theme/ThemeProvider';

export type ScreenPalette = { [Key in keyof typeof lightPalette]: string };

/** Legacy native layouts share the same live theme as Tamagui, without rebuilding styles on every keystroke. */
export function useScreenStyles<T>(factory: (palette: ScreenPalette) => T) {
  const { palette } = useAppearance();
  const styles = useMemo(() => factory(palette), [factory, palette]);
  return { styles, palette, color: palette };
}
