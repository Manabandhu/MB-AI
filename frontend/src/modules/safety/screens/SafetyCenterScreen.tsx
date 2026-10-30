import { useQuery } from '@tanstack/react-query';
import type { Href } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Animated, Linking, Platform } from 'react-native';
import { XStack, YStack } from 'tamagui';
import {
  getBlockedUsers,
  getReports,
  getTrustedContacts,
  isOpenReport,
} from '@/modules/safety/api';
import { AppButton } from '@/modules/shared/ui/AppButton';
import { AppIcon, type AppIconName } from '@/modules/shared/ui/AppIcon';
import { AppText } from '@/modules/shared/ui/AppText';
import { Card } from '@/modules/shared/ui/Card';
import { ErrorState } from '@/modules/shared/ui/ErrorState';
import { LoadingState } from '@/modules/shared/ui/LoadingState';
import { showError } from '@/modules/shared/ui/notify';
import { Screen } from '@/modules/shared/ui/Screen';
import { ScreenHeader } from '@/modules/shared/ui/ScreenHeader';
import { Section } from '@/modules/shared/ui/Section';
import { useAppearance } from '@/theme/ThemeProvider';

const TOOLS: { icon: AppIconName; title: string; subtitle: string; route: Href }[] = [
  {
    icon: 'shield',
    title: 'Trusted contacts',
    subtitle: 'Keep the people you would call in an emergency in one place',
    route: '/safety/trusted-contacts' as Href,
  },
  {
    icon: 'warning',
    title: 'Safety reports',
    subtitle: 'File a report and follow the status of the ones you sent',
    route: '/safety/reports' as Href,
  },
  {
    icon: 'eye-closed',
    title: 'Blocked users',
    subtitle: 'Review the members you blocked and unblock them',
    route: '/safety/blocked-users' as Href,
  },
];

const call = async (number: string) => {
  try {
    await Linking.openURL(`tel:${number}`);
  } catch (error) {
    showError(`Could not call ${number}`, error, `Dial ${number} from your phone.`);
  }
};

/** Pulsing halo behind the emergency icon; static when the person prefers reduced motion. */
function EmergencyIcon() {
  const { reduceMotion, palette } = useAppearance();
  const pulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (reduceMotion) {
      pulse.setValue(1);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.25,
          duration: 800,
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 800,
          useNativeDriver: Platform.OS !== 'web',
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse, reduceMotion]);
  return (
    <YStack alignItems="center" height={48} justifyContent="center" width={48}>
      {reduceMotion ? null : (
        <Animated.View
          style={{
            position: 'absolute',
            width: 48,
            height: 48,
            borderRadius: 24,
            backgroundColor: palette.error,
            transform: [{ scale: pulse }],
            opacity: pulse.interpolate({ inputRange: [1, 1.25], outputRange: [0.35, 0] }),
          }}
        />
      )}
      <YStack
        alignItems="center"
        backgroundColor="$error"
        borderRadius="$pill"
        height={40}
        justifyContent="center"
        width={40}
      >
        <AppIcon color={palette.surface} name="warning" size={20} />
      </YStack>
    </YStack>
  );
}

/** Emergency numbers, the member's own safety counts, and links to their safety tools. */
export function SafetyCenterScreen() {
  // Counts come from the caller's own lists; nothing is shown until they load, and a failure shows an error.
  const reports = useQuery({ queryKey: ['safety', 'reports'], queryFn: getReports });
  const blockedUsers = useQuery({
    queryKey: ['safety', 'blocked-users'],
    queryFn: getBlockedUsers,
  });
  const trustedContacts = useQuery({
    queryKey: ['safety', 'trusted-contacts'],
    queryFn: getTrustedContacts,
  });
  const refetchAll = () => {
    reports.refetch();
    blockedUsers.refetch();
    trustedContacts.refetch();
  };

  const metricsLoading = reports.isLoading || blockedUsers.isLoading || trustedContacts.isLoading;
  const metricsError = reports.isError || blockedUsers.isError || trustedContacts.isError;
  const metrics =
    reports.data && blockedUsers.data && trustedContacts.data
      ? [
          { label: 'Open reports', value: reports.data.filter(isOpenReport).length },
          { label: 'Blocked users', value: blockedUsers.data.length },
          { label: 'Trusted contacts', value: trustedContacts.data.length },
        ]
      : [];

  return (
    <Screen
      onRefresh={refetchAll}
      refreshing={reports.isRefetching || blockedUsers.isRefetching || trustedContacts.isRefetching}
    >
      <ScreenHeader
        back={{ fallback: '/' as Href }}
        subtitle="Community trust and care"
        title="Safety Center"
      />

      <Card backgroundColor="$errorBg" borderColor="$error" gap="$x3">
        <XStack alignItems="center" gap="$x3">
          <EmergencyIcon />
          <YStack flex={1} gap={2}>
            <AppText role="heading" variant="h4">
              In an immediate emergency?
            </AppText>
            <AppText variant="body">
              Call 911 for police, fire, or ambulance. Call or text 988 for the Suicide & Crisis
              Lifeline.
            </AppText>
          </YStack>
        </XStack>
        <XStack flexWrap="wrap" gap="$x2">
          <YStack flexBasis={160} flexGrow={1}>
            <AppButton
              fullWidth
              icon="phone"
              label="Call 911"
              onPress={() => void call('911')}
              size="lg"
              variant="danger"
            />
          </YStack>
          <YStack flexBasis={160} flexGrow={1}>
            <AppButton
              fullWidth
              icon="phone"
              label="Call 988"
              onPress={() => void call('988')}
              size="lg"
              variant="secondary"
            />
          </YStack>
        </XStack>
      </Card>

      {metricsLoading ? (
        <LoadingState label="Loading your safety summary…" />
      ) : metricsError ? (
        <ErrorState
          body="Your reports, blocked users, and trusted contacts could not be loaded."
          onRetry={refetchAll}
          retryLabel="Retry"
          title="Unable to load your safety summary"
        />
      ) : (
        <XStack gap="$x3">
          {metrics.map((m) => (
            <Card flex={1} key={m.label} variant="filled">
              <AppText variant="h3">{m.value}</AppText>
              <AppText tone="muted" variant="caption">
                {m.label}
              </AppText>
            </Card>
          ))}
        </XStack>
      )}

      <Section title="Safety tools">
        <YStack gap="$x2">
          {TOOLS.map((tool) => (
            <Card aria-label={tool.title} href={tool.route} key={tool.title}>
              <XStack alignItems="center" gap="$x3">
                <YStack
                  alignItems="center"
                  backgroundColor="$primaryTint"
                  borderRadius="$pill"
                  height={44}
                  justifyContent="center"
                  width={44}
                >
                  <AppIcon name={tool.icon} size={22} />
                </YStack>
                <YStack flex={1} gap={2}>
                  <AppText variant="bodyStrong">{tool.title}</AppText>
                  <AppText tone="muted" variant="caption">
                    {tool.subtitle}
                  </AppText>
                </YStack>
                <AppIcon name="chevron-right" size={18} />
              </XStack>
            </Card>
          ))}
        </YStack>
      </Section>

      <Section title="How ManaBandhu keeps members safe">
        <Card gap="$x3">
          <YStack gap={2}>
            <AppText variant="bodyStrong">Signed-in members only</AppText>
            <AppText tone="muted" variant="body">
              Rooms, rides, and referrals can only be posted by signed-in members.
            </AppText>
          </YStack>
          <YStack gap={2}>
            <AppText variant="bodyStrong">Report concerns</AppText>
            <AppText tone="muted" variant="body">
              Report a member or a conversation from the chat details. Reports go to the ManaBandhu
              safety team, and you can follow their status under Safety reports.
            </AppText>
          </YStack>
          <YStack gap={2}>
            <AppText variant="bodyStrong">Meet safely</AppText>
            <AppText tone="muted" variant="body">
              Before a room visit or a ride, tell a trusted contact where you are going and when you
              expect to be back.
            </AppText>
          </YStack>
        </Card>
      </Section>
    </Screen>
  );
}
