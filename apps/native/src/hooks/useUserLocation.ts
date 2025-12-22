import { useEffect, useState, useRef } from 'react';
import * as Location from 'expo-location';
import { io, Socket } from 'socket.io-client';
import { useAppDispatch } from '@/store/hooks';
import { setRegionId } from '@/store/slices/appSlice';
import { getRegionFromGeoJSON } from '../utils/geo';

const SOCKET_URL = 'https://laptop-api.alikuxac.xyz/notifications'; // Thay IP máy bạn
type UserLocation = {
  latitude: number;
  longitude: number;
};

export const useLocationTracking = (token: string | null) => {
  const [currentRegion, setCurrentRegion] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (!token) return;
    // 1. Kết nối Socket
    socketRef.current = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket'],
    });

    let sub: Location.LocationSubscription | null = null;

    const startTracking = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;

      // 2. Theo dõi vị trí (Update mỗi 100m)
      sub = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.Balanced, distanceInterval: 100, timeInterval: 10000 },
        async (location) => {
          const { latitude, longitude } = location.coords;
          setUserLocation({ latitude, longitude });

          // A. Gửi toạ độ để vẽ map (Nhẹ)
          socketRef.current?.emit('update_location', { lat: latitude, lng: longitude });

          // B. Tính toán Region (Local - Offline)
          const regionId = getRegionFromGeoJSON(latitude, longitude);

          // C. Nếu sang tỉnh khác -> Join room mới
          if (regionId && regionId !== 'unknown' && regionId !== currentRegion) {
            console.log(`📍 Chuyển vùng: ${regionId}`);
            socketRef.current?.emit('join_region', { regionId });
            setCurrentRegion(regionId);
            dispatch(setRegionId(regionId));
          }
        }
      );
    };

    startTracking();

    return () => {
      sub?.remove();
      socketRef.current?.disconnect();
    };
  }, [token, currentRegion]);

  return { currentRegion, socket: socketRef.current, userLocation };
};