import { useState } from 'react';
import { YStack } from 'tamagui';
import { createReferralRequest } from '@/modules/referrals/api';
import { ReferralForm } from '@/modules/referrals/components/ReferralForm';
import { AppText } from '@/modules/shared/ui/AppText';
import { SegmentedControl } from '@/modules/shared/ui/SegmentedControl';
import { TextField } from '@/modules/shared/ui/TextField';

type Urgency = 'low' | 'medium' | 'high';

const URGENCY = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
] as const;

/** Ask the community for a referral (`POST /api/v1/referrals`). Title, category and urgency are required. */
export function RequestReferralScreen() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [urgency, setUrgency] = useState<Urgency>('medium');
  const [errors, setErrors] = useState<Record<string, string>>({});

  return (
    <ReferralForm
      onErrors={setErrors}
      submit={() =>
        createReferralRequest({
          title: title.trim(),
          description: description.trim(),
          category: category.trim(),
          urgency,
        })
      }
      submitLabel="Post request"
      subtitle="Members who can refer you will see this on the referrals board."
      title="Request a referral"
      validate={() => {
        const next: Record<string, string> = {};
        if (!title.trim()) next.title = 'Say what you need.';
        if (!category.trim()) next.category = 'Add a category, e.g. Tech or Legal.';
        return next;
      }}
    >
      <TextField
        error={errors.title}
        label="What do you need?"
        maxLength={200}
        onChangeText={setTitle}
        placeholder="e.g. Referral for a data analyst role at Acme"
        value={title}
      />
      <TextField
        error={errors.category}
        label="Category"
        maxLength={100}
        onChangeText={setCategory}
        placeholder="e.g. Tech, Healthcare, Legal"
        value={category}
      />
      <TextField
        label="Details (optional)"
        maxLength={4000}
        multiline
        numberOfLines={4}
        onChangeText={setDescription}
        placeholder="Your background and the role you're targeting"
        textAlignVertical="top"
        value={description}
      />
      <YStack gap="$x1">
        <AppText variant="label">Urgency</AppText>
        <SegmentedControl
          label="Urgency"
          onChange={(value: Urgency) => setUrgency(value)}
          options={URGENCY}
          value={urgency}
        />
      </YStack>
    </ReferralForm>
  );
}
