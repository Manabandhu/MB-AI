import { color as baseColors, radius, space } from '@manabandhu/design-system';
import { useMemo, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ALL_USA_LOCATION, type AppLocation, useLocationStore } from '@/lib/locationStore';
import { type SearchCityResult, searchAllUSCities } from '@/modules/rooms/utils/locationService';
import { AppIcon } from '@/modules/shared/ui/AppIcon';

const colors = {
  ...baseColors,
  appPrimary: '#431ebe',
  surfaceContainerLow: '#f2f3ff',
  teal: '#00696b',
};

interface LocationSelectorModalProps {
  visible: boolean;
  onClose: () => void;
}

export function LocationSelectorModal({ visible, onClose }: LocationSelectorModalProps) {
  const insets = useSafeAreaInsets();
  const [searchInput, setSearchInput] = useState('');
  const currentLocation = useLocationStore((s) => s.currentLocation);
  const detectedLocation = useLocationStore((s) => s.detectedLocation);
  const nearbyCities = useLocationStore((s) => s.nearbyCities);
  const isDetecting = useLocationStore((s) => s.isDetecting);
  const detectDeviceLocation = useLocationStore((s) => s.detectDeviceLocation);
  const setLocation = useLocationStore((s) => s.setLocation);

  const queryTrimmed = searchInput.trim();
  const hasThreeChars = queryTrimmed.length >= 3;

  const searchResults: SearchCityResult[] = useMemo(() => {
    if (!hasThreeChars) return [];
    return searchAllUSCities(queryTrimmed, 40);
  }, [queryTrimmed, hasThreeChars]);

  const handleSelect = (loc: AppLocation) => {
    setLocation(loc);
    setSearchInput('');
    onClose();
  };

  return (
    <Modal
      animationType="fade"
      transparent
      visible={visible}
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.backdrop}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

        <View
          style={[
            styles.sheet,
            {
              paddingBottom: Math.max(insets.bottom, 16),
            },
          ]}
        >
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={styles.headerLeft}>
              <View style={styles.pinBg}>
                <AppIcon color={colors.appPrimary} name="map" size={18} />
              </View>
              <View>
                <Text style={styles.sheetTitle}>Select Location</Text>
                <Text style={styles.sheetSubtitle}>
                  Applied across Rooms, Rides, Jobs & Community
                </Text>
              </View>
            </View>
            <Pressable
              accessibilityLabel="Close location picker"
              accessibilityRole="button"
              onPress={onClose}
              style={styles.closeBtn}
            >
              <Text style={{ fontSize: 16, color: colors.muted, fontWeight: '700' }}>✕</Text>
            </Pressable>
          </View>

          {/* Search Input Box */}
          <View style={styles.searchBar}>
            <AppIcon color={colors.muted} name="search" size={18} />
            <TextInput
              autoFocus
              clearButtonMode="while-editing"
              onChangeText={setSearchInput}
              placeholder="Search any US city (e.g. Coppell, Frisco, Jonesboro)..."
              placeholderTextColor={colors.muted}
              style={styles.searchInput}
              value={searchInput}
            />
            {searchInput.length > 0 && (
              <Pressable
                accessibilityLabel="Clear search"
                accessibilityRole="button"
                onPress={() => setSearchInput('')}
                style={styles.clearBtn}
              >
                <Text style={{ fontSize: 14, color: colors.muted, fontWeight: '700' }}>✕</Text>
              </Pressable>
            )}
          </View>

          {/* Results or Popular Metros */}
          <View style={styles.contentContainer}>
            {hasThreeChars ? (
              searchResults.length > 0 ? (
                <FlatList
                  data={searchResults}
                  keyboardShouldPersistTaps="handled"
                  keyExtractor={(item) => item.id}
                  renderItem={({ item }) => {
                    const isSelected = currentLocation.id === item.id;
                    return (
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={`Select ${item.name}`}
                        onPress={() => handleSelect(item)}
                        style={[styles.cityRow, isSelected && styles.cityRowSelected]}
                      >
                        <View style={styles.cityRowLeft}>
                          <View
                            style={[
                              styles.cityPin,
                              isSelected && { backgroundColor: 'rgba(67,30,190,0.12)' },
                            ]}
                          >
                            <AppIcon
                              color={isSelected ? colors.appPrimary : colors.muted}
                              name="map"
                              size={15}
                            />
                          </View>
                          <View>
                            <Text
                              style={[
                                styles.cityName,
                                isSelected && { color: colors.appPrimary, fontWeight: '800' },
                              ]}
                            >
                              {item.cityName}
                            </Text>
                            <Text style={styles.stateName}>{item.stateCode}, United States</Text>
                          </View>
                        </View>
                        {isSelected && (
                          <View style={styles.checkBadge}>
                            <AppIcon color="#ffffff" name="check" size={12} />
                          </View>
                        )}
                      </Pressable>
                    );
                  }}
                  showsVerticalScrollIndicator={false}
                  style={styles.list}
                />
              ) : (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyEmoji}>🔍</Text>
                  <Text style={styles.emptyTitle}>No cities found</Text>
                  <Text style={styles.emptySub}>
                    Try searching with another spelling or state code.
                  </Text>
                </View>
              )
            ) : (
              <View style={styles.popularSection}>
                {queryTrimmed.length > 0 ? (
                  <View style={styles.hintBox}>
                    <Text style={styles.hintText}>
                      💡 Type at least 3 letters to search all 20,000+ US cities
                    </Text>
                  </View>
                ) : null}

                <ScrollView
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={false}
                  style={styles.list}
                >
                  {/* Current Location */}
                  <Text style={styles.popularHeading}>📍 Current Location</Text>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={
                      detectedLocation
                        ? `Select ${detectedLocation.name}`
                        : 'Detect current location'
                    }
                    onPress={() => {
                      if (detectedLocation) {
                        handleSelect(detectedLocation);
                      } else {
                        detectDeviceLocation();
                      }
                    }}
                    style={[
                      styles.cityRow,
                      detectedLocation &&
                        currentLocation.id === detectedLocation.id &&
                        styles.cityRowSelected,
                    ]}
                  >
                    <View style={styles.cityRowLeft}>
                      <View
                        style={[
                          styles.cityPin,
                          detectedLocation &&
                            currentLocation.id === detectedLocation.id && {
                              backgroundColor: 'rgba(67,30,190,0.12)',
                            },
                        ]}
                      >
                        <AppIcon
                          color={
                            detectedLocation && currentLocation.id === detectedLocation.id
                              ? colors.appPrimary
                              : colors.muted
                          }
                          name="compass"
                          size={15}
                        />
                      </View>
                      <View>
                        <Text
                          style={[
                            styles.cityName,
                            detectedLocation &&
                              currentLocation.id === detectedLocation.id && {
                                color: colors.appPrimary,
                                fontWeight: '800',
                              },
                          ]}
                        >
                          {detectedLocation ? detectedLocation.name : 'Detect Current City'}
                        </Text>
                        <Text style={styles.stateName}>
                          {isDetecting
                            ? 'Detecting via GPS / Network...'
                            : detectedLocation
                              ? 'Device GPS / Local Network'
                              : 'Tap to auto-detect location'}
                        </Text>
                      </View>
                    </View>
                    {detectedLocation && currentLocation.id === detectedLocation.id && (
                      <View style={styles.checkBadge}>
                        <AppIcon color="#ffffff" name="check" size={12} />
                      </View>
                    )}
                  </Pressable>

                  {/* Nearby Cities */}
                  {nearbyCities.length > 0 && (
                    <>
                      <Text style={[styles.popularHeading, { marginTop: 16 }]}>
                        🚗 Nearby Cities (~5–30 mi)
                      </Text>
                      {nearbyCities.map((item) => {
                        const isSelected = currentLocation.id === item.id;
                        return (
                          <Pressable
                            key={item.id}
                            accessibilityRole="button"
                            accessibilityLabel={`Select ${item.name}`}
                            onPress={() => handleSelect(item)}
                            style={[styles.cityRow, isSelected && styles.cityRowSelected]}
                          >
                            <View style={styles.cityRowLeft}>
                              <View
                                style={[
                                  styles.cityPin,
                                  isSelected && { backgroundColor: 'rgba(67,30,190,0.12)' },
                                ]}
                              >
                                <AppIcon
                                  color={isSelected ? colors.appPrimary : colors.muted}
                                  name="map"
                                  size={15}
                                />
                              </View>
                              <View>
                                <Text
                                  style={[
                                    styles.cityName,
                                    isSelected && { color: colors.appPrimary, fontWeight: '800' },
                                  ]}
                                >
                                  {item.name}
                                </Text>
                                <Text style={styles.stateName}>
                                  {item.distanceMiles
                                    ? `${item.distanceMiles} mi away`
                                    : `${item.stateCode}, United States`}
                                </Text>
                              </View>
                            </View>
                            {isSelected && (
                              <View style={styles.checkBadge}>
                                <AppIcon color="#ffffff" name="check" size={12} />
                              </View>
                            )}
                          </Pressable>
                        );
                      })}
                    </>
                  )}

                  {/* All Cities (USA) */}
                  <Text style={[styles.popularHeading, { marginTop: 16 }]}>🇺🇸 All Locations</Text>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Select All Cities (USA)"
                    onPress={() => handleSelect(ALL_USA_LOCATION)}
                    style={[
                      styles.cityRow,
                      currentLocation.id === ALL_USA_LOCATION.id && styles.cityRowSelected,
                    ]}
                  >
                    <View style={styles.cityRowLeft}>
                      <View
                        style={[
                          styles.cityPin,
                          currentLocation.id === ALL_USA_LOCATION.id && {
                            backgroundColor: 'rgba(67,30,190,0.12)',
                          },
                        ]}
                      >
                        <AppIcon
                          color={
                            currentLocation.id === ALL_USA_LOCATION.id
                              ? colors.appPrimary
                              : colors.muted
                          }
                          name="globe"
                          size={15}
                        />
                      </View>
                      <View>
                        <Text
                          style={[
                            styles.cityName,
                            currentLocation.id === ALL_USA_LOCATION.id && {
                              color: colors.appPrimary,
                              fontWeight: '800',
                            },
                          ]}
                        >
                          All Cities (USA)
                        </Text>
                        <Text style={styles.stateName}>Search nationwide across all 50 states</Text>
                      </View>
                    </View>
                    {currentLocation.id === ALL_USA_LOCATION.id && (
                      <View style={styles.checkBadge}>
                        <AppIcon color="#ffffff" name="check" size={12} />
                      </View>
                    )}
                  </Pressable>
                </ScrollView>
              </View>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdropPressable: {
    flex: 1,
  },
  sheet: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '85%',
    minHeight: 460,
    paddingHorizontal: space.x4,
    paddingTop: space.x4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 18,
    elevation: 20,
  },
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: space.x3,
  },
  headerLeft: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: space.x3,
  },
  pinBg: {
    alignItems: 'center',
    backgroundColor: 'rgba(67,30,190,0.10)',
    borderRadius: 12,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  sheetTitle: {
    color: colors.ink,
    fontSize: 17,
    fontWeight: '800',
  },
  sheetSubtitle: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '500',
  },
  closeBtn: {
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: 20,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  searchBar: {
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerLow,
    borderColor: 'rgba(67,30,190,0.15)',
    borderRadius: radius.pill,
    borderWidth: 1.5,
    flexDirection: 'row',
    gap: space.x2,
    height: 48,
    marginBottom: space.x3,
    paddingHorizontal: space.x3,
  },
  searchInput: {
    color: colors.ink,
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
  },
  clearBtn: {
    padding: 4,
  },
  contentContainer: {
    flex: 1,
    minHeight: 240,
  },
  list: {
    flex: 1,
  },
  cityRow: {
    alignItems: 'center',
    borderRadius: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
    paddingHorizontal: space.x3,
    paddingVertical: 10,
  },
  cityRowSelected: {
    backgroundColor: 'rgba(67,30,190,0.06)',
  },
  cityRowLeft: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: space.x3,
  },
  cityPin: {
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: 10,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  cityName: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '700',
  },
  stateName: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '500',
  },
  checkBadge: {
    alignItems: 'center',
    backgroundColor: colors.appPrimary,
    borderRadius: 10,
    height: 20,
    justifyContent: 'center',
    width: 20,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: space.x8,
  },
  emptyEmoji: {
    fontSize: 36,
    marginBottom: space.x2,
  },
  emptyTitle: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  emptySub: {
    color: colors.muted,
    fontSize: 13,
    textAlign: 'center',
  },
  popularSection: {
    flex: 1,
  },
  hintBox: {
    backgroundColor: 'rgba(67,30,190,0.06)',
    borderRadius: 10,
    marginBottom: space.x3,
    paddingHorizontal: space.x3,
    paddingVertical: 8,
  },
  hintText: {
    color: colors.appPrimary,
    fontSize: 12,
    fontWeight: '600',
  },
  popularHeading: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: space.x2,
    textTransform: 'uppercase',
  },
});
