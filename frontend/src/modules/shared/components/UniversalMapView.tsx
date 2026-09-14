import { color as colors } from '@manabandhu/design-system';
import type React from 'react';
import { useEffect, useRef } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { Platform, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';

export interface MapMarkerItem {
  id: string;
  latitude: number;
  longitude: number;
  title: string;
  price?: string | number;
  subtitle?: string;
  isSelected?: boolean;
}

export interface UniversalMapViewProps {
  initialRegion?: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  };
  markers?: MapMarkerItem[];
  selectedMarkerId?: string | null;
  onSelectMarker?: (id: string) => void;
  style?: StyleProp<ViewStyle>;
  showsUserLocation?: boolean;
  mapType?: 'standard' | 'satellite' | 'hybrid';
  children?: React.ReactNode;
}

const DEFAULT_REGION = {
  latitude: 30.2672,
  longitude: -97.7431,
  latitudeDelta: 0.12,
  longitudeDelta: 0.12,
};

export function UniversalMapView({
  initialRegion = DEFAULT_REGION,
  markers = [],
  selectedMarkerId,
  onSelectMarker,
  style,
  showsUserLocation = false,
  mapType = 'standard',
  children,
}: UniversalMapViewProps) {
  const mapRef = useRef<MapView>(null);

  // Smoothly center the map on the selected marker when it changes
  useEffect(() => {
    if (!selectedMarkerId) return;
    const selected = markers.find((m) => m.id === selectedMarkerId);
    if (selected?.latitude && selected.longitude) {
      mapRef.current?.animateToRegion(
        {
          latitude: selected.latitude,
          longitude: selected.longitude,
          latitudeDelta: 0.04,
          longitudeDelta: 0.04,
        },
        500,
      );
    }
  }, [selectedMarkerId, markers]);

  return (
    <View style={[styles.container, style]}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_DEFAULT} // Apple Maps by default on iOS, Google Maps on Android
        style={StyleSheet.absoluteFill}
        initialRegion={initialRegion}
        showsUserLocation={showsUserLocation}
        showsCompass={true}
        showsScale={true}
        mapType={mapType}
      >
        {markers.map((marker) => {
          if (!marker.latitude || !marker.longitude) return null;
          const isSelected = selectedMarkerId === marker.id;

          return (
            <Marker
              key={marker.id}
              coordinate={{
                latitude: marker.latitude,
                longitude: marker.longitude,
              }}
              onPress={() => onSelectMarker?.(marker.id)}
              tracksViewChanges={Platform.OS !== 'ios'}
            >
              <View style={[styles.markerBubble, isSelected && styles.markerBubbleSelected]}>
                <Text style={[styles.markerPrice, isSelected && styles.markerPriceSelected]}>
                  {marker.price ? `$${marker.price}` : '📍'}
                </Text>
              </View>
              {isSelected && <View style={styles.markerPointer} />}
            </Marker>
          );
        })}
      </MapView>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  markerBubble: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerBubbleSelected: {
    backgroundColor: colors.primary,
    borderColor: '#ffffff',
    transform: [{ scale: 1.15 }],
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  markerPrice: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
  markerPriceSelected: {
    color: '#ffffff',
  },
  markerPointer: {
    alignSelf: 'center',
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderTopWidth: 6,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: colors.primary,
    marginTop: -1,
  },
});
