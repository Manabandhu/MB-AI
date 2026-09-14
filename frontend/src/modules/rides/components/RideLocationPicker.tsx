import { color as colors, radius, space } from '@manabandhu/design-system';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import {
  type AutocompletePrediction,
  autocompletePlacesGoogle,
  geocodeAddress,
} from '@/modules/rides/services/googleMapsService';
import { AppIcon } from '@/modules/shared/ui/AppIcon';

type Props = {
  label: string;
  value: string;
  onValueChange: (text: string) => void;
  onCoordsChange: (coords: { lat: number; lng: number } | null) => void;
  pinColor: string;
  placeholder?: string;
};

export function RideLocationPicker({
  label,
  value,
  onValueChange,
  onCoordsChange,
  pinColor,
  placeholder = 'Enter city, suburb, or address',
}: Props) {
  const [suggestions, setSuggestions] = useState<AutocompletePrediction[]>([]);
  const [loading, setLoading] = useState(false);

  const handleChange = async (text: string) => {
    onValueChange(text);
    if (text.length >= 3) {
      setLoading(true);
      const results = await autocompletePlacesGoogle(text);
      setSuggestions(results);
      setLoading(false);
    } else {
      setSuggestions([]);
    }
  };

  const handleSelect = async (p: AutocompletePrediction) => {
    onValueChange(p.description);
    setSuggestions([]);
    const coords = await geocodeAddress(p.placeId || p.description);
    if (coords) onCoordsChange(coords);
  };

  return (
    <View style={s.container}>
      <View style={s.headerRow}>
        <Text style={s.fieldLabel}>{label}</Text>
        {value.length > 0 && (
          <Pressable onPress={() => onValueChange('')}>
            <Text style={s.clearText}>Clear</Text>
          </Pressable>
        )}
      </View>
      <View style={s.inputWithMarker}>
        <View style={[s.pin, { backgroundColor: pinColor }]} />
        <TextInput
          style={s.locationInput}
          value={value}
          onChangeText={handleChange}
          placeholder={placeholder}
          placeholderTextColor={colors.muted}
        />
        {loading && <ActivityIndicator size="small" color={colors.primary} />}
      </View>

      {suggestions.length > 0 && (
        <View style={s.suggestionBox}>
          {suggestions.map((item, idx) => (
            <Pressable key={idx} style={s.suggestionRow} onPress={() => handleSelect(item)}>
              <AppIcon name="compass" size={14} color={colors.teal} />
              <View style={{ flex: 1 }}>
                <Text style={s.suggestionMainText}>{item.mainText || item.description}</Text>
                {item.secondaryText && (
                  <Text style={s.suggestionSubText}>{item.secondaryText}</Text>
                )}
              </View>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { gap: 4 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  fieldLabel: { fontSize: 11, fontWeight: '800', color: colors.muted, letterSpacing: 0.5 },
  clearText: { fontSize: 12, color: colors.primary, fontWeight: '700' },
  inputWithMarker: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f6ff',
    borderRadius: radius.control,
    paddingHorizontal: space.x3,
    height: 48,
    gap: space.x2,
  },
  pin: { width: 10, height: 10, borderRadius: 5 },
  locationInput: { flex: 1, fontSize: 14, color: colors.ink, fontWeight: '600' },
  suggestionBox: {
    backgroundColor: '#ffffff',
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: 'rgba(67,30,190,0.15)',
    marginTop: 4,
    overflow: 'hidden',
  },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: space.x3,
    gap: space.x2,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f8',
  },
  suggestionMainText: { fontSize: 13, fontWeight: '700', color: colors.ink },
  suggestionSubText: { fontSize: 11, color: colors.muted },
});
