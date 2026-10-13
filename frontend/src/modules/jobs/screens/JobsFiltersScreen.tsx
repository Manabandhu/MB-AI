import { type Href, router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { AppButton } from '@/modules/shared/ui/AppButton';
import { Card } from '@/modules/shared/ui/Card';
import { Screen } from '@/modules/shared/ui/Screen';
import { ScreenHeader } from '@/modules/shared/ui/ScreenHeader';
import { SegmentedControl } from '@/modules/shared/ui/SegmentedControl';
import { TextField } from '@/modules/shared/ui/TextField';

export function JobsFiltersScreen() {
  const params = useLocalSearchParams<{
    keyword?: string;
    location?: string;
    workModel?: string;
  }>();
  const [keyword, setKeyword] = useState(params.keyword ?? '');
  const [location, setLocation] = useState(params.location ?? '');
  const [workModel, setWorkModel] = useState(params.workModel === 'remote' ? 'remote' : 'all');
  const apply = () => {
    const query = new URLSearchParams({
      keyword: keyword.trim(),
      location: location.trim(),
      workModel,
    });
    router.replace(`/jobs/search?${query.toString()}` as Href);
  };
  return (
    <Screen maxWidth="form" keyboardAvoiding>
      <ScreenHeader
        title="Find the right fit"
        subtitle="A few filters to narrow your next opportunity."
        back={{ fallback: '/jobs' }}
      />
      <Card gap="$x5">
        <TextField
          label="Role or company"
          placeholder="Software engineer, product designer…"
          leadingIcon="briefcase"
          value={keyword}
          onChangeText={setKeyword}
        />
        <TextField
          label="Location"
          placeholder="City, state, or region"
          leadingIcon="map-pin"
          value={location}
          onChangeText={setLocation}
        />
        <SegmentedControl
          label="Work location"
          value={workModel}
          onChange={setWorkModel}
          options={[
            { value: 'all', label: 'Any location' },
            { value: 'remote', label: 'Remote only' },
          ]}
        />
      </Card>
      <AppButton label="Show matching jobs" iconAfter="arrow-right" onPress={apply} fullWidth />
      <AppButton
        label="Clear filters"
        variant="ghost"
        onPress={() => {
          setKeyword('');
          setLocation('');
          setWorkModel('all');
        }}
      />
    </Screen>
  );
}
