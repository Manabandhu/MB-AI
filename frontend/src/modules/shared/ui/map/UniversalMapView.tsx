import { type paletteFor, radius, shadow, space } from '@manabandhu/design-system';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { useEffect, useMemo, useRef, useState } from 'react';
import { PanResponder, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, Polygon, PROVIDER_DEFAULT, PROVIDER_GOOGLE } from 'react-native-maps';
import Svg, { Polyline as SvgPolyline } from 'react-native-svg';
import { useMapPreferencesStore } from '@/modules/shared/stores/mapPreferencesStore';
import { AppIcon } from '@/modules/shared/ui/AppIcon';
import type { Coordinate } from '@/modules/shared/utils/geoPolygon';
import { downsamplePoints } from '@/modules/shared/utils/geoPolygon';
import { useAppearance } from '@/theme/ThemeProvider';
import { DEFAULT_REGION, type UniversalMapViewProps } from './mapTypes';

type Palette = ReturnType<typeof paletteFor>;

export type { MapMarkerItem, UniversalMapViewProps } from './mapTypes';

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
}: UniversalMapViewProps) {
  const mapRef = useRef<MapView>(null);
  const { palette } = useAppearance();
  const styles = useMemo(() => makeStyles(palette), [palette]);
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
      >
        {/* Render persistent drawn search polygon */}
        {drawnPolygon && drawnPolygon.length >= 3 && (
          <Polygon
            coordinates={drawnPolygon}
            strokeColor={palette.primary}
            fillColor={palette.primaryTint}
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
                {marker.price ? (
                  <Text style={[styles.markerPrice, isSelected && styles.markerPriceSelected]}>
                    {`$${marker.price}`}
                  </Text>
                ) : (
                  <AppIcon
                    color={isSelected ? palette.surfaceContainerLowest : palette.primary}
                    name="map-pin"
                    size={16}
                  />
                )}
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
                fill={palette.primaryTint}
                stroke={palette.primary}
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
          <AppIcon color={palette.primary} name="pencil" size={16} />
          <Text style={styles.instructionText}>Draw a loop around your desired search area</Text>
          <Pressable
            accessibilityLabel="Cancel drawing"
            accessibilityRole="button"
            onPress={() => {
              setIsDrawingMode(false);
              setCurrentScreenPoints([]);
            }}
            style={styles.cancelButton}
          >
            <AppIcon color={palette.ink} name="close" size={14} />
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </Pressable>
        </View>
      )}

      {/* Floating Controls (Draw / Redraw / Clear) */}
      {enableDrawing && !isDrawingMode && (
        <View style={styles.floatingControlsContainer}>
          {drawnPolygon && drawnPolygon.length >= 3 ? (
            <View style={styles.actionButtonGroup}>
              <Pressable
                accessibilityLabel="Redraw search area"
                accessibilityRole="button"
                onPress={() => {
                  setCurrentScreenPoints([]);
                  setIsDrawingMode(true);
                }}
                style={styles.controlButton}
              >
                <AppIcon color={palette.ink} name="pencil" size={14} />
                <Text style={styles.controlButtonText}>Redraw</Text>
              </Pressable>
              <Pressable
                accessibilityLabel="Clear search area"
                accessibilityRole="button"
                onPress={() => {
                  onClearPolygon?.();
                }}
                style={styles.clearButton}
              >
                <AppIcon color={palette.surfaceContainerLowest} name="trash" size={14} />
                <Text style={styles.clearButtonText}>Clear Area</Text>
              </Pressable>
            </View>
          ) : (
            <Pressable
              accessibilityLabel="Draw a search area"
              accessibilityRole="button"
              onPress={() => {
                setCurrentScreenPoints([]);
                setIsDrawingMode(true);
              }}
              style={styles.controlButton}
            >
              <AppIcon color={palette.ink} name="pencil" size={14} />
              <Text style={styles.controlButtonText}>Draw Area</Text>
            </Pressable>
          )}
        </View>
      )}

      {children}
    </View>
  );
}

/** Map chrome (markers, drawing banner, controls) follows the light/dark palette. */
const makeStyles = (p: Palette) =>
  StyleSheet.create({
    container: {
      flex: 1,
      overflow: 'hidden',
      position: 'relative',
    },
    markerBubble: {
      ...shadow.sm,
      backgroundColor: p.surface,
      borderRadius: radius.card,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderWidth: 1.5,
      borderColor: p.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    markerBubbleSelected: {
      ...shadow.md,
      backgroundColor: p.primary,
      borderColor: p.surface,
      transform: [{ scale: 1.15 }],
    },
    markerPrice: {
      fontSize: 13,
      fontWeight: '700',
      color: p.ink,
    },
    markerPriceSelected: {
      color: p.surfaceContainerLowest,
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
      borderTopColor: p.primary,
      marginTop: -1,
    },
    instructionBanner: {
      ...shadow.md,
      position: 'absolute',
      top: 14,
      left: space.x4,
      right: space.x4,
      backgroundColor: p.surface,
      borderColor: p.border,
      borderWidth: 1,
      borderRadius: 14,
      paddingLeft: space.x4,
      paddingRight: space.x1,
      paddingVertical: space.x1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: space.x2,
    },
    instructionText: {
      color: p.ink,
      fontSize: 13,
      fontWeight: '600',
      flex: 1,
    },
    cancelButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: space.x1,
      minHeight: 44,
      backgroundColor: p.surfaceContainerHigh,
      borderRadius: radius.control,
      paddingHorizontal: space.x3,
    },
    cancelButtonText: {
      color: p.ink,
      fontSize: 13,
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
      gap: space.x2,
    },
    controlButton: {
      ...shadow.sm,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      minHeight: 44,
      backgroundColor: p.surface,
      paddingHorizontal: 14,
      borderRadius: radius.pill,
      borderWidth: 1.5,
      borderColor: p.border,
    },
    controlButtonText: {
      fontSize: 13,
      fontWeight: '700',
      color: p.ink,
    },
    clearButton: {
      ...shadow.sm,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      minHeight: 44,
      backgroundColor: p.error,
      paddingHorizontal: 14,
      borderRadius: radius.pill,
    },
    clearButtonText: {
      fontSize: 13,
      fontWeight: '700',
      color: p.surfaceContainerLowest,
    },
  });
