# User Avatar Marker với Direction Indicator

Component hiển thị avatar người dùng trên map với indicator chỉ hướng thiết bị đang quay.

## Components

### UserAvatarMarker
Component marker hiển thị avatar với cone màu tím chỉ hướng.

**Props:**
- `userId: string` - ID của user
- `coordinate: [number, number]` - Tọa độ [longitude, latitude]
- `avatarUrl?: string` - URL avatar (optional, fallback về icon)
- `heading?: number` - Hướng thiết bị (0-360 degrees, 0 = Bắc)
- `onSelected?: () => void` - Callback khi marker được chọn

**Usage:**
```tsx
import { UserAvatarMarker } from '@/components/map/UserAvatarMarker';
import { useDeviceHeading } from '@/hooks/useDeviceHeading';

const MapScreen = () => {
  const { heading } = useDeviceHeading();
  
  return (
    <VietmapGL.MapView>
      <UserAvatarMarker
        userId="user-123"
        coordinate={[106.6297, 10.8231]} // [lng, lat]
        avatarUrl="https://example.com/avatar.jpg"
        heading={heading || 0}
        onSelected={() => console.log('User selected')}
      />
    </VietmapGL.MapView>
  );
};
```

## Hooks

### useDeviceHeading
Hook để lấy hướng thiết bị (compass heading).

**Returns:**
- `heading: number | null` - Hướng từ true north (0-360 degrees)
- `error: string | null` - Error message nếu có

**Usage:**
```tsx
const { heading, error } = useDeviceHeading();

if (error) {
  console.error('Heading error:', error);
}

console.log('Current heading:', heading); // e.g., 45 (Northeast)
```

### useLocationWithHeading
Hook để lấy vị trí và hướng thiết bị cùng lúc.

**Returns:**
- `location: { latitude, longitude, heading } | null`
- `error: string | null`

**Usage:**
```tsx
const { location, error } = useLocationWithHeading();

if (location) {
  console.log('Lat:', location.latitude);
  console.log('Lng:', location.longitude);
  console.log('Heading:', location.heading);
}
```

## Heading Values

Heading được tính theo độ từ hướng Bắc (true north):
- `0°` = Bắc (North)
- `90°` = Đông (East)
- `180°` = Nam (South)
- `270°` = Tây (West)

## Visual Design

- **Avatar**: Hình tròn 44x44px với border trắng 3px
- **Direction Cone**: Hình nón màu tím (`rgba(147, 51, 234, 0.25)`) chỉ hướng
- **Rotation**: Cone xoay theo heading value
- **Shadow**: Elevation 4 cho depth effect

## Permissions

Cần request permissions:
```tsx
import * as Location from 'expo-location';

const { status } = await Location.requestForegroundPermissionsAsync();
```

## Dependencies

- `@vietmap/vietmap-gl-react-native` - Map component
- `expo-location` - Location và heading tracking
- `react-native-svg` - SVG rendering cho cone

## Notes

- Cone luôn chỉ về phía trên (North) khi heading = 0
- Component tự động rotate cone theo heading value
- Nếu không có avatarUrl, hiển thị user icon placeholder
- Heading update real-time khi thiết bị xoay
