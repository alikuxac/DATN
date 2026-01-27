import booleanPointInPolygon from '@turf/boolean-point-in-polygon';
import { point } from '@turf/helpers';
import { normalizeRegionId } from '@repo/shared';

// Import file JSON đã tối ưu
const VIETNAM_GEOJSON = require('../../assets/geo/Provinces.json');

export const getRegionFromGeoJSON = (lat: number, lng: number): string => {
  try {
    const pt = point([lng, lat]); // Lưu ý thứ tự: [Lng, Lat]

    for (const feature of VIETNAM_GEOJSON.features) {
      if (booleanPointInPolygon(pt, feature as any)) {
        // 👇 Key trong file của bạn là "TinhThanh"
        const regionName = feature.properties?.TinhThanh;
        if (regionName) {
          return normalizeRegionId(regionName);
        }
      }
    }
    return 'unknown';
  } catch (error) {
    console.error("GeoJSON Error:", error);
    return 'unknown';
  }
};

export const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371e3; // Earth radius in meters
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
    Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in meters
};