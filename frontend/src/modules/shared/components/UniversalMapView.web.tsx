import { color as colors } from '@manabandhu/design-system';
import type React from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, Text, View } from 'react-native';
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
  children?: React.ReactNode;
  // Draw-to-filter props
  enableDrawing?: boolean;
  drawnPolygon?: Coordinate[] | null;
  onPolygonComplete?: (polygon: Coordinate[]) => void;
  onClearPolygon?: () => void;
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

interface MapKitOverlay {
  destroy?: () => void;
}

interface MapKitMap {
  destroy: () => void;
  region?: {
    center: MapKitCoordinate;
    span: { latitudeDelta: number; longitudeDelta: number };
  };
  annotations?: MapKitAnnotation[];
  overlays?: MapKitOverlay[];
  removeAnnotations: (annotations: MapKitAnnotation[]) => void;
  addAnnotations: (annotations: MapKitAnnotation[]) => void;
  removeOverlays?: (overlays: MapKitOverlay[]) => void;
  addOverlay?: (overlay: MapKitOverlay) => void;
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
  PolygonOverlay?: new (
    points: MapKitCoordinate[],
    options?: Record<string, unknown>,
  ) => MapKitOverlay;
  Style?: new (options: Record<string, unknown>) => unknown;
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
  enableDrawing = true,
  drawnPolygon = null,
  onPolygonComplete,
  onClearPolygon,
}: UniversalMapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<MapKitMap | null>(null);
  const [mapkitReady, setMapkitReady] = useState(false);
  const [mapkitError, setMapkitError] = useState<string | null>(null);

  // Drawing state
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [isPointerDown, setIsPointerDown] = useState(false);
  const [currentScreenPoints, setCurrentScreenPoints] = useState<Array<{ x: number; y: number }>>(
    [],
  );

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
    const mapkit = window.mapkit;

    if (map.annotations) {
      map.removeAnnotations(map.annotations);
    }

    const annotations = markers
      .filter((m) => m.latitude && m.longitude)
      .map((m) => {
        const coord = new mapkit.Coordinate(m.latitude, m.longitude);
        const isSelected = selectedMarkerId === m.id;

        const annotation = new mapkit.MarkerAnnotation(coord, {
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

  // 4. Sync drawnPolygon with Apple MapKit Overlays
  useEffect(() => {
    if (!mapInstanceRef.current || !window.mapkit || !mapkitReady) return;
    const map = mapInstanceRef.current;

    if (map.overlays && map.removeOverlays) {
      map.removeOverlays(map.overlays);
    }

    const mapkit = window.mapkit;
    if (drawnPolygon && drawnPolygon.length >= 3 && mapkit?.PolygonOverlay && map.addOverlay) {
      const points = drawnPolygon.map((pt) => new mapkit.Coordinate(pt.latitude, pt.longitude));
      const style = mapkit.Style
        ? new mapkit.Style({
            fillColor: 'rgba(13, 92, 117, 0.22)',
            strokeColor: colors.primary,
            lineWidth: 2.5,
          })
        : undefined;

      const overlay = new mapkit.PolygonOverlay(points, {
        style,
      });
      map.addOverlay(overlay);
    }
  }, [drawnPolygon, mapkitReady]);

  // Web Drawing Handlers
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDrawingMode) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setIsPointerDown(true);
    setCurrentScreenPoints([{ x, y }]);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDrawingMode || !isPointerDown) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setCurrentScreenPoints((prev) => [...prev, { x, y }]);
  };

  const handlePointerUp = useCallback(() => {
    if (!isDrawingMode || !isPointerDown) return;
    setIsPointerDown(false);

    if (currentScreenPoints.length < 5 || !containerRef.current) {
      setCurrentScreenPoints([]);
      return;
    }

    const rect = containerRef.current.getBoundingClientRect();
    const map = mapInstanceRef.current;

    // Use current active map region or fallback to initial region
    const centerLat = map?.region?.center.latitude ?? initialRegion.latitude;
    const centerLng = map?.region?.center.longitude ?? initialRegion.longitude;
    const spanLat = map?.region?.span.latitudeDelta ?? initialRegion.latitudeDelta;
    const spanLng = map?.region?.span.longitudeDelta ?? initialRegion.longitudeDelta;

    const sampled = downsamplePoints(currentScreenPoints, 30);
    const coords: Coordinate[] = sampled.map((p) => ({
      latitude: centerLat + (0.5 - p.y / rect.height) * spanLat,
      longitude: centerLng + (p.x / rect.width - 0.5) * spanLng,
    }));

    if (coords.length >= 3) {
      coords.push({ ...coords[0] });
      onPolygonComplete?.(coords);
    }

    setCurrentScreenPoints([]);
    setIsDrawingMode(false);
  }, [isDrawingMode, isPointerDown, currentScreenPoints, initialRegion, onPolygonComplete]);

  const polylineSvgString = useMemo(() => {
    if (currentScreenPoints.length === 0) return '';
    return currentScreenPoints.map((p) => `${p.x},${p.y}`).join(' ');
  }, [currentScreenPoints]);

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
                      color: isSelected ? '#ffffff' : '#0f172a',
                      fontWeight: 700,
                      fontSize: '12px',
                      cursor: 'pointer',
                    }}
                  >
                    {m.price ? `$${m.price}` : '📍'} {m.title.slice(0, 16)}...
                  </button>
                );
              })}
            </View>
          </View>
        </View>
      )}

      {/* Real-time Drawing Overlay Layer for Web */}
      {isDrawingMode && (
        <div
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 30,
            cursor: 'crosshair',
            userSelect: 'none',
            touchAction: 'none',
          }}
        >
          <svg style={{ width: '100%', height: '100%', pointerEvents: 'none' }} aria-hidden="true">
            {polylineSvgString ? (
              <polyline
                points={polylineSvgString}
                fill="rgba(13, 92, 117, 0.15)"
                stroke={colors.primary}
                strokeWidth={3}
                strokeDasharray="6, 4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ) : null}
          </svg>
        </div>
      )}

      {/* Floating Drawing Instruction Banner */}
      {isDrawingMode && (
        <div
          style={{
            position: 'absolute',
            top: '14px',
            left: '16px',
            right: '16px',
            backgroundColor: 'rgba(15, 23, 42, 0.92)',
            borderRadius: '14px',
            padding: '10px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            zIndex: 40,
            boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
          }}
        >
          <span
            style={{
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: 600,
            }}
          >
            ✏️ Click & drag to sketch a boundary around your search area
          </span>
          <button
            type="button"
            onClick={() => {
              setIsDrawingMode(false);
              setCurrentScreenPoints([]);
            }}
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              border: 'none',
              borderRadius: '8px',
              padding: '6px 12px',
              color: '#ffffff',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            ✕ Cancel
          </button>
        </div>
      )}

      {/* Floating Action Controls (Draw / Redraw / Clear) */}
      {enableDrawing && !isDrawingMode && (
        <div
          style={{
            position: 'absolute',
            top: '14px',
            right: '14px',
            zIndex: 20,
            display: 'flex',
            gap: '8px',
          }}
        >
          {drawnPolygon && drawnPolygon.length >= 3 ? (
            <>
              <button
                type="button"
                onClick={() => {
                  setCurrentScreenPoints([]);
                  setIsDrawingMode(true);
                }}
                style={{
                  backgroundColor: '#ffffff',
                  padding: '8px 14px',
                  borderRadius: '20px',
                  border: '1.5px solid #e2e8f0',
                  fontWeight: 700,
                  fontSize: '12px',
                  color: '#0f172a',
                  cursor: 'pointer',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
                }}
              >
                ✏️ Redraw
              </button>
              <button
                type="button"
                onClick={() => onClearPolygon?.()}
                style={{
                  backgroundColor: '#ef4444',
                  padding: '8px 14px',
                  borderRadius: '20px',
                  border: 'none',
                  fontWeight: 700,
                  fontSize: '12px',
                  color: '#ffffff',
                  cursor: 'pointer',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                }}
              >
                🗑️ Clear Area
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => {
                setCurrentScreenPoints([]);
                setIsDrawingMode(true);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: '#ffffff',
                padding: '9px 16px',
                borderRadius: '22px',
                border: '1.5px solid #e2e8f0',
                fontWeight: 700,
                fontSize: '13px',
                color: '#0f172a',
                cursor: 'pointer',
                boxShadow: '0 3px 8px rgba(0,0,0,0.14)',
              }}
            >
              <span>✏️</span>
              <span>Draw Area</span>
            </button>
          )}
        </div>
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
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#F8FAFC',
  },
  tokenPromptCard: {
    maxWidth: 440,
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    shadowColor: '#000',
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
  },
  tokenPromptSubtitle: {
    fontSize: 13,
    color: '#475569',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 18,
  },
  tokenPromptDetail: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 8,
  },
  codePill: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  codeText: {
    fontFamily: 'Courier',
    fontSize: 11,
    color: '#0D5C75',
    fontWeight: '600',
  },
  pinsPreviewRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
    marginTop: 8,
  },
});
