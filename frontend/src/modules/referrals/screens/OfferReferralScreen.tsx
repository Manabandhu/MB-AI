import { useState } from 'react';
import { createReferralOffer } from '@/modules/referrals/api';
import { ReferralForm } from '@/modules/referrals/components/ReferralForm';
import { TextField } from '@/modules/shared/ui/TextField';

/** Offer to refer others (`POST /api/v1/referrals/offer`). Title and service type are required by the server. */
export function OfferReferralScreen() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [serviceType, setServiceType] = useState('');
  const [availability, setAvailability] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  return (
    <ReferralForm
      onErrors={setErrors}
      submit={() =>
        createReferralOffer({
          title: title.trim(),
          description: description.trim(),
          serviceType: serviceType.trim(),
          availability: availability.trim() || undefined,
        })
      }
      submitLabel="Post offer"
      subtitle="Offer a referral at your company or in your field. Referrals here are always free."
      title="Offer a referral"
      validate={() => {
        const next: Record<string, string> = {};
        if (!title.trim()) next.title = 'Say what you can refer for.';
        if (!serviceType.trim())
          next.serviceType = 'Add the field or company, e.g. Tech or Google.';
        return next;
      }}
    >
      <TextField
        error={errors.title}
        label="What can you refer for?"
        maxLength={200}
        onChangeText={setTitle}
        placeholder="e.g. Software engineering roles at Acme"
        value={title}
      />
      <TextField
        error={errors.serviceType}
        label="Field or company"
        maxLength={100}
        onChangeText={setServiceType}
        placeholder="e.g. Tech, Healthcare, Acme Corp"
        value={serviceType}
      />
      <TextField
        label="Details (optional)"
        maxLength={4000}
        multiline
        numberOfLines={4}
        onChangeText={setDescription}
        placeholder="Roles, levels, and what you need from candidates"
        textAlignVertical="top"
        value={description}
      />
      <TextField
        label="Availability (optional)"
        maxLength={4000}
        onChangeText={setAvailability}
        placeholder="e.g. Weekday evenings, 2 referrals a month"
        value={availability}
      />
    </ReferralForm>
  );
}
