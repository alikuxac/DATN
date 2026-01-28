import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import * as Location from 'expo-location';
import { Alert } from 'react-native';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setRegionId } from '@/store/slices/appSlice';
import { getRegionFromGeoJSON } from '@/utils/geo';
import { useSocketContext } from './SocketContext';

type UserLocation = {
  latitude: number;
  longitude: number;
};

interface LocationContextType {
  userLocation: UserLocation | null;
  currentRegion: string | null;
  socket: any | null; 
  setActiveReportId: (id: string | null) => void;
}

const LocationContext = createContext<LocationContextType>({
  userLocation: null,
  currentRegion: null,
  socket: null,
  setActiveReportId: () => {},
});

export const useLocationContext = () => useContext(LocationContext);

export const LocationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token } = useAppSelector((state) => state.app);
  const { socket, isConnected, sendLocationUpdate } = useSocketContext();
  const [currentRegion, setCurrentRegion] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const regionRef = useRef<string | null>(null);
  const activeReportIdRef = useRef<string | null>(null);
  const dispatch = useAppDispatch();

  const setActiveReportId = (id: string | null) => {
    activeReportIdRef.current = id;
    console.log(`[LocationContext] Set Active Report ID: ${id}`);
  };

  useEffect(() => {
    if (!token) return;

    if (socket) {
      const handleNotification = (data: { title: string; message: string; type: string; data?: any }) => {
        console.log('[LocationContext] Notification received:', data);
        if (data.type === 'ASSIGNMENT') {
          Alert.alert(
            data.title || 'Nhiệm vụ mới',
            data.message || 'Bạn đã được chỉ định một nhiệm vụ cứu trợ mới.',
            [{ text: 'OK', style: 'default' }]
          );
        }
      };

      socket.on('notification', handleNotification);
      return () => {
        socket.off('notification', handleNotification);
      };
    }
  }, [token, socket]);

  useEffect(() => {
    if (!token) return;

    const handleNewLocation = (lat: number, lng: number) => {
      console.log(`[LocationContext] handleNewLocation: ${lat}, ${lng} | isConnected: ${isConnected}`);
      
      // A. Update UI
      setUserLocation({ latitude: lat, longitude: lng });

      // B. Emit Socket Location
      if (isConnected) {
        console.log(`[LocationContext] Emitting update_location to server...`);
        sendLocationUpdate(lat, lng, activeReportIdRef.current || undefined);
      }

      // C. Calculate & Join Region
      const newRegionId = getRegionFromGeoJSON(lat, lng);

      // Join only if region is valid AND different from current
      if (newRegionId && newRegionId !== 'unknown' && newRegionId !== regionRef.current) {
        console.log(`📍 Detected new region: ${newRegionId}`);

        // Join New Room
        if (socket && isConnected) {
            socket.emit('join_region', { regionId: newRegionId });
        }

        // Update State & Redux
        regionRef.current = newRegionId;
        setCurrentRegion(newRegionId);
        dispatch(setRegionId(newRegionId));
      }
    };

    let sub: Location.LocationSubscription | null = null;

    const startTracking = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
          console.warn('[LocationContext] Permission denied');
          return;
      }

      const lastKnown = await Location.getLastKnownPositionAsync();
      if (lastKnown) {
        handleNewLocation(lastKnown.coords.latitude, lastKnown.coords.longitude);
      }

      try {
        const current = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        handleNewLocation(current.coords.latitude, current.coords.longitude);
      } catch (error) {
        console.warn('[LocationContext] Failed to get initial position:', error);
      }

      // 2. Watch Position (Update every 10m or 5s)
      sub = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.Balanced, distanceInterval: 10, timeInterval: 5000 },
        async (location) => {
          handleNewLocation(location.coords.latitude, location.coords.longitude);
        }
      );
    };

    startTracking();

    return () => {
      if (sub) {
        sub.remove();
        console.log('[LocationContext] Tracking stopped');
      }
    };
  }, [token, socket, isConnected, dispatch]);

  return (
    <LocationContext.Provider value={{ userLocation, currentRegion, socket, setActiveReportId }}>
      {children}
    </LocationContext.Provider>
  );
};
