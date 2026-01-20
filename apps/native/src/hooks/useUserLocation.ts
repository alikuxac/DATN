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
  const regionRef = useRef<string | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (!token) return;
    // 1. Kết nối Socket
    socketRef.current = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket'],
    });

    const handleNewLocation = (lat: number, lng: number) => {
      // A. Update UI
      setUserLocation({ latitude: lat, longitude: lng });
      console.log(lat, lng)

      // B. Bắn Socket toạ độ
      socketRef.current?.emit('update_location', { lat, lng });

      // C. Tính toán & Join Region
      const newRegionId = getRegionFromGeoJSON(lat, lng);

      // Chỉ Join khi có Region hợp lệ VÀ khác với Region đang đứng
      if (newRegionId && newRegionId !== 'unknown' && newRegionId !== regionRef.current) {
        console.log(`📍 Phát hiện vùng mới: ${newRegionId}`);

        // Join Room mới
        socketRef.current?.emit('join_region', { regionId: newRegionId });

        // Update State & Redux
        regionRef.current = newRegionId;
        setCurrentRegion(newRegionId);
        dispatch(setRegionId(newRegionId));
      }
    };

    let sub: Location.LocationSubscription | null = null;

    const startTracking = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;


      const lastKnown = await Location.getLastKnownPositionAsync();
      if (lastKnown) {
        handleNewLocation(lastKnown.coords.latitude, lastKnown.coords.longitude);
      }

      try {
        const current = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        handleNewLocation(current.coords.latitude, current.coords.longitude);
      } catch (error) {
        console.warn('[useLocationTracking] Failed to get initial position:', error);
      }

      // 2. Theo dõi vị trí (Update mỗi 100m)
      sub = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.Balanced, distanceInterval: 100, timeInterval: 10000 },
        async (location) => {
          handleNewLocation(location.coords.latitude, location.coords.longitude);
        }
      );
    };

    startTracking();

    return () => {
      sub?.remove();
      socketRef.current?.disconnect();
    };
  }, [token, dispatch]);

  return { currentRegion, socket: socketRef.current, userLocation };
};