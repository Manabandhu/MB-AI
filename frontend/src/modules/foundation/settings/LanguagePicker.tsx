import { useState } from 'react';
import { XStack, YStack } from 'tamagui';
import i18n, { type LanguagePreference, resolveLanguage, supportedLanguages, useT } from '@/i18n';
import { AppButton } from '@/modules/shared/ui/AppButton';
import { AppIcon } from '@/modules/shared/ui/AppIcon';
import { AppText } from '@/modules/shared/ui/AppText';
import { BottomSheet } from '@/modules/shared/ui/BottomSheet';
import { Card } from '@/modules/shared/ui/Card';
import { useAppearanceStore } from '@/theme/themePreferenceStore';

export function LanguagePicker() {
  const t = useT();
  const preference = useAppearanceStore((s) => s.language);
  const setLanguage = useAppearanceStore((s) => s.setLanguage);
  const [open, setOpen] = useState(false);
  const resolved = resolveLanguage(preference);
  const current = supportedLanguages.find((l) => l.code === resolved)?.label ?? 'English';
  const options = [
    { code: 'system' as const, label: t('appearance.system') },
    ...supportedLanguages,
  ];
  function choose(code: LanguagePreference) {
    setLanguage(code);
    i18n.changeLanguage(resolveLanguage(code));
  }
  return (
    <>
      <Card
        role="button"
        aria-label={t('languagePicker.label', { language: current })}
        onPress={() => setOpen(true)}
        minHeight={44}
        paddingHorizontal="$x3"
        paddingVertical="$x2"
        borderRadius="$pill"
        backgroundColor="$surface"
      >
        <XStack alignItems="center" gap="$x2">
          <AppIcon name="language" size={18} />
          <AppText variant="label" maxWidth={108} numberOfLines={1}>
            {current}
          </AppText>
          <AppIcon name="chevron-down" size={14} />
        </XStack>
      </Card>
      <BottomSheet
        visible={open}
        onClose={() => setOpen(false)}
        title={t('languagePicker.title')}
        scrollable
      >
        <YStack role="radiogroup" aria-label={t('languagePicker.title')} gap="$x2">
          {options.map((option) => (
            <Card
              key={option.code}
              role="radio"
              aria-label={option.label}
              aria-checked={preference === option.code}
              onPress={() => choose(option.code)}
              padding="$x4"
              minHeight={52}
              backgroundColor={preference === option.code ? '$primaryTint' : '$surface'}
            >
              <XStack alignItems="center" gap="$x3">
                <AppText flex={1} variant="bodyStrong" letterSpacing={0}>
                  {option.label}
                </AppText>
                {preference === option.code ? <AppIcon name="check" size={20} /> : null}
              </XStack>
            </Card>
          ))}
        </YStack>
        <AppText tone="muted" variant="caption" marginVertical="$x4">
          {t('languagePicker.note')}
        </AppText>
        <AppButton label={t('languagePicker.close')} onPress={() => setOpen(false)} fullWidth />
      </BottomSheet>
    </>
  );
}
