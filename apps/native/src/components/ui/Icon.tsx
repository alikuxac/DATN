import { icons } from "lucide-react-native";
import { cssInterop } from "nativewind";
import { memo, useMemo } from "react";
import { SvgProps } from "react-native-svg";

// Định nghĩa Props bao gồm cả props của SVG và NativeWind
export type IconName = keyof typeof icons;
export interface IconProps extends SvgProps {
  name: IconName;
  size?: number;
  color?: string;
  className?: string;
}

// 1. Tạo Base Component để render icon động
// Component này sẽ được cssInterop xử lý
const IconBase = ({ name, ...props }: IconProps) => {
  // Dùng useMemo ở đây để cache việc lookup icon (theo ý bạn)
  const LucideIcon = useMemo(() => {
    const icon = icons[name];
    if (!icon) console.warn(`Icon "${name}" not found in lucide-react-native`);
    return icon;
  }, [name]);

  if (!LucideIcon) return null;

  return <LucideIcon {...props} />;
};

cssInterop(IconBase, {
  className: {
    target: "style",
    nativeStyleToProp: {
      color: true,
      width: true,
      height: true,
    },
  },
});

const Icon = memo(IconBase);

Icon.displayName = "Icon";

export default Icon;
