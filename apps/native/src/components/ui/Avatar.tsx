import React, { useState } from "react";
import { View, Text, Image, ImageSourcePropType } from "react-native";
import { cn } from "@/utils";
import { cva, type VariantProps } from "class-variance-authority";
import { useColors } from "@/hooks/useColors";
import { getDiceBearUrl, getInitials } from "@/utils/avatar";

// --- 3. Định nghĩa Variants (Giữ nguyên logic của bạn) ---
const avatarVariants = cva(
  "rounded-full items-center justify-center overflow-hidden bg-gray-100", // Thêm bg-gray-100 để đẹp khi loading
  {
    variants: {
      size: {
        sm: "w-8 h-8",
        md: "w-12 h-12",
        lg: "w-16 h-16",
        xl: "w-20 h-20",
      },
      variant: {
        default: "bg-neutrals700",
        primary: "bg-primary",
        secondary: "bg-secondary",
      },
    },
    defaultVariants: {
      size: "md",
      variant: "default",
    },
  }
);

const avatarTextVariants = cva("font-sans-semibold text-center", {
  variants: {
    size: {
      sm: "text-xs",
      md: "text-sm",
      lg: "text-lg",
      xl: "text-xl",
    },
    variant: {
      default: "text-white", // Đổi mặc định thành trắng cho nổi trên nền tối
      primary: "text-white",
      secondary: "text-neutrals800",
    },
  },
  defaultVariants: {
    size: "md",
    variant: "default",
  },
});

const getIconSize = (size: "sm" | "md" | "lg" | "xl"): number => {
  switch (size) {
    case "sm":
      return 12;
    case "md":
      return 20;
    case "lg":
      return 28;
    case "xl":
      return 36;
    default:
      return 20;
  }
};

// --- 4. Interface Props ---
interface AvatarProps extends VariantProps<typeof avatarVariants> {
  className?: string;
  textClassName?: string;
  text?: string; // Tên user (dùng để tạo avatar hoặc lấy initials)
  source?: ImageSourcePropType | string; // Cho phép truyền cả URL string
  icon?: React.ReactElement;
  alt?: string;
}

// --- 5. Main Component ---
export default function Avatar({
  size = "md",
  variant = "default",
  className,
  textClassName,
  text,
  source,
  icon,
  alt,
}: AvatarProps) {
  const colors = useColors();
  const [imageError, setImageError] = useState(false);

  // Logic xác định nguồn ảnh:
  // Nếu có 'source' (ảnh thật) -> dùng source
  // Nếu không có 'source' nhưng có 'text' -> dùng DiceBear
  // Lưu ý: Nếu imageError = true (ảnh lỗi), ta sẽ bỏ qua bước này để render Initials
  const imageSource = React.useMemo(() => {
    if (imageError) return null;

    if (source) {
      return typeof source === "string" ? { uri: source } : source;
    }

    if (text) {
      return { uri: getDiceBearUrl(text) };
    }

    return null;
  }, [source, text, imageError]);

  const renderContent = () => {
    // 1. Ưu tiên hiển thị Ảnh (Upload hoặc DiceBear)
    if (imageSource) {
      return (
        <Image
          source={imageSource as ImageSourcePropType}
          style={{ width: "100%", height: "100%" }}
          resizeMode="cover"
          accessibilityLabel={alt || text || "Avatar"}
          // Quan trọng: Nếu load ảnh lỗi -> set state để chuyển sang render Initials/Icon
          onError={() => setImageError(true)}
        />
      );
    }

    // 2. Nếu không có ảnh hoặc ảnh lỗi -> Hiển thị Icon (nếu có)
    if (icon) {
      return React.cloneElement(icon as any, {
        size: getIconSize(size || "md"),
        color:
          variant === "default"
            ? colors.foreground
            : variant === "primary"
              ? colors.primaryForeground
              : colors.secondaryForeground,
      });
    }

    // 3. Cuối cùng -> Hiển thị chữ cái đầu (Initials)
    if (text) {
      return (
        <Text
          className={cn(avatarTextVariants({ size, variant }), textClassName)}
        >
          {getInitials(text)}
        </Text>
      );
    }

    return null;
  };

  return (
    <View className={cn(avatarVariants({ size, variant }), className)}>
      {renderContent()}
    </View>
  );
}
