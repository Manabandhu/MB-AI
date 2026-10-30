import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';
import { AppIcon } from '@/modules/shared/ui/AppIcon';
import type { StepProps } from './types';

/** Step 2: Location */
export function LocationStep({ flow, styles, colors }: StepProps) {
  const {
    locating,
    detectLocation,
    metroLocation,
    setMetroLocation,
    universityCampus,
    setUniversityCampus,
    searchLocationQuery,
    setSearchLocationQuery,
    stepConfig,
  } = flow;
  return (
    <View style={styles.stepContainer}>
      {/* GPS Banner */}
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ busy: locating }}
        disabled={locating}
        onPress={detectLocation}
        style={styles.gpsBanner}
      >
        <View style={styles.gpsIconCircle}>
          <AppIcon color={colors.teal} name="compass" size={20} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.gpsBannerTitle}>Use current location</Text>
          <Text style={styles.gpsBannerSub}>
            {locating ? 'Finding your city…' : 'Detect your metro from this device'}
          </Text>
        </View>
        {locating ? (
          <ActivityIndicator color={colors.primary} />
        ) : (
          <AppIcon color={colors.muted} name="chevron-right" size={18} />
        )}
      </Pressable>

      {/* Search Bar */}
      <View style={styles.searchBar}>
        <AppIcon color={colors.muted} name="search" size={18} />
        <TextInput
          onChangeText={setSearchLocationQuery}
          placeholder="Search city, zip code, or neighborhood..."
          placeholderTextColor={colors.muted}
          style={styles.searchInput}
          value={searchLocationQuery}
        />
      </View>

      {/* Popular Diaspora Metro Hubs */}
      <Text style={styles.sectionHeader}>Key Diaspora Metro Hubs</Text>
      <View style={styles.metroGrid}>
        {stepConfig?.options
          .filter((opt) =>
            searchLocationQuery
              ? opt.label.toLowerCase().includes(searchLocationQuery.toLowerCase())
              : true,
          )
          .map((opt) => {
            const isSelected = metroLocation === opt.label || metroLocation === opt.optionKey;
            return (
              <Pressable
                key={opt.optionKey}
                onPress={() => setMetroLocation(opt.label)}
                style={[styles.metroCard, isSelected && styles.metroCardSelected]}
              >
                <View style={{ flex: 1 }}>
                  <Text
                    style={[styles.metroCardTitle, isSelected && styles.metroCardTitleSelected]}
                  >
                    {opt.label}
                  </Text>
                  {opt.description ? (
                    <Text style={styles.metroCardSub}>{opt.description}</Text>
                  ) : null}
                </View>
                {isSelected && (
                  <View style={styles.metroCheck}>
                    <AppIcon color={colors.surface} name="check" size={14} />
                  </View>
                )}
              </Pressable>
            );
          })}
      </View>

      {/* University Campus Input */}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>University or College Campus (Optional)</Text>
        <TextInput
          onChangeText={setUniversityCampus}
          placeholder="e.g. UT Dallas, UT Austin, San Jose State, UIC..."
          placeholderTextColor={colors.muted}
          style={styles.textInput}
          value={universityCampus}
        />
      </View>
    </View>
  );
}
