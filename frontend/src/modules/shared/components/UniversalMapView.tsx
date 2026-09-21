import { color as colors } from '@manabandhu/design-system';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import type React from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { PanResponder, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, Polygon, PROVIDER_DEFAULT, PROVIDER_GOOGLE } from 'react-native-maps';
import Svg, { Polyline as SvgPolyline } from 'react-native-svg';
import { useMapPreferencesStore } from '../stores/mapPreferencesStore';
import type { Coordinate } from '../utils/geoPolygon';
import { downsamplePoints } from '../utils/geoPolygon';

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
  is3D?: boolean;
  centerCoordinate?: { latitude: number; longitude: number; timestamp?: number } | null;
  children?: React.ReactNode;
  // Draw-to-filter props
  enableDrawing?: boolean;
  drawnPolygon?: Coordinate[] | null;
  onPolygonComplete?: (polygon: Coordinate[]) => void;
  onClearPolygon?: () => void;
  onRegionChangeComplete?: (region: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  }) => void;
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
  is3D = false,
  centerCoordinate,
  children,
  enableDrawing = true,
  drawnPolygon = null,
  onPolygonComplete,
  onClearPolygon,
  onRegionChangeComplete,
}: UniversalMapViewProps) {
  const mapRef = useRef<MapView>(null);
  const preferredProvider = useMapPreferencesStore((s) => s.provider);

  // On iOS, Google Maps native SDK is not bundled in Expo Go.
  // When running on iOS under Expo Go (StoreClient), we fall back to PROVIDER_DEFAULT (Apple Maps)
  // so the map renders immediately and never displays a blank screen.
  const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
  const activeProvider =
    Platform.OS === 'ios' && isExpoGo
      ? PROVIDER_DEFAULT
      : preferredProvider === 'google'
        ? PROVIDER_GOOGLE
        : PROVIDER_DEFAULT;

  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [currentScreenPoints, setCurrentScreenPoints] = useState<Array<{ x: number; y: number }>>(
    [],
  );

  // Tilt camera to 3D perspective or flat 2D
  useEffect(() => {
    if (!mapRef.current) return;
    mapRef.current
      .getCamera()
      .then((cam) => {
        mapRef.current?.animateCamera({ ...cam, pitch: is3D ? 55 : 0 }, { duration: 400 });
      })
      .catch(() => {
        mapRef.current?.animateCamera({ pitch: is3D ? 55 : 0 }, { duration: 400 });
      });
  }, [is3D]);

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

  // Animate to centerCoordinate when GPS or recenter is requested
  useEffect(() => {
    if (!centerCoordinate) return;
    mapRef.current?.animateToRegion(
      {
        latitude: centerCoordinate.latitude,
        longitude: centerCoordinate.longitude,
        latitudeDelta: 0.08,
        longitudeDelta: 0.08,
      },
      600,
    );
  }, [centerCoordinate]);

  // PanResponder to track finger drawing gestures when drawing mode is active
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => isDrawingMode,
        onMoveShouldSetPanResponder: () => isDrawingMode,
        onPanResponderGrant: (evt) => {
          const { locationX, locationY } = evt.nativeEvent;
          setCurrentScreenPoints([{ x: locationX, y: locationY }]);
        },
        onPanResponderMove: (evt) => {
          const { locationX, locationY } = evt.nativeEvent;
          setCurrentScreenPoints((prev) => [...prev, { x: locationX, y: locationY }]);
        },
        onPanResponderRelease: async () => {
          if (!mapRef.current || currentScreenPoints.length < 5) {
            setCurrentScreenPoints([]);
            return;
          }

          // Downsample points to ~30 coordinate vertices
          const sampled = downsamplePoints(currentScreenPoints, 30);
          try {
            const rawCoords = await Promise.all(
              sampled.map((pt) => mapRef.current?.coordinateForPoint(pt)),
            );

            const validCoords = rawCoords.filter(
              (c): c is Coordinate =>
                c != null && typeof c.latitude === 'number' && typeof c.longitude === 'number',
            );

            if (validCoords.length >= 3) {
              // Ensure closed loop
              validCoords.push({ ...validCoords[0] });
              onPolygonComplete?.(validCoords);
            }
          } catch {
            // Coordinate conversion fallback
          } finally {
            setCurrentScreenPoints([]);
            setIsDrawingMode(false);
          }
        },
      }),
    [isDrawingMode, currentScreenPoints, onPolygonComplete],
  );

  const polylineSvgString = useMemo(() => {
    if (currentScreenPoints.length === 0) return '';
    return currentScreenPoints.map((p) => `${p.x},${p.y}`).join(' ');
  }, [currentScreenPoints]);

  return (
    <View style={[styles.container, style]}>
      <MapView
        ref={mapRef}
        provider={activeProvider}
        style={StyleSheet.absoluteFill}
        initialRegion={initialRegion}
        showsUserLocation={showsUserLocation}
        showsMyLocationButton={true}
        showsCompass={true}
        showsScale={true}
        mapType={mapType}
        scrollEnabled={!isDrawingMode}
        zoomEnabled={!isDrawingMode}
        rotateEnabled={!isDrawingMode}
        pitchEnabled={!isDrawingMode}
        onRegionChangeComplete={onRegionChangeComplete}
      >
        {/* Render persistent drawn search polygon */}
        {drawnPolygon && drawnPolygon.length >= 3 && (
          <Polygon
            coordinates={drawnPolygon}
            strokeColor={colors.primary}
            fillColor="rgba(13, 92, 117, 0.22)"
            strokeWidth={2.5}
          />
        )}

        {/* Render Listing Markers */}
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

      {/* Real-time Drawing Overlay Layer */}
      {isDrawingMode && (
        <View {...panResponder.panHandlers} style={StyleSheet.absoluteFill}>
          <Svg style={StyleSheet.absoluteFill}>
            {polylineSvgString ? (
              <SvgPolyline
                points={polylineSvgString}
                fill="rgba(13, 92, 117, 0.15)"
                stroke={colors.primary}
                strokeWidth={3}
                strokeDasharray="6, 4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ) : null}
          </Svg>
        </View>
      )}

      {/* Floating Drawing Instruction Banner */}
      {isDrawingMode && (
        <View style={styles.instructionBanner}>
          <Text style={styles.instructionText}>✏️ Draw a loop around your desired search area</Text>
          <Pressable
            onPress={() => {
              setIsDrawingMode(false);
              setCurrentScreenPoints([]);
            }}
            style={styles.cancelButton}
          >
            <Text style={styles.cancelButtonText}>✕ Cancel</Text>
          </Pressable>
        </View>
      )}

      {/* Floating Controls (Draw / Redraw / Clear) */}
      {enableDrawing && !isDrawingMode && (
        <View style={styles.floatingControlsContainer}>
          {drawnPolygon && drawnPolygon.length >= 3 ? (
            <View style={styles.actionButtonGroup}>
              <Pressable
                onPress={() => {
                  setCurrentScreenPoints([]);
                  setIsDrawingMode(true);
                }}
                style={styles.redrawButton}
              >
                <Text style={styles.redrawButtonText}>✏️ Redraw</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  onClearPolygon?.();
                }}
                style={styles.clearButton}
              >
                <Text style={styles.clearButtonText}>🗑️ Clear Area</Text>
              </Pressable>
            </View>
          ) : (
            <Pressable
              onPress={() => {
                setCurrentScreenPoints([]);
                setIsDrawingMode(true);
              }}
              style={styles.drawTriggerButton}
            >
              <Text style={styles.drawTriggerIcon}>✏️</Text>
              <Text style={styles.drawTriggerText}>Draw Area</Text>
            </Pressable>
          )}
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
  instructionBanner: {
    position: 'absolute',
    top: 14,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(15, 23, 42, 0.92)',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  instructionText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
    marginRight: 12,
  },
  cancelButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  cancelButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  floatingControlsContainer: {
    position: 'absolute',
    top: 14,
    right: 14,
    zIndex: 10,
  },
  actionButtonGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  drawTriggerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 5,
    gap: 6,
  },
  drawTriggerIcon: {
    fontSize: 14,
  },
  drawTriggerText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
  redrawButton: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  redrawButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
  },
  clearButton: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  clearButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
  },
});
