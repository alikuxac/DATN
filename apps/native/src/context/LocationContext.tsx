import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import * as Location from 'expo-location';
import { io, Socket } from 'socket.io-client';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setRegionId } from '@/store/slices/appSlice';
import { getRegionFromGeoJSON } from '@/utils/geo';

const SOCKET_URL = `https://${process.env.EXPO_PUBLIC_API_URL}/notifications`;

type UserLocation = {
  latitude: number;
  longitude: number;
};

interface LocationContextType {
  userLocation: UserLocation | null;
  currentRegion: string | null;
  socket: Socket | null;
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
  const { token, user } = useAppSelector((state) => state.app);
  const [currentRegion, setCurrentRegion] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const regionRef = useRef<string | null>(null);
  const activeReportIdRef = useRef<string | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const dispatch = useAppDispatch();

  const setActiveReportId = (id: string | null) => {
    activeReportIdRef.current = id;
    console.log(`[LocationContext] Set Active Report ID: ${id}`);
  };

  useEffect(() => {
    console.log('[LocationContext] Init with token:', !!token);
    if (!token) return;

    // 1. Connect Socket
    socketRef.current = io(SOCKET_URL, {
      auth: { token },
      query: { userId: user?._id },
      transports: ['websocket'],
    });

    const handleNewLocation = (lat: number, lng: number) => {
      console.log(`[LocationContext] New Location: ${lat}, ${lng}`);
      
      // A. Update UI
      setUserLocation({ latitude: lat, longitude: lng });

      // B. Emit Socket Location
      socketRef.current?.emit('update_location', { 
        lat, 
        lng,
        reportId: activeReportIdRef.current 
      });

      // C. Calculate & Join Region
      const newRegionId = getRegionFromGeoJSON(lat, lng);

      // Join only if region is valid AND different from current
      if (newRegionId && newRegionId !== 'unknown' && newRegionId !== regionRef.current) {
        console.log(`📍 Detected new region: ${newRegionId}`);

        // Join New Room
        socketRef.current?.emit('join_region', { regionId: newRegionId });

        // Update State & Redux
        regionRef.current = newRegionId;
        setCurrentRegion(newRegionId);
        dispatch(setRegionId(newRegionId));
      }
    };

    let sub: Location.LocationSubscription | null = null;

    const startTracking = async () => {
      console.log('[LocationContext] Requesting permissions...');
      const { status } = await Location.requestForegroundPermissionsAsync();
      console.log('[LocationContext] Permission status:', status);
      
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
        console.log('[LocationContext] Initial position:', current?.coords);
        handleNewLocation(current.coords.latitude, current.coords.longitude);
      } catch (error) {
        console.warn('[LocationContext] Failed to get initial position:', error);
      }

      // 2. Watch Position (Update every 100m)
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
  }, [token, user?._id, dispatch]);

  return (
    <LocationContext.Provider value={{ userLocation, currentRegion, socket: socketRef.current, setActiveReportId }}>
      {children}
    </LocationContext.Provider>
  );
};
