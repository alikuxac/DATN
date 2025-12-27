import React, { useEffect } from "react";
import { Pressable } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolateColor,
} from "react-native-reanimated";
import { cn } from "@/utils";

// 1. Thêm định nghĩa trackColor vào Interface
interface SwitchProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
  trackClassName?: string;
  thumbClassName?: string;

  // 👇 THÊM CÁI NÀY: Để hỗ trợ custom màu
  trackColor?: {
    false?: string;
    true?: string;
  };
  thumbColor?: string; // Màu của cục tròn (nếu cần)
}

// ... Giữ nguyên các hàm helper getTrackSize, getThumbSize, getMaxTranslate ...
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

const getThumbSize = (size: string) => {
  switch (size) {
    case "sm":
      return { width: 16, height: 16, top: 2 };
    case "lg":
      return { width: 24, height: 24, top: 2 };
    default:
      return { width: 20, height: 20, top: 2 }; // md
  }
};

export default function Switch({
  value,
  onValueChange,
  disabled = false,
  size = "md",
  className,
  trackClassName,
  thumbClassName,
  // 👇 Lấy props màu ra, gán mặc định nếu không truyền
  trackColor = { false: "rgb(113, 113, 122)", true: "rgb(232, 90, 90)" },
  thumbColor = "white",
}: SwitchProps) {
  const translateX = useSharedValue(value ? 1 : 0);
  const scale = useSharedValue(1);

  // Colors mặc định (Fallback)
  const falseColor = trackColor.false || "rgb(113, 113, 122)"; // Màu xám khi tắt
  const trueColor = trackColor.true || "rgb(232, 90, 90)"; // Màu đỏ mặc định (cũ) khi bật

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
      [falseColor, trueColor] // 👇 Dùng màu từ props
    );

    return { backgroundColor };
  });

  const thumbAnimatedStyle = useAnimatedStyle(() => {
    const maxTranslateX = size === "sm" ? 16 : size === "md" ? 20 : 24;

    return {
      transform: [
        { translateX: translateX.value * maxTranslateX },
        { scale: scale.value },
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
      style={{
        opacity: disabled ? 0.5 : 1,
        ...trackSizeStyle,
        justifyContent: "center",
      }}
    >
      <Animated.View
        style={[
          trackAnimatedStyle,
          trackSizeStyle,
          {
            justifyContent: "center",
            paddingHorizontal: 2,
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
              backgroundColor: thumbColor, // 👇 Dùng màu thumb từ props
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.2,
              shadowRadius: 1.41,
              elevation: 2,
            },
          ]}
          className={cn(thumbClassName)}
        />
      </Animated.View>
    </Pressable>
  );
}
