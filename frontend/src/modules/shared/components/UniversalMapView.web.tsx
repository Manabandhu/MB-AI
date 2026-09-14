import { color as colors } from '@manabandhu/design-system';
import type React from 'react';
import { useEffect, useRef, useState } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, Text, View } from 'react-native';

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

interface MapKitAnnotation {
  addEventListener: (type: string, listener: () => void) => void;
}

interface MapKitCoordinate {
  latitude: number;
  longitude: number;
}

interface MapKitMap {
  destroy: () => void;
  annotations?: MapKitAnnotation[];
  removeAnnotations: (annotations: MapKitAnnotation[]) => void;
  addAnnotations: (annotations: MapKitAnnotation[]) => void;
  setCenterAnimated: (coord: MapKitCoordinate, animated: boolean) => void;
}

interface MapKitNamespace {
  initialized?: boolean;
  init: (options: { authorizationCallback: (done: (token: string) => void) => void }) => void;
  Coordinate: new (lat: number, lng: number) => MapKitCoordinate;
  CoordinateSpan: new (latDelta: number, lngDelta: number) => unknown;
  CoordinateRegion: new (center: MapKitCoordinate, span: unknown) => unknown;
  Map: new (container: HTMLElement, options: Record<string, unknown>) => MapKitMap;
  MarkerAnnotation: new (
    coord: MapKitCoordinate,
    options: Record<string, unknown>,
  ) => MapKitAnnotation;
  FeatureVisibility: {
    Adaptive: unknown;
  };
}

// Global declaration for Apple MapKit JS
declare global {
  interface Window {
    mapkit?: MapKitNamespace;
  }
}

export function UniversalMapView({
  initialRegion = DEFAULT_REGION,
  markers = [],
  selectedMarkerId,
  onSelectMarker,
  style,
  children,
}: UniversalMapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<MapKitMap | null>(null);
  const [mapkitReady, setMapkitReady] = useState(false);
  const [mapkitError, setMapkitError] = useState<string | null>(null);

  // Read the Apple Maps token from Expo public env
  const appleMapsToken = process.env.EXPO_PUBLIC_APPLE_MAPS_TOKEN?.trim() || '';

  // 1. Initialize Apple MapKit JS when token is present
  useEffect(() => {
    if (!appleMapsToken) return;

    let isMounted = true;

    const loadMapKit = () => {
      if (window.mapkit) {
        setupMapKit();
        return;
      }

      // Check if script tag already exists
      const existingScript = document.getElementById('apple-mapkit-script');
      if (!existingScript) {
        const script = document.createElement('script');
        script.id = 'apple-mapkit-script';
        script.src = 'https://cdn.apple-mapkit.com/mk/5.x.x/mapkit.js';
        script.async = true;
        script.crossOrigin = 'anonymous';
        script.onload = () => {
          if (isMounted) setupMapKit();
        };
        script.onerror = () => {
          if (isMounted) setMapkitError('Failed to load Apple MapKit JS library.');
        };
        document.head.appendChild(script);
      } else {
        existingScript.addEventListener('load', () => {
          if (isMounted) setupMapKit();
        });
      }
    };

    const setupMapKit = () => {
      if (!window.mapkit || !containerRef.current) return;

      try {
        if (!window.mapkit.initialized) {
          window.mapkit.init({
            authorizationCallback: (done: (token: string) => void) => {
              done(appleMapsToken);
            },
          });
          window.mapkit.initialized = true;
        }

        const center = new window.mapkit.Coordinate(
          initialRegion.latitude,
          initialRegion.longitude,
        );
        const span = new window.mapkit.CoordinateSpan(
          initialRegion.latitudeDelta,
          initialRegion.longitudeDelta,
        );
        const region = new window.mapkit.CoordinateRegion(center, span);

        const map = new window.mapkit.Map(containerRef.current, {
          region,
          showsUserLocationControl: true,
          showsCompass: window.mapkit.FeatureVisibility.Adaptive,
          showsZoomControl: true,
          showsMapTypeControl: true,
        });

        mapInstanceRef.current = map;
        setMapkitReady(true);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Error initializing Apple MapKit.';
        setMapkitError(msg);
      }
    };

    loadMapKit();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.destroy();
        } catch {
          // ignore cleanup errors
        }
        mapInstanceRef.current = null;
      }
    };
  }, [
    appleMapsToken,
    initialRegion.latitude,
    initialRegion.longitude,
    initialRegion.latitudeDelta,
    initialRegion.longitudeDelta,
  ]);

  // 2. Sync markers with MapKit instance
  useEffect(() => {
    if (!mapInstanceRef.current || !window.mapkit || !mapkitReady) return;

    const map = mapInstanceRef.current;

    // Clear existing annotations
    if (map.annotations) {
      map.removeAnnotations(map.annotations);
    }

    const annotations = markers
      .filter((m) => m.latitude && m.longitude)
      .map((m) => {
        const coord = new window.mapkit.Coordinate(m.latitude, m.longitude);
        const isSelected = selectedMarkerId === m.id;

        const annotation = new window.mapkit.MarkerAnnotation(coord, {
          title: m.title,
          subtitle: m.subtitle || (m.price ? `$${m.price}/mo` : ''),
          color: isSelected ? colors.primary : '#0D5C75',
          glyphText: m.price ? `$${m.price}` : '📍',
          selected: isSelected,
        });

        annotation.addEventListener('select', () => {
          onSelectMarker?.(m.id);
        });

        return annotation;
      });

    map.addAnnotations(annotations);
  }, [markers, selectedMarkerId, mapkitReady, onSelectMarker]);

  // 3. Pan to selected marker
  useEffect(() => {
    if (!mapInstanceRef.current || !window.mapkit || !selectedMarkerId) return;
    const selected = markers.find((m) => m.id === selectedMarkerId);
    if (selected?.latitude && selected.longitude) {
      const coord = new window.mapkit.Coordinate(selected.latitude, selected.longitude);
      mapInstanceRef.current.setCenterAnimated(coord, true);
    }
  }, [selectedMarkerId, markers]);

  return (
    <View style={[styles.container, style]}>
      {/* Real Apple Map Container (Used when token is present) */}
      <div
        ref={containerRef}
        style={{
          width: '100%',
          height: '100%',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: appleMapsToken && !mapkitError ? 'block' : 'none',
        }}
      />

      {/* Fallback View (Used on Web when token is not yet configured) */}
      {(!appleMapsToken || mapkitError) && (
        <View style={styles.tokenPromptContainer}>
          <View style={styles.tokenPromptCard}>
            <Text style={styles.tokenPromptIcon}>🗺️</Text>
            <Text style={styles.tokenPromptTitle}>Apple Maps Ready</Text>
            <Text style={styles.tokenPromptSubtitle}>
              Native iOS devices render Apple Maps automatically with zero configuration.
            </Text>
            <Text style={styles.tokenPromptDetail}>
              To render Apple MapKit JS in the web browser, add your token to:
            </Text>
            <View style={styles.codePill}>
              <Text style={styles.codeText}>frontend/.env → EXPO_PUBLIC_APPLE_MAPS_TOKEN</Text>
            </View>

            {/* Interactive Pins Preview on Web Canvas */}
            <View style={styles.pinsPreviewRow}>
              {markers.slice(0, 4).map((m) => {
                const isSelected = selectedMarkerId === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => onSelectMarker?.(m.id)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '20px',
                      border: `1.5px solid ${isSelected ? colors.primary : '#cbd5e1'}`,
                      backgroundColor: isSelected ? colors.primary : '#ffffff',
                      color: isSelected ? '#ffffff' : '#1e293b',
                      fontSize: '12px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.08)',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    📍 {m.title.slice(0, 16)}... {m.price ? `($${m.price})` : ''}
                  </button>
                );
              })}
            </View>
          </View>
        </View>
      )}

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
  tokenPromptContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  tokenPromptCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 28,
    maxWidth: 520,
    width: '100%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  tokenPromptIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  tokenPromptTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
    textAlign: 'center',
  },
  tokenPromptSubtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  tokenPromptDetail: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 8,
  },
  codePill: {
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    marginBottom: 20,
    width: '100%',
  },
  codeText: {
    fontFamily: 'monospace',
    fontSize: 12,
    color: colors.primary,
    textAlign: 'center',
    fontWeight: '600',
  },
  pinsPreviewRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
    width: '100%',
  },
});
