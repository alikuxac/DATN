import { Injectable } from '@nestjs/common';
import { isPointWithinRadius } from 'geolib';
import {
  IHelperGeoCurrent,
  IHelperGeoRules,
} from '../interfaces/helper.interface';

@Injectable()
export class HelperGeoService {
  inRadius(geoRule: IHelperGeoRules, geoCurrent: IHelperGeoCurrent): boolean {
    return isPointWithinRadius(
      { latitude: geoRule.latitude, longitude: geoRule.longitude },
      geoCurrent,
      geoRule.radiusInMeters,
    );
  }

  calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3; // Bán kính trái đất (mét)
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
}
