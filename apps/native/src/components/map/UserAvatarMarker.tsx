import React, { useState, useMemo } from 'react';
import { View, Image, StyleSheet, Text } from 'react-native';
import { PointAnnotation } from '@vietmap/vietmap-gl-react-native';
import Svg, { Path } from 'react-native-svg';
import { getDiceBearUrl, getInitials } from '@/utils/avatar';

interface UserAvatarMarkerProps {
  userId: string;
  id?: string;
  coordinate: [number, number]; // [longitude, latitude] for VietMap
  avatarUrl?: string;
  userName?: string; // For DiceBear fallback
  heading?: number; // Device heading in degrees (0-360, 0 = North)
  isVolunteer?: boolean;
  isBusy?: boolean;
  onSelected?: () => void;
}

export const UserAvatarMarker = ({
  userId,
  coordinate,
  avatarUrl,
  userName = 'User',
  heading = 0,
  isVolunteer = false,
  isBusy = false,
  id,
  onSelected,
}: UserAvatarMarkerProps) => {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);

  const displayAvatar = useMemo(() => {
    // Helper to check valid HTTP string
    const isValidUrl = (url: any) => 
      url && 
      typeof url === 'string' && 
      url.trim().length > 0 && 
      url !== 'null' && 
      url !== 'undefined' &&
      url.startsWith('http');

    const validUserUrl = isValidUrl(avatarUrl) ? avatarUrl : null;

    // 1. If we have a user URL and it hasn't failed yet, use it.
    if (validUserUrl && failedUrl !== validUserUrl) {
        return validUserUrl;
    }

    // 2. Fallback to DiceBear
    const seed = userName && userName.trim().length > 0 ? userName : (userId || 'User');
    const diceBearUrl = getDiceBearUrl(seed);

    // 3. If DiceBear also failed, return null (to show Initials)
    if (failedUrl === diceBearUrl) {
        return null;
    }

    return diceBearUrl;
  }, [avatarUrl, userName, userId, failedUrl]);

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

        {/* Pin Container (Avatar + Tail) - Positioned to float ABOVE the center */}
        <View style={styles.pinWrapper}>
            {/* Avatar circle with status border */}
            <View 
              style={[
                styles.avatarContainer,
                isVolunteer && styles.volunteerBorder,
                isBusy && styles.busyBorder
              ]}
            >
              <View style={styles.avatarBorder}>
                {displayAvatar ? (
                  <Image
                    key={displayAvatar} // Force reload when URL changes
                    source={{ uri: displayAvatar }}
                    style={styles.avatar} // Explicit border radius handled by container
                    resizeMode="cover"
                    onError={() => {
                      if (displayAvatar) {
                          console.log(`[UserAvatarMarker] Image load error: ${displayAvatar}`);
                          setFailedUrl(displayAvatar);
                      }
                    }}
                  />
                ) : (
                  <View style={[styles.initialsContainer, isVolunteer && { backgroundColor: isBusy ? '#dc2626' : '#22c55e' }]}>
                    <Text style={styles.initialsText}>{getInitials(userName)}</Text>
                  </View>
                )}
              </View>
            </View>
            {/* Triangle Tail */}
            <View style={[
              styles.triangle, 
              isVolunteer && { borderTopColor: isBusy ? '#dc2626' : '#22c55e' }
            ]} />
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
    // backgroundColor: 'rgba(255,0,0,0.1)' // Debug: See touch area
  },
  directionCone: {
    position: 'absolute',
    width: 100,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  svg: {
    position: 'absolute',
  },
  pinWrapper: {
    position: 'absolute',
    bottom: 50, // This aligns the bottom of this wrapper to the center of the 100x100 container (which is the coordinate)
    alignItems: 'center',
    zIndex: 10,
  },
  avatarContainer: {
    width: 36, // Reduced from 44
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 5,
    borderWidth: 2, // Reduced from 3
    borderColor: '#fff',
    zIndex: 2,
  },
  volunteerBorder: {
    borderColor: '#22c55e', // green-500
  },
  busyBorder: {
    borderColor: '#dc2626', // red-600
  },
  avatarBorder: {
    width: 32, // Reduced from 38
    height: 32,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#f3f4f6',
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
  },
  initialsContainer: {
    width: '100%',
    height: '100%',
    backgroundColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  initialsText: {
    color: '#fff',
    fontSize: 12, // Reduced from 14
    fontWeight: 'bold',
  },
  triangle: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#fff', // Same as avatar border color
    marginTop: -1, // Slight overlap to prevent gaps
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2, // Subtle shadow for the tail
    shadowRadius: 1,
    elevation: 2,
    zIndex: 1,
  },
});
