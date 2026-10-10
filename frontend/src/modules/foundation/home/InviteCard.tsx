import { useState } from 'react';
import { XStack, YStack } from 'tamagui';
import { useT } from '@/i18n';
import { shareLink } from '@/lib/share';
import { AppButton } from '@/modules/shared/ui/AppButton';
import { AppText } from '@/modules/shared/ui/AppText';
import { BrandMark } from '@/modules/shared/ui/BrandLogo';
import { Card } from '@/modules/shared/ui/Card';

/** Lets members share the app through any messenger (WhatsApp, SMS, …) via the system share sheet. */
export function InviteCard() {
  const t = useT();
  const [status, setStatus] = useState<'idle' | 'copied'>('idle');
  return (
    <Card variant="tinted">
      <XStack alignItems="center" flexWrap="wrap" gap="$x4">
        <BrandMark size={48} />
        <YStack flex={1} gap="$x1" minWidth={200}>
          <AppText variant="bodyStrong">{t('home.invite')}</AppText>
          <AppText tone="muted" variant="caption">
            {t('home.inviteMessage')}
          </AppText>
        </YStack>
        <AppButton
          icon="share"
          label={status === 'copied' ? t('home.linkCopied') : t('home.invite')}
          onPress={async () => {
            const result = await shareLink('/welcome', t('home.inviteMessage'));
            setStatus(result === 'copied' ? 'copied' : 'idle');
          }}
          size="sm"
        />
      </XStack>
    </Card>
  );
}
