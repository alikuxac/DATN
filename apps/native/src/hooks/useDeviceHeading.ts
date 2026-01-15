import { useState, useEffect } from 'react';
import * as Location from 'expo-location';

interface LocationWithHeading {
  latitude: number;
  longitude: number;
  heading: number | null;
}

export const useDeviceHeading = () => {
  const [heading, setHeading] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let subscription: Location.LocationSubscription | null = null;

    const startWatchingHeading = async () => {
      try {
        // Request permissions
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setError('Location permission not granted');
          return;
        }

        // Watch heading (compass)
        subscription = await Location.watchHeadingAsync((headingData) => {
          // headingData.trueHeading: degrees from true north (0-360)
          // headingData.magHeading: degrees from magnetic north
          setHeading(headingData.trueHeading);
        });
      } catch (err: any) {
        setError(err?.message || 'Failed to get heading');
      }
    };

    startWatchingHeading();

    return () => {
      if (subscription) {
        subscription.remove();
      }
    };
  }, []);

  return { heading, error };
};

export const useLocationWithHeading = () => {
  const [location, setLocation] = useState<LocationWithHeading | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let locationSubscription: Location.LocationSubscription | null = null;
    let headingSubscription: Location.LocationSubscription | null = null;
    let currentHeading: number | null = null;

    const startWatching = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setError('Location permission not granted');
          return;
        }

        // Watch location
        locationSubscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            distanceInterval: 10, // Update every 10 meters
          },
          (locationData) => {
            setLocation({
              latitude: locationData.coords.latitude,
              longitude: locationData.coords.longitude,
              heading: currentHeading,
            });
          }
        );

        // Watch heading
        headingSubscription = await Location.watchHeadingAsync((headingData) => {
          currentHeading = headingData.trueHeading;
          setLocation((prev) =>
            prev
              ? { ...prev, heading: currentHeading }
              : null
          );
        });
      } catch (err: any) {
        setError(err?.message || 'Failed to get location/heading');
      }
    };

    startWatching();

    return () => {
      if (locationSubscription) {
        locationSubscription.remove();
      }
      if (headingSubscription) {
        headingSubscription.remove();
      }
    };
  }, []);

  return { location, error };
};
