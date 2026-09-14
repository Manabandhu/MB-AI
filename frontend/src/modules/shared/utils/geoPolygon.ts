export interface Coordinate {
  latitude: number;
  longitude: number;
}

export interface ScreenPoint {
  x: number;
  y: number;
}

/**
 * Determines whether a given coordinate point falls inside a closed polygon
 * using the Jordan curve / ray-casting algorithm.
 *
 * @param point - The {latitude, longitude} to test
 * @param polygon - An array of {latitude, longitude} forming the polygon boundary
 * @returns true if the point is strictly inside or on the boundary of the polygon
 */
export function isPointInPolygon(
  point: Coordinate,
  polygon: Coordinate[] | null | undefined,
): boolean {
  if (!polygon || polygon.length < 3) {
    return true; // No boundary restriction active
  }

  const { latitude: lat, longitude: lng } = point;
  if (!lat || !lng) return false;

  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].longitude;
    const yi = polygon[i].latitude;
    const xj = polygon[j].longitude;
    const yj = polygon[j].latitude;

    const intersect =
      yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi + 0.00000000001) + xi;

    if (intersect) {
      inside = !inside;
    }
  }

  return inside;
}

/**
 * Downsamples raw screen or coordinate points so the polygon remains smooth,
 * performant, and lightweight for maps rendering.
 */
export function downsamplePoints<T>(points: T[], maxPoints = 40): T[] {
  if (points.length <= maxPoints) return points;
  const step = Math.ceil(points.length / maxPoints);
  const result: T[] = [];
  for (let i = 0; i < points.length; i += step) {
    result.push(points[i]);
  }
  // Ensure the closing point is preserved
  if (result[result.length - 1] !== points[points.length - 1]) {
    result.push(points[points.length - 1]);
  }
  return result;
}
