import { color as colors } from '@manabandhu/design-system';
import type React from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';
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
  mapType?: string;
  showsMapTypeControl?: boolean;
  showsUserLocationControl?: boolean;
  showsUserLocation?: boolean;
  showsZoomControl?: boolean;
  showsCompass?: unknown;
  showsScale?: unknown;
  padding?: unknown;
  camera?: { pitch?: number };
  annotations?: MapKitAnnotation[];
  overlays?: MapKitOverlay[];
  removeAnnotations: (annotations: MapKitAnnotation[]) => void;
  addAnnotations: (annotations: MapKitAnnotation[]) => void;
  removeOverlays?: (overlays: MapKitOverlay[]) => void;
  addOverlay?: (overlay: MapKitOverlay) => void;
  setCenterAnimated: (coord: MapKitCoordinate, animated: boolean) => void;
  setRegionAnimated?: (region: unknown, animated?: boolean) => void;
}

interface MapKitNamespace {
  initialized?: boolean;
  init: (options: { authorizationCallback: (done: (token: string) => void) => void }) => void;
  Coordinate: new (lat: number, lng: number) => MapKitCoordinate;
  CoordinateSpan: new (latDelta: number, lngDelta: number) => unknown;
  CoordinateRegion: new (center: MapKitCoordinate, span: unknown) => unknown;
  Padding?: new (top: number, right: number, bottom: number, left: number) => unknown;
  Map: {
    new (container: HTMLElement, options: Record<string, unknown>): MapKitMap;
    MapTypes?: {
      Standard: string;
      Satellite: string;
      Hybrid: string;
    };
  };
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
    Visible?: unknown;
    Hidden?: unknown;
  };
}

// Global declaration for Google Maps, Apple MapKit JS, and Leaflet
declare global {
  interface Window {
    mapkit?: MapKitNamespace;
    // biome-ignore lint/suspicious/noExplicitAny: Dynamic script loader for Leaflet
    L?: any;
    // biome-ignore lint/suspicious/noExplicitAny: Dynamic script loader for Google Maps
    google?: any;
  }
}

function zoomFromDelta(delta: number): number {
  if (!delta || delta <= 0) return 13;
  const zoom = Math.round(Math.log(360 / delta) / Math.LN2);
  return Math.min(Math.max(zoom, 3), 18);
}

export function UniversalMapView({
  initialRegion = DEFAULT_REGION,
  markers = [],
  selectedMarkerId,
  onSelectMarker,
  style,
  showsUserLocation: _showsUserLocation = false,
  mapType = 'standard',
  is3D = false,
  centerCoordinate,
  children,
  enableDrawing = true,
  drawnPolygon = null,
  onPolygonComplete,
  onClearPolygon,
}: UniversalMapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mapEngine, setMapEngine] = useState<'google' | 'mapkit' | 'leaflet' | null>(null);
  const [mapReady, setMapReady] = useState(false);

  // Google Maps refs
  // biome-ignore lint/suspicious/noExplicitAny: Google Maps instance
  const googleMapRef = useRef<any>(null);
  // biome-ignore lint/suspicious/noExplicitAny: Google Maps custom overlays
  const googleOverlaysRef = useRef<any[]>([]);
  // biome-ignore lint/suspicious/noExplicitAny: Google Maps polygon
  const googlePolygonRef = useRef<any>(null);

  // Apple MapKit refs
  const mapkitInstanceRef = useRef<MapKitMap | null>(null);

  // Leaflet refs
  // biome-ignore lint/suspicious/noExplicitAny: Leaflet map instance
  const leafletMapRef = useRef<any>(null);
  // biome-ignore lint/suspicious/noExplicitAny: Leaflet layer group
  const leafletMarkersLayerRef = useRef<any>(null);
  // biome-ignore lint/suspicious/noExplicitAny: Leaflet polygon
  const leafletPolygonRef = useRef<any>(null);
  // biome-ignore lint/suspicious/noExplicitAny: Leaflet tile layer
  const leafletTileLayerRef = useRef<any>(null);

  // Drawing state
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [isPointerDown, setIsPointerDown] = useState(false);
  const [currentScreenPoints, setCurrentScreenPoints] = useState<Array<{ x: number; y: number }>>(
    [],
  );

  // Read environment keys and user map preference
  const googleMapsApiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY?.trim() || '';
  const appleMapsToken = process.env.EXPO_PUBLIC_APPLE_MAPS_TOKEN?.trim() || '';
  const preferredProvider = useMapPreferencesStore((s) => s.provider);

  // --------------------------------------------------------------------------
  // 1. Initialize Map: Google Maps (priority) > Apple MapKit > Leaflet/OSM
  // --------------------------------------------------------------------------
  useEffect(() => {
    let isMounted = true;

    // --- GOOGLE MAPS SETUP ---
    const setupGoogleMaps = () => {
      if (!isMounted || !containerRef.current || !window.google?.maps) return;

      if (googleMapRef.current) return;

      const map = new window.google.maps.Map(containerRef.current, {
        center: { lat: initialRegion.latitude, lng: initialRegion.longitude },
        zoom: zoomFromDelta(initialRegion.latitudeDelta),
        mapTypeId:
          mapType === 'satellite' || mapType === 'hybrid'
            ? window.google.maps.MapTypeId.HYBRID
            : window.google.maps.MapTypeId.ROADMAP,
        disableDefaultUI: false,
        zoomControl: true,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
      });

      googleMapRef.current = map;
      setMapEngine('google');
      setMapReady(true);
    };

    const loadGoogleMaps = () => {
      if (window.google?.maps) {
        setupGoogleMaps();
        return;
      }

      const existingScript = document.getElementById('google-maps-js-script');
      if (!existingScript) {
        const script = document.createElement('script');
        script.id = 'google-maps-js-script';
        script.src = `https://maps.googleapis.com/maps/api/js?key=${googleMapsApiKey}&libraries=geometry,places`;
        script.async = true;
        script.onload = () => {
          if (isMounted) setupGoogleMaps();
        };
        script.onerror = () => {
          console.warn('Google Maps script failed to load, trying next fallback.');
          if (appleMapsToken) loadMapKit();
          else loadLeaflet();
        };
        document.head.appendChild(script);
      } else {
        existingScript.addEventListener('load', () => {
          if (isMounted) setupGoogleMaps();
        });
      }
    };

    // --- APPLE MAPKIT SETUP ---
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
          showsUserLocation: true,
          showsUserLocationControl: true,
          showsCompass: window.mapkit.FeatureVisibility.Adaptive,
          showsZoomControl: true,
          showsMapTypeControl: true,
          showsScale: window.mapkit.FeatureVisibility.Adaptive,
        });

        mapkitInstanceRef.current = map;
        setMapEngine('mapkit');
        setMapReady(true);
      } catch (err) {
        console.warn('MapKit initialization error, falling back to Leaflet:', err);
        loadLeaflet();
      }
    };

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
          if (isMounted) loadLeaflet();
        };
        document.head.appendChild(script);
      } else {
        existingScript.addEventListener('load', () => {
          if (isMounted) setupMapKit();
        });
      }
    };

    // --- LEAFLET / OSM SETUP ---
    const setupLeaflet = () => {
      if (!isMounted || !containerRef.current) return;
      const L = window.L;
      if (!L) return;

      if (leafletMapRef.current) {
        try {
          leafletMapRef.current.remove();
        } catch {
          // ignore
        }
        leafletMapRef.current = null;
      }

      const initialZoom = zoomFromDelta(initialRegion.latitudeDelta);
      const map = L.map(containerRef.current, {
        center: [initialRegion.latitude, initialRegion.longitude],
        zoom: initialZoom,
        zoomControl: true,
      });

      const tileUrl =
        mapType === 'satellite' || mapType === 'hybrid'
          ? 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
          : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';

      const tileLayer = L.tileLayer(tileUrl, {
        maxZoom: 19,
        subdomains: 'abcd',
        attribution:
          mapType === 'satellite'
            ? 'Tiles &copy; Esri'
            : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
      }).addTo(map);

      leafletTileLayerRef.current = tileLayer;
      const markersLayer = L.layerGroup().addTo(map);
      leafletMarkersLayerRef.current = markersLayer;

      leafletMapRef.current = map;
      setMapEngine('leaflet');
      setMapReady(true);

      setTimeout(() => {
        if (isMounted && map) map.invalidateSize();
      }, 100);
    };

    const loadLeaflet = () => {
      if (!document.getElementById('leaflet-css')) {
        const link = document.createElement('link');
        link.id = 'leaflet-css';
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        link.crossOrigin = '';
        document.head.appendChild(link);
      }

      if (!document.getElementById('leaflet-custom-marker-css')) {
        const style = document.createElement('style');
        style.id = 'leaflet-custom-marker-css';
        style.textContent = `
          .custom-mb-map-marker {
            background: transparent !important;
            border: none !important;
          }
          .leaflet-container {
            font-family: inherit;
            width: 100%;
            height: 100%;
          }
        `;
        document.head.appendChild(style);
      }

      if (window.L) {
        setupLeaflet();
        return;
      }

      const existingScript = document.getElementById('leaflet-script');
      if (!existingScript) {
        const script = document.createElement('script');
        script.id = 'leaflet-script';
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.async = true;
        script.onload = () => {
          if (isMounted) setupLeaflet();
        };
        document.head.appendChild(script);
      } else {
        existingScript.addEventListener('load', () => {
          if (isMounted) setupLeaflet();
        });
      }
    };

    // Priority Selection: User Preference ('google' vs 'apple') > Key availability > Leaflet
    if (preferredProvider === 'apple' && appleMapsToken) {
      loadMapKit();
    } else if (preferredProvider === 'google' && googleMapsApiKey) {
      loadGoogleMaps();
    } else if (googleMapsApiKey) {
      loadGoogleMaps();
    } else if (appleMapsToken) {
      loadMapKit();
    } else {
      loadLeaflet();
    }

    return () => {
      isMounted = false;
      if (googleMapRef.current) {
        googleMapRef.current = null;
      }
      if (mapkitInstanceRef.current) {
        try {
          mapkitInstanceRef.current.destroy();
        } catch {
          // ignore
        }
        mapkitInstanceRef.current = null;
      }
      if (leafletMapRef.current) {
        try {
          leafletMapRef.current.remove();
        } catch {
          // ignore
        }
        leafletMapRef.current = null;
      }
    };
  }, [
    preferredProvider,
    googleMapsApiKey,
    appleMapsToken,
    initialRegion.latitude,
    initialRegion.longitude,
    initialRegion.latitudeDelta,
    initialRegion.longitudeDelta,
    mapType,
  ]);

  // --------------------------------------------------------------------------
  // 2. Sync Markers: Google Maps, MapKit, or Leaflet
  // --------------------------------------------------------------------------
  useEffect(() => {
    if (!mapReady) return;

    if (mapEngine === 'google' && googleMapRef.current && window.google?.maps) {
      const google = window.google;

      // Clear previous overlays
      for (const ov of googleOverlaysRef.current) {
        ov.setMap(null);
      }
      googleOverlaysRef.current = [];

      class PricePillOverlay extends google.maps.OverlayView {
        private markerItem: MapMarkerItem;
        private isSelected: boolean;
        private onSelect: (id: string) => void;
        private div: HTMLDivElement | null = null;
        // biome-ignore lint/suspicious/noExplicitAny: Google Maps LatLng
        private latLng: any;

        constructor(
          markerItem: MapMarkerItem,
          isSelected: boolean,
          onSelect: (id: string) => void,
        ) {
          super();
          this.markerItem = markerItem;
          this.isSelected = isSelected;
          this.onSelect = onSelect;
          this.latLng = new google.maps.LatLng(markerItem.latitude, markerItem.longitude);
        }

        onAdd() {
          const div = document.createElement('div');
          div.style.position = 'absolute';
          div.style.cursor = 'pointer';
          div.style.userSelect = 'none';
          div.style.zIndex = this.isSelected ? '999' : '100';

          const priceDisplay = this.markerItem.price ? `$${this.markerItem.price}` : '📍';
          const titleSnippet =
            this.markerItem.title.length > 18
              ? `${this.markerItem.title.slice(0, 18)}...`
              : this.markerItem.title;

          div.innerHTML = `
            <div style="
              display: inline-flex;
              align-items: center;
              gap: 6px;
              padding: 6px 12px;
              background-color: ${this.isSelected ? colors.primary : '#FFFFFF'};
              color: ${this.isSelected ? '#FFFFFF' : '#0F172A'};
              border: 1.5px solid ${this.isSelected ? colors.primary : '#CBD5E1'};
              border-radius: 22px;
              box-shadow: 0 4px 14px rgba(0,0,0,${this.isSelected ? '0.28' : '0.14'});
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              font-size: 12px;
              font-weight: 700;
              white-space: nowrap;
              transform: translate(-50%, -100%) ${this.isSelected ? 'scale(1.12)' : 'scale(1)'};
              transition: transform 0.15s ease, background-color 0.15s ease;
            ">
              <span style="color: ${this.isSelected ? '#FFFFFF' : colors.primary}; font-weight: 800;">${priceDisplay}</span>
              <span style="max-width: 120px; overflow: hidden; text-overflow: ellipsis;">${titleSnippet}</span>
            </div>
          `;

          div.addEventListener('click', (e) => {
            e.stopPropagation();
            this.onSelect(this.markerItem.id);
          });

          this.div = div;
          const panes = this.getPanes();
          panes?.overlayMouseTarget.appendChild(div);
        }

        draw() {
          const projection = this.getProjection();
          if (!projection || !this.div) return;
          const point = projection.fromLatLngToDivPixel(this.latLng);
          if (point) {
            this.div.style.left = `${point.x}px`;
            this.div.style.top = `${point.y}px`;
          }
        }

        onRemove() {
          if (this.div?.parentNode) {
            this.div.parentNode.removeChild(this.div);
            this.div = null;
          }
        }
      }

      const overlays = markers
        .filter((m) => m.latitude && m.longitude)
        .map((m) => {
          const isSelected = selectedMarkerId === m.id;
          const overlay = new PricePillOverlay(m, isSelected, (id) => onSelectMarker?.(id));
          overlay.setMap(googleMapRef.current);
          return overlay;
        });

      googleOverlaysRef.current = overlays;
    } else if (
      mapEngine === 'leaflet' &&
      leafletMapRef.current &&
      window.L &&
      leafletMarkersLayerRef.current
    ) {
      const L = window.L;
      const layer = leafletMarkersLayerRef.current;
      layer.clearLayers();

      for (const m of markers) {
        if (!m.latitude || !m.longitude) continue;
        const isSelected = selectedMarkerId === m.id;
        const priceDisplay = m.price ? `$${m.price}` : '📍';
        const titleSnippet = m.title.length > 18 ? `${m.title.slice(0, 18)}...` : m.title;

        const html = `
          <div style="
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 6px 12px;
            background-color: ${isSelected ? colors.primary : '#FFFFFF'};
            color: ${isSelected ? '#FFFFFF' : '#0F172A'};
            border: 1.5px solid ${isSelected ? colors.primary : '#CBD5E1'};
            border-radius: 22px;
            box-shadow: 0 4px 14px rgba(0,0,0,${isSelected ? '0.28' : '0.14'});
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: 12px;
            font-weight: 700;
            white-space: nowrap;
            cursor: pointer;
            transform: ${isSelected ? 'scale(1.12)' : 'scale(1)'};
            transition: transform 0.15s ease, background-color 0.15s ease;
            user-select: none;
          ">
            <span style="color: ${isSelected ? '#FFFFFF' : colors.primary}; font-weight: 800;">${priceDisplay}</span>
            <span style="max-width: 120px; overflow: hidden; text-overflow: ellipsis;">${titleSnippet}</span>
          </div>
        `;

        const icon = L.divIcon({
          className: 'custom-mb-map-marker',
          html,
          iconSize: [0, 0],
          iconAnchor: [45, 18],
        });

        const marker = L.marker([m.latitude, m.longitude], {
          icon,
          zIndexOffset: isSelected ? 1000 : 0,
        });

        marker.on('click', () => {
          onSelectMarker?.(m.id);
        });

        layer.addLayer(marker);
      }
    } else if (mapEngine === 'mapkit' && mapkitInstanceRef.current && window.mapkit) {
      const map = mapkitInstanceRef.current;
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
    }
  }, [markers, selectedMarkerId, mapReady, mapEngine, onSelectMarker]);

  // --------------------------------------------------------------------------
  // 3. Pan to selected marker
  // --------------------------------------------------------------------------
  useEffect(() => {
    if (!mapReady || !selectedMarkerId) return;
    const selected = markers.find((m) => m.id === selectedMarkerId);
    if (!selected?.latitude || !selected.longitude) return;

    if (mapEngine === 'google' && googleMapRef.current) {
      googleMapRef.current.panTo({
        lat: selected.latitude,
        lng: selected.longitude,
      });
    } else if (mapEngine === 'leaflet' && leafletMapRef.current) {
      leafletMapRef.current.panTo([selected.latitude, selected.longitude], { animate: true });
    } else if (mapEngine === 'mapkit' && mapkitInstanceRef.current && window.mapkit) {
      const center = new window.mapkit.Coordinate(selected.latitude, selected.longitude);
      const span = new window.mapkit.CoordinateSpan(0.04, 0.04);
      const region = new window.mapkit.CoordinateRegion(center, span);
      const map = mapkitInstanceRef.current;
      if (typeof map.setRegionAnimated === 'function') {
        map.setRegionAnimated(region);
      }
    }
  }, [selectedMarkerId, markers, mapReady, mapEngine]);

  // --------------------------------------------------------------------------
  // 4. Center coordinate updates (Recenter / GPS / City change)
  // --------------------------------------------------------------------------
  useEffect(() => {
    if (!centerCoordinate || !mapReady) return;

    if (mapEngine === 'google' && googleMapRef.current) {
      googleMapRef.current.panTo({
        lat: centerCoordinate.latitude,
        lng: centerCoordinate.longitude,
      });
    } else if (mapEngine === 'leaflet' && leafletMapRef.current) {
      leafletMapRef.current.setView(
        [centerCoordinate.latitude, centerCoordinate.longitude],
        leafletMapRef.current.getZoom(),
        { animate: true },
      );
    } else if (mapEngine === 'mapkit' && mapkitInstanceRef.current && window.mapkit) {
      const map = mapkitInstanceRef.current;
      const mapkit = window.mapkit;
      if (mapkit.Coordinate) {
        const coord = new mapkit.Coordinate(centerCoordinate.latitude, centerCoordinate.longitude);
        if (typeof map.setCenterAnimated === 'function') {
          map.setCenterAnimated(coord, true);
        } else if (
          typeof map.setRegionAnimated === 'function' &&
          mapkit.CoordinateRegion &&
          mapkit.CoordinateSpan
        ) {
          const span = new mapkit.CoordinateSpan(0.08, 0.08);
          map.setRegionAnimated(new mapkit.CoordinateRegion(coord, span), true);
        }
      }
    }
  }, [centerCoordinate, mapReady, mapEngine]);

  // --------------------------------------------------------------------------
  // 5. Sync mapType changes
  // --------------------------------------------------------------------------
  useEffect(() => {
    if (!mapReady) return;

    if (mapEngine === 'google' && googleMapRef.current && window.google?.maps) {
      const map = googleMapRef.current;
      map.setMapTypeId(
        mapType === 'satellite' || mapType === 'hybrid'
          ? window.google.maps.MapTypeId.HYBRID
          : window.google.maps.MapTypeId.ROADMAP,
      );
    } else if (mapEngine === 'leaflet' && leafletMapRef.current && leafletTileLayerRef.current) {
      const tileUrl =
        mapType === 'satellite' || mapType === 'hybrid'
          ? 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
          : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
      leafletTileLayerRef.current.setUrl(tileUrl);
    } else if (
      mapEngine === 'mapkit' &&
      mapkitInstanceRef.current &&
      window.mapkit?.Map?.MapTypes
    ) {
      const map = mapkitInstanceRef.current;
      const mapTypes = window.mapkit.Map.MapTypes;
      if (mapType === 'satellite') {
        map.mapType = mapTypes.Satellite;
      } else if (mapType === 'hybrid') {
        map.mapType = mapTypes.Hybrid;
      } else {
        map.mapType = mapTypes.Standard;
      }
    }
  }, [mapType, mapReady, mapEngine]);

  // --------------------------------------------------------------------------
  // 6. 3D Perspective Tilt
  // --------------------------------------------------------------------------
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.style.transition = 'transform 0.45s ease, filter 0.45s ease';
      containerRef.current.style.transform = is3D
        ? 'perspective(900px) rotateX(28deg) scale(1.04)'
        : 'none';
      containerRef.current.style.transformOrigin = '50% 80%';
    }

    if (mapEngine === 'mapkit' && mapkitInstanceRef.current && mapReady) {
      const map = mapkitInstanceRef.current;
      try {
        if (map.camera) {
          map.camera.pitch = is3D ? 55 : 0;
        } else if ('cameraPitch' in map) {
          (map as unknown as { cameraPitch: number }).cameraPitch = is3D ? 55 : 0;
        }
      } catch {
        // ignore
      }
    }
  }, [is3D, mapReady, mapEngine]);

  // --------------------------------------------------------------------------
  // 7. Sync drawnPolygon
  // --------------------------------------------------------------------------
  useEffect(() => {
    if (!mapReady) return;

    if (mapEngine === 'google' && googleMapRef.current && window.google?.maps) {
      if (googlePolygonRef.current) {
        googlePolygonRef.current.setMap(null);
        googlePolygonRef.current = null;
      }

      if (drawnPolygon && drawnPolygon.length >= 3) {
        const paths = drawnPolygon.map((p) => ({ lat: p.latitude, lng: p.longitude }));
        const poly = new window.google.maps.Polygon({
          paths,
          strokeColor: colors.primary,
          strokeOpacity: 0.9,
          strokeWeight: 2.5,
          fillColor: colors.primary,
          fillOpacity: 0.18,
          map: googleMapRef.current,
        });
        googlePolygonRef.current = poly;
      }
    } else if (mapEngine === 'leaflet' && leafletMapRef.current && window.L) {
      const L = window.L;
      const map = leafletMapRef.current;

      if (leafletPolygonRef.current) {
        try {
          map.removeLayer(leafletPolygonRef.current);
        } catch {
          // ignore
        }
        leafletPolygonRef.current = null;
      }

      if (drawnPolygon && drawnPolygon.length >= 3) {
        const latLngs = drawnPolygon.map((pt) => [pt.latitude, pt.longitude]);
        const poly = L.polygon(latLngs, {
          color: colors.primary,
          fillColor: colors.primary,
          fillOpacity: 0.18,
          weight: 2.5,
          dashArray: '6, 4',
        }).addTo(map);
        leafletPolygonRef.current = poly;
      }
    } else if (mapEngine === 'mapkit' && mapkitInstanceRef.current && window.mapkit) {
      const map = mapkitInstanceRef.current;
      const mapkit = window.mapkit;

      if (map.overlays && map.removeOverlays) {
        map.removeOverlays(map.overlays);
      }

      if (drawnPolygon && drawnPolygon.length >= 3 && mapkit?.PolygonOverlay && map.addOverlay) {
        const points = drawnPolygon.map((pt) => new mapkit.Coordinate(pt.latitude, pt.longitude));
        const styleObj = mapkit.Style
          ? new mapkit.Style({
              fillColor: 'rgba(13, 92, 117, 0.22)',
              strokeColor: colors.primary,
              lineWidth: 2.5,
            })
          : undefined;

        const overlay = new mapkit.PolygonOverlay(points, {
          style: styleObj,
        });
        map.addOverlay(overlay);
      }
    }
  }, [drawnPolygon, mapReady, mapEngine]);

  // --------------------------------------------------------------------------
  // 8. Draw to Filter Pointer Handlers
  // --------------------------------------------------------------------------
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
    const sampled = downsamplePoints(currentScreenPoints, 30);

    let coords: Coordinate[] = [];

    if (mapEngine === 'google' && googleMapRef.current && window.google?.maps) {
      const map = googleMapRef.current;
      const bounds = map.getBounds();
      if (bounds) {
        const ne = bounds.getNorthEast();
        const sw = bounds.getSouthWest();
        const latSpan = ne.lat() - sw.lat();
        const lngSpan = ne.lng() - sw.lng();
        coords = sampled.map((p) => ({
          latitude: ne.lat() - (p.y / rect.height) * latSpan,
          longitude: sw.lng() + (p.x / rect.width) * lngSpan,
        }));
      }
    } else if (mapEngine === 'leaflet' && leafletMapRef.current && window.L) {
      const map = leafletMapRef.current;
      const L = window.L;
      coords = sampled.map((p) => {
        const latLng = map.containerPointToLatLng(L.point(p.x, p.y));
        return {
          latitude: latLng.lat,
          longitude: latLng.lng,
        };
      });
    } else {
      const map = mapkitInstanceRef.current;
      const centerLat = map?.region?.center.latitude ?? initialRegion.latitude;
      const centerLng = map?.region?.center.longitude ?? initialRegion.longitude;
      const spanLat = map?.region?.span.latitudeDelta ?? initialRegion.latitudeDelta;
      const spanLng = map?.region?.span.longitudeDelta ?? initialRegion.longitudeDelta;

      coords = sampled.map((p) => ({
        latitude: centerLat + (0.5 - p.y / rect.height) * spanLat,
        longitude: centerLng + (p.x / rect.width - 0.5) * spanLng,
      }));
    }

    if (coords.length >= 3) {
      coords.push({ ...coords[0] });
      onPolygonComplete?.(coords);
    }

    setCurrentScreenPoints([]);
    setIsDrawingMode(false);
  }, [
    isDrawingMode,
    isPointerDown,
    currentScreenPoints,
    mapEngine,
    initialRegion.latitude,
    initialRegion.longitude,
    initialRegion.latitudeDelta,
    initialRegion.longitudeDelta,
    onPolygonComplete,
  ]);

  const polylineSvgString = useMemo(() => {
    if (currentScreenPoints.length === 0) return '';
    return currentScreenPoints.map((p) => `${p.x},${p.y}`).join(' ');
  }, [currentScreenPoints]);

  return (
    <View style={[styles.container, style]}>
      {/* Interactive Map Container */}
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
        }}
      />

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
            zIndex: 1000,
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
            zIndex: 1010,
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
            left: '14px',
            zIndex: 500,
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
});
