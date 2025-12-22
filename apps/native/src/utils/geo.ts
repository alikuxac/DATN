import booleanPointInPolygon from '@turf/boolean-point-in-polygon';
import { point } from '@turf/helpers';
import { normalizeRegionId } from './string'; // Hàm normalize cũ của bạn

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