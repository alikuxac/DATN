import React, { useEffect } from 'react';
import { Pressable, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolateColor,
} from 'react-native-reanimated';
import { cn } from '@/utils';
import { cva } from 'class-variance-authority';

interface SwitchProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  trackClassName?: string;
  thumbClassName?: string;
}

const switchVariants = cva(
  'relative rounded-full border-2 border-transparent',
  {
    variants: {
      size: {
        sm: 'w-10 h-6',
        md: 'w-12 h-7',
        lg: 'w-14 h-8',
      },
      disabled: {
        true: 'opacity-50',
        false: '',
      },
    },
    defaultVariants: {
      size: 'md',
      disabled: false,
    },
  }
);

const thumbVariants = cva(
  'absolute rounded-full bg-white shadow-sm',
  {
    variants: {
      size: {
        sm: 'w-4 h-4 top-0.5',
        md: 'w-5 h-5 top-0.5',
        lg: 'w-6 h-6 top-0.5',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  }
);

const getTrackSize = (size: string) => {
  switch (size) {
    case "sm":
      return { width: 40, height: 24, borderRadius: 999 };
    case "lg":
      return { width: 56, height: 32, borderRadius: 999 };
    default:
      return { width: 48, height: 28, borderRadius: 999 }; // md
  }
};

// Helper lấy kích thước Thumb (Nút tròn)
const getThumbSize = (size: string) => {
  switch (size) {
    case 'sm': return { width: 16, height: 16, top: 2 };
    case 'lg': return { width: 24, height: 24, top: 2 };
    default: return { width: 20, height: 20, top: 2 }; // md
  }
};

// Max Translate X (Khoảng cách di chuyển)
const getMaxTranslate = (size: string) => {
  switch (size) {
    case 'sm': return 16; // 40 - 16 - 4(padding) = ~20
    case 'lg': return 24;
    default: return 20;
  }
};

export default function Switch({
  value,
  onValueChange,
  disabled = false,
  size = 'md',
  className,
  trackClassName,
  thumbClassName,
}: SwitchProps) {
  const translateX = useSharedValue(value ? 1 : 0);
  const scale = useSharedValue(1);

  useEffect(() => {
    translateX.value = withSpring(value ? 1 : 0, {
      damping: 15,
      stiffness: 150,
    });
  }, [value, translateX]);

  const trackAnimatedStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      translateX.value,
      [0, 1],
      ['rgb(113, 113, 122)', 'rgb(232, 90, 90)'] // neutrals500 to primary
    );

    return {
      backgroundColor,
    };
  });

  const thumbAnimatedStyle = useAnimatedStyle(() => {
    const maxTranslateX = size === 'sm' ? 16 : size === 'md' ? 20 : 24;
    
    return {
      transform: [
        {
          translateX: translateX.value * maxTranslateX,
        },
        {
          scale: scale.value,
        },
      ],
    };
  });

  const handlePress = () => {
    if (disabled) return;
    
    scale.value = withSpring(0.95, { damping: 15, stiffness: 300 }, () => {
      scale.value = withSpring(1, { damping: 15, stiffness: 300 });
    });
    
    onValueChange(!value);
  };

  const trackSizeStyle = getTrackSize(size);
  const thumbSizeStyle = getThumbSize(size);

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled}
      // Dùng style container để đảm bảo Pressable nhận kích thước
      style={{
        opacity: disabled ? 0.5 : 1,
        ...trackSizeStyle,
        justifyContent: "center",
      }}
    >
      <Animated.View
        style={[
          trackAnimatedStyle,
          trackSizeStyle, // 👇 Quan trọng: Ép kích thước bằng style
          {
            justifyContent: "center",
            paddingHorizontal: 2, // Padding nhỏ cho thumb
            borderWidth: 2,
            borderColor: "transparent",
          },
        ]}
        className={cn(className, trackClassName)}
      >
        <Animated.View
          style={[
            thumbAnimatedStyle,
            {
              width: thumbSizeStyle.width,
              height: thumbSizeStyle.height,
              borderRadius: 999,
              backgroundColor: "white",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.2,
              shadowRadius: 1.41,
              elevation: 2,
              // position: 'absolute', // Bỏ absolute để dùng flex row nếu cần, nhưng ở đây absolute trong track cũng ổn
              // top: thumbSizeStyle.top
            },
          ]}
          className={cn(thumbClassName)}
        />
      </Animated.View>
    </Pressable>
  );
}
