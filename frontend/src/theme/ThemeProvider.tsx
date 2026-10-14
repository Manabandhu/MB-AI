import { type ColorScheme, paletteFor } from '@manabandhu/design-system';
import { StatusBar } from 'expo-status-bar';
import { createContext, type ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import { AccessibilityInfo, Platform, useColorScheme } from 'react-native';
import { TamaguiProvider, Theme } from 'tamagui';
import { Uniwind } from 'uniwind';
import { applyLanguage } from '@/i18n';
import { resolveColorScheme, resolveMotion } from './preferences';
import config from './tamagui.config';
import { useAppearanceStore } from './themePreferenceStore';

type AppearanceContext = {
  scheme: ColorScheme;
  palette: ReturnType<typeof paletteFor>;
  /** True when animations should be skipped or shortened (user choice or OS reduced-motion). */
  reduceMotion: boolean;
  /** True only when the user allows decorative motion (3D, Lottie loops, parallax). */
  richMotion: boolean;
};

const Context = createContext<AppearanceContext>({
  scheme: 'light',
  palette: paletteFor('light'),
  reduceMotion: false,
  richMotion: true,
});

function useSystemReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((value) => mounted && setReduced(value))
      .catch(() => undefined);
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduced);
    return () => {
      mounted = false;
      sub.remove();
    };
  }, []);
  return reduced;
}

export function AppThemeProvider({ children }: { children: ReactNode }) {
  const system = useColorScheme();
  const themePreference = useAppearanceStore((s) => s.theme);
  const motionPreference = useAppearanceStore((s) => s.motion);
  const language = useAppearanceStore((s) => s.language);
  const systemReduced = useSystemReducedMotion();

  useEffect(() => {
    applyLanguage(language);
  }, [language]);
  const scheme = resolveColorScheme(themePreference, system);
  const motion = resolveMotion(motionPreference, systemReduced);

  // Screens still styled with Uniwind classes follow the same scheme until they move to Tamagui.
  useEffect(() => {
    Uniwind.setTheme(scheme);
    // Web: keep the page background (overscroll, gaps between frames) in step with an explicit theme choice.
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      document.documentElement.style.backgroundColor = paletteFor(scheme).background;
      document.body.style.backgroundColor = paletteFor(scheme).background;
    }
  }, [scheme]);

  const value = useMemo<AppearanceContext>(
    () => ({
      scheme,
      palette: paletteFor(scheme),
      reduceMotion: motion !== 'full',
      richMotion: motion === 'full',
    }),
    [scheme, motion],
  );

  return (
    <TamaguiProvider config={config} defaultTheme={scheme}>
      <Theme name={scheme}>
        <Context.Provider value={value}>
          <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
          {children}
        </Context.Provider>
      </Theme>
    </TamaguiProvider>
  );
}

/** Resolved colour scheme, palette, and motion flags for the current user. */
export function useAppearance() {
  return useContext(Context);
}
