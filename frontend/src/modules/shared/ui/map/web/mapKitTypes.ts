// Minimal Apple MapKit JS typings for the parts `UniversalMapView.web.tsx` uses.

export interface MapKitAnnotation {
  addEventListener: (type: string, listener: () => void) => void;
}

export interface MapKitCoordinate {
  latitude: number;
  longitude: number;
}

export interface MapKitOverlay {
  destroy?: () => void;
}

export interface MapKitMap {
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

export interface MapKitNamespace {
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
