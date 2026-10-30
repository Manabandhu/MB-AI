import { YStack } from 'tamagui';
import { type LanguagePreference, supportedLanguages, useT } from '@/i18n';
import { AppText } from '@/modules/shared/ui/AppText';
import { SegmentedControl } from '@/modules/shared/ui/SegmentedControl';
import { useAppearanceStore } from '@/theme/themePreferenceStore';

/** Theme, animation level, and language. Saved on this device only. */
export function AppearanceSettings() {
  const t = useT();
  const theme = useAppearanceStore((s) => s.theme);
  const motion = useAppearanceStore((s) => s.motion);
  const language = useAppearanceStore((s) => s.language);
  const setTheme = useAppearanceStore((s) => s.setTheme);
  const setMotion = useAppearanceStore((s) => s.setMotion);
  const setLanguage = useAppearanceStore((s) => s.setLanguage);
  return (
    <YStack gap="$x4">
      <YStack gap="$x2">
        <AppText variant="label">{t('appearance.theme')}</AppText>
        <SegmentedControl
          label={t('appearance.theme')}
          onChange={setTheme}
          options={[
            { value: 'system', label: t('appearance.system'), icon: 'monitor' },
            { value: 'light', label: t('appearance.light'), icon: 'sun' },
            { value: 'dark', label: t('appearance.dark'), icon: 'moon' },
          ]}
          value={theme}
        />
      </YStack>
      <YStack gap="$x2">
        <AppText variant="label">{t('appearance.language')}</AppText>
        <SegmentedControl<LanguagePreference>
          label={t('appearance.language')}
          onChange={setLanguage}
          options={[
            { value: 'system', label: t('appearance.system') },
            ...supportedLanguages.map((l) => ({ value: l.code, label: l.label })),
          ]}
          value={language}
        />
      </YStack>
      <YStack gap="$x2">
        <AppText variant="label">{t('appearance.animations')}</AppText>
        <SegmentedControl
          label={t('appearance.animations')}
          onChange={setMotion}
          options={[
            { value: 'full', label: t('appearance.full') },
            { value: 'reduced', label: t('appearance.reduced') },
            { value: 'off', label: t('appearance.off') },
          ]}
          value={motion}
        />
        <AppText tone="muted" variant="caption">
          {t('appearance.motionNote')}
        </AppText>
      </YStack>
    </YStack>
  );
}
