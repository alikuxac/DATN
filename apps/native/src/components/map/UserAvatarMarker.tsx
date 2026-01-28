import React from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { PointAnnotation } from '@vietmap/vietmap-gl-react-native';
import Svg, { Path } from 'react-native-svg';
import { getDiceBearUrl } from '@/utils/avatar';

interface UserAvatarMarkerProps {
  userId: string;
  id?: string;
  coordinate: [number, number]; // [longitude, latitude] for VietMap
  avatarUrl?: string;
  userName?: string; // For DiceBear fallback
  heading?: number; // Device heading in degrees (0-360, 0 = North)
  onSelected?: () => void;
}

export const UserAvatarMarker = ({
  userId,
  coordinate,
  avatarUrl,
  userName = 'User',
  heading = 0,
  id,
  onSelected,
}: UserAvatarMarkerProps) => {
  // Always use DiceBear as fallback - same logic as Avatar component
  const displayAvatar = avatarUrl || getDiceBearUrl(userName);

  return (
    <PointAnnotation
      id={id || `user-${userId}`}
      coordinate={coordinate}
      onSelected={onSelected}
    >
      <View style={styles.container}>
        {/* Direction indicator (purple cone) - rotates based on heading */}
        {heading !== undefined && heading !== null && (
          <View
            style={[
              styles.directionCone,
              { transform: [{ rotate: `${heading}deg` }] },
            ]}
          >
            <Svg width="100" height="100" viewBox="0 0 100 100" style={styles.svg}>
              {/* Cone shape pointing upward (north) */}
              <Path
                d="M 50 50 L 25 15 A 35 35 0 0 1 75 15 Z"
                fill="rgba(147, 51, 234, 0.25)"
                stroke="rgba(147, 51, 234, 0.4)"
                strokeWidth="1.5"
              />
            </Svg>
          </View>
        )}

        {/* Avatar circle with white border */}
        <View style={styles.avatarContainer}>
          <View style={styles.avatarBorder}>
            <Image
              source={{ uri: displayAvatar }}
              style={styles.avatar}
              resizeMode="cover"
            />
          </View>
        </View>
      </View>
    </PointAnnotation>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 100,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  directionCone: {
    position: 'absolute',
    width: 100,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  svg: {
    position: 'absolute',
  },
  avatarContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
    borderWidth: 3,
    borderColor: '#fff',
  },
  avatarBorder: {
    width: 38,
    height: 38,
    borderRadius: 19,
    overflow: 'hidden',
    backgroundColor: '#f3f4f6',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e5e7eb',
  },
});
