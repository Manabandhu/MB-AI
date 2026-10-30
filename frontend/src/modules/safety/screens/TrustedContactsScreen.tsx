import { formatDate } from '@manabandhu/core';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Href } from 'expo-router';
import { useState } from 'react';
import { Linking } from 'react-native';
import { XStack, YStack } from 'tamagui';
import { createTrustedContact, getTrustedContacts } from '@/modules/safety/api';
import { telHref, trustedContactErrors } from '@/modules/safety/utils/safetyFormat';
import { AppButton } from '@/modules/shared/ui/AppButton';
import { AppText } from '@/modules/shared/ui/AppText';
import { BottomSheet } from '@/modules/shared/ui/BottomSheet';
import { EmptyState } from '@/modules/shared/ui/EmptyState';
import { ErrorState } from '@/modules/shared/ui/ErrorState';
import { LoadingState } from '@/modules/shared/ui/LoadingState';
import { showError } from '@/modules/shared/ui/notify';
import { PersonRow } from '@/modules/shared/ui/PersonRow';
import { Screen } from '@/modules/shared/ui/Screen';
import { ScreenHeader } from '@/modules/shared/ui/ScreenHeader';
import { TextField } from '@/modules/shared/ui/TextField';

const open = async (url: string, what: string) => {
  try {
    await Linking.openURL(url);
  } catch (error) {
    showError(`Could not open ${what}`, error);
  }
};

function AddContactSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [relationship, setRelationship] = useState('');
  const [touched, setTouched] = useState(false);
  const errors = touched ? trustedContactErrors({ name, phone, email }) : {};

  const reset = () => {
    setName('');
    setPhone('');
    setEmail('');
    setRelationship('');
    setTouched(false);
  };

  const add = useMutation({
    mutationFn: () =>
      createTrustedContact({
        name: name.trim(),
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        relationship: relationship.trim() || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['safety'] });
      reset();
      onClose();
    },
  });

  const submit = () => {
    setTouched(true);
    if (Object.keys(trustedContactErrors({ name, phone, email })).length > 0) return;
    add.mutate();
  };

  return (
    <BottomSheet
      onClose={onClose}
      scrollable
      subtitle="Saved to your account only. ManaBandhu does not contact them for you."
      title="Add a trusted contact"
      visible={visible}
    >
      <YStack gap="$x3">
        <TextField
          autoComplete="name"
          error={errors.name}
          label="Name"
          maxLength={120}
          onChangeText={setName}
          value={name}
        />
        <TextField
          autoComplete="tel"
          error={errors.phone}
          keyboardType="phone-pad"
          label="Phone"
          maxLength={20}
          onChangeText={setPhone}
          placeholder="+1 555 123 4567"
          value={phone}
        />
        <TextField
          autoCapitalize="none"
          autoComplete="email"
          error={errors.email}
          keyboardType="email-address"
          label="Email"
          maxLength={200}
          onChangeText={setEmail}
          value={email}
        />
        <TextField
          helper="Optional, e.g. sister, roommate"
          label="Relationship"
          maxLength={120}
          onChangeText={setRelationship}
          value={relationship}
        />
        {add.isError ? (
          <AppText role="alert" tone="danger" variant="caption">
            {add.error instanceof Error ? add.error.message : 'Could not add the contact.'} Please
            try again.
          </AppText>
        ) : null}
        <AppButton
          fullWidth
          label="Save contact"
          loading={add.isPending}
          onPress={submit}
          size="lg"
        />
      </YStack>
    </BottomSheet>
  );
}

/**
 * People you would call in an emergency, with one-tap call and email. Contacts can be added; editing and removing
 * are not available until the backend has endpoints for them.
 */
export function TrustedContactsScreen() {
  const [adding, setAdding] = useState(false);
  const contacts = useQuery({
    queryKey: ['safety', 'trusted-contacts'],
    queryFn: getTrustedContacts,
  });

  const body = () => {
    if (contacts.isLoading) return <LoadingState count={3} variant="skeleton" />;
    if (contacts.isError) {
      return (
        <ErrorState
          body="Check your connection and try again."
          onRetry={() => contacts.refetch()}
          retryLabel="Retry"
          title="Unable to load trusted contacts"
        />
      );
    }
    const data = contacts.data ?? [];
    if (data.length === 0) {
      return (
        <EmptyState
          actionLabel="Add a contact"
          body="Add family or friends you would call in an emergency so their details are one tap away."
          iconName="shield"
          onAction={() => setAdding(true)}
          title="No trusted contacts"
        />
      );
    }
    return (
      <YStack gap="$x2">
        {data.map((item) => (
          <PersonRow
            detail={
              item.phone || item.email ? (
                <XStack flexWrap="wrap" gap="$x2">
                  {item.phone ? (
                    <AppButton
                      icon="phone"
                      label={`Call ${item.phone}`}
                      onPress={() => void open(telHref(item.phone ?? ''), 'the phone app')}
                      size="sm"
                      variant="secondary"
                    />
                  ) : null}
                  {item.email ? (
                    <AppButton
                      icon="mail"
                      label={item.email}
                      onPress={() => void open(`mailto:${item.email}`, 'your email app')}
                      size="sm"
                      variant="ghost"
                    />
                  ) : null}
                </XStack>
              ) : undefined
            }
            key={item.id}
            name={item.name}
            subtitle={[item.relationship, `added ${formatDate(item.createdAt, 'short')}`]
              .filter(Boolean)
              .join(' · ')}
          />
        ))}
      </YStack>
    );
  };

  return (
    <Screen onRefresh={() => contacts.refetch()} refreshing={contacts.isRefetching}>
      <ScreenHeader
        back={{ fallback: '/safety' as Href }}
        primaryAction={{ label: 'Add', icon: 'plus', onPress: () => setAdding(true) }}
        subtitle="People you would call in an emergency."
        title="Trusted contacts"
      />
      {body()}
      <AddContactSheet onClose={() => setAdding(false)} visible={adding} />
    </Screen>
  );
}
