import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

interface GeoJSONPolygon {
  type: 'Polygon';
  coordinates: number[][][];
}

@ValidatorConstraint({ name: 'isValidPolygon', async: false })
export class IsValidPolygon implements ValidatorConstraintInterface {
  validate(boundary: unknown): boolean {
    if (!boundary || typeof boundary !== 'object') return false;

    const polygon = boundary as GeoJSONPolygon;

    if (polygon.type !== 'Polygon') return false;

    if (!Array.isArray(polygon.coordinates)) return false;
    if (!Array.isArray(polygon.coordinates[0])) return false;

    const ring = polygon.coordinates[0];
    if (ring.length < 4) return false;

    // GeoJSON spec: first and last coordinate must be identical (closed ring)
    const first = ring[0];
    const last = ring[ring.length - 1];
    if (first[0] !== last[0] || first[1] !== last[1]) return false;

    for (const coordinate of ring) {
      if (!Array.isArray(coordinate) || coordinate.length !== 2) return false;

      const [longitude, latitude] = coordinate;
      if (typeof longitude !== 'number' || typeof latitude !== 'number')
        return false;

      if (longitude < -180 || longitude > 180) return false;
      if (latitude < -90 || latitude > 90) return false;
    }

    return true;
  }

  defaultMessage(): string {
    return 'Boundary must be a valid GeoJSON Polygon with proper coordinates.';
  }
}
