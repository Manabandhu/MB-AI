import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator } from 'react-native';
import { useTheme, XStack, YStack } from 'tamagui';
import {
  type AutocompletePrediction,
  autocompletePlacesGoogle,
  geocodeAddress,
  MapsRateLimitError,
} from '@/modules/rides/services/googleMapsService';
import { AppIcon } from '@/modules/shared/ui/AppIcon';
import { AppText } from '@/modules/shared/ui/AppText';
import { TextField } from '@/modules/shared/ui/TextField';

type Props = {
  label: string;
  value: string;
  onValueChange: (text: string) => void;
  onCoordsChange: (coords: { lat: number; lng: number } | null) => void;
  placeholder?: string;
  error?: string | null;
};

const LOOKUP_DELAY_MS = 300;

/**
 * Place field with suggestions from the maps proxy. Typing clears any chosen coordinates (they would no longer
 * match the text); choosing a suggestion looks them up. Lookup problems are shown, never hidden.
 */
export function RideLocationPicker({
  label,
  value,
  onValueChange,
  onCoordsChange,
  placeholder = 'City, neighbourhood, or address',
  error,
}: Props) {
  const theme = useTheme();
  const [suggestions, setSuggestions] = useState<AutocompletePrediction[]>([]);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [query, setQuery] = useState<string | null>(null);
  const latest = useRef(0);

  useEffect(() => {
    if (query == null || query.trim().length < 3) {
      setSuggestions([]);
      return;
    }
    const ticket = ++latest.current;
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const results = await autocompletePlacesGoogle(query);
        if (ticket === latest.current) {
          setSuggestions(results);
          setNotice(null);
        }
      } catch (e) {
        if (ticket === latest.current) {
          setSuggestions([]);
          setNotice(e instanceof MapsRateLimitError ? e.message : 'Place suggestions failed.');
        }
      } finally {
        if (ticket === latest.current) setLoading(false);
      }
    }, LOOKUP_DELAY_MS);
    return () => clearTimeout(timer);
  }, [query]);

  const handleChange = (text: string) => {
    onValueChange(text);
    onCoordsChange(null);
    setQuery(text);
  };

  const handleSelect = async (p: AutocompletePrediction) => {
    latest.current += 1;
    setQuery(null);
    setSuggestions([]);
    onValueChange(p.description);
    try {
      const coords = await geocodeAddress(p.placeId || p.description);
      onCoordsChange(coords);
      setNotice(coords ? null : 'Could not find the map position for this place.');
    } catch (e) {
      onCoordsChange(null);
      setNotice(e instanceof MapsRateLimitError ? e.message : 'Could not look up this place.');
    }
  };

  return (
    <YStack gap="$x2">
      <XStack alignItems="flex-end" gap="$x2">
        <YStack flex={1}>
          <TextField
            autoCorrect={false}
            error={error}
            label={label}
            onChangeText={handleChange}
            placeholder={placeholder}
            value={value}
          />
        </YStack>
        {loading ? (
          <YStack height="$control" justifyContent="center">
            <ActivityIndicator color={theme.primary?.val} size="small" />
          </YStack>
        ) : null}
      </XStack>
      {notice ? (
        <AppText aria-live="polite" tone="warm" variant="caption">
          {notice}
        </AppText>
      ) : null}
      {suggestions.length > 0 ? (
        <YStack
          aria-label={`${label} suggestions`}
          backgroundColor="$surface"
          borderColor="$borderColor"
          borderRadius="$card"
          borderWidth={1}
          overflow="hidden"
          role="list"
        >
          {suggestions.map((item) => (
            <XStack
              alignItems="center"
              aria-label={`Use ${item.description}`}
              borderBottomColor="$borderColor"
              borderBottomWidth={1}
              cursor="pointer"
              focusable
              gap="$x2"
              hoverStyle={{ backgroundColor: '$surfaceContainerLow' }}
              key={`${item.placeId}-${item.description}`}
              minHeight="$touch"
              onPress={() => handleSelect(item)}
              paddingHorizontal="$x3"
              paddingVertical="$x2"
              pressStyle={{ opacity: 0.8 }}
              role="button"
            >
              <AppIcon color={theme.teal?.val} name="map-pin" size={16} />
              <YStack flex={1}>
                <AppText numberOfLines={1} variant="label">
                  {item.mainText || item.description}
                </AppText>
                {item.secondaryText ? (
                  <AppText numberOfLines={1} tone="muted" variant="caption">
                    {item.secondaryText}
                  </AppText>
                ) : null}
              </YStack>
            </XStack>
          ))}
        </YStack>
      ) : null}
    </YStack>
  );
}
