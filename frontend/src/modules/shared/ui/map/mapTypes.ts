import type React from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import type { Coordinate } from '@/modules/shared/utils/geoPolygon';

// Props shared by the native (`UniversalMapView.tsx`) and web (`UniversalMapView.web.tsx`) map views.

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

/** Austin, TX: shown until a caller passes a region or a centre. */
export const DEFAULT_REGION = {
  latitude: 30.2672,
  longitude: -97.7431,
  latitudeDelta: 0.12,
  longitudeDelta: 0.12,
};
