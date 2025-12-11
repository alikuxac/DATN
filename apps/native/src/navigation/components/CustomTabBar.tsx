import React from "react";
import { Dimensions, TouchableOpacity, View } from "react-native";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { useColors } from "@/hooks/useColors.ts";
// Import đúng các icon bạn cần dùng
import { Home, MapPin, FileText, User } from "lucide-react-native";
import { AppText } from "@/components/ui";
import { useTranslation } from "react-i18next";

const { width: screenWidth } = Dimensions.get("window");

interface TabIconProps {
  name: string;
  color: string;
  size: number;
}

// Map route name sang Icon tương ứng
const TabIcon: React.FC<TabIconProps> = ({ name, color, size }) => {
  switch (name) {
    case "map":
      return <MapPin size={size} color={color} />; // fill={color} tuỳ thuộc icon có hỗ trợ fill không
    case "reports":
      return <FileText size={size} color={color} />;
    case "account":
      return <User size={size} color={color} />;
    default:
      return <Home size={size} color={color} />;
  }
};

const CustomTabBar: React.FC<BottomTabBarProps> = ({
  state,
  descriptors,
  navigation,
}) => {
  const colors = useColors();
  const { t } = useTranslation();

  // Lọc bỏ route 'index' hoặc các route ẩn khác trước khi map
  // Trong Expo Router, route 'index' vẫn nằm trong state.routes dù set href: null
  const visibleRoutes = state.routes.filter(
    (route) =>
      route.name !== "index" &&
      route.name !== "_sitemap" &&
      route.name !== "+not-found"
  );

  return (
    <View
      className={
        "bg-background flex-row py-2 border-t border-neutrals900 pb-safe-offset-0"
      }
      style={{
        backgroundColor: "#ffffff", // Đảm bảo nền trắng
        paddingBottom: 20, // Padding đáy cho an toàn trên iOS (hoặc dùng pb-safe-offset)
        height: 80, // Chiều cao cố định nếu cần
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 5,
      }}
    >
      {visibleRoutes.map((route, index) => {
        // Lưu ý: Phải lấy index từ state gốc để check focused chính xác
        const originalIndex = state.routes.findIndex(
          (r) => r.key === route.key
        );
        const { options } = descriptors[route.key];

        const label =
          options.tabBarLabel !== undefined
            ? options.tabBarLabel
            : options.title !== undefined
              ? options.title
              : route.name;

        const isFocused = state.index === originalIndex;

        const onPress = () => {
          const event = navigation.emit({
            type: "tabPress",
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name, route.params);
          }
        };

        const onLongPress = () => {
          navigation.emit({
            type: "tabLongPress",
            target: route.key,
          });
        };

        // Màu sắc dựa trên trạng thái active
        const activeColor = "#2563eb"; // Màu xanh primary
        const inactiveColor = "#94a3b8"; // Màu xám

        const iconColor = isFocused ? activeColor : inactiveColor;
        const labelColor = isFocused ? activeColor : inactiveColor;

        return (
          <TouchableOpacity
            key={route.key}
            activeOpacity={0.9}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            testID={options.tabBarButtonTestID}
            onPress={onPress}
            onLongPress={onLongPress}
            style={{
              flex: 1,
              alignItems: "center",
              justifyContent: "center",
              paddingVertical: 4,
            }}
          >
            <View style={{ marginBottom: 4 }}>
              <TabIcon name={route.name} color={iconColor} size={24} />
            </View>

            <AppText
              style={{
                color: labelColor,
                fontSize: 12,
                fontFamily: isFocused
                  ? "SourceSans3-Bold"
                  : "SourceSans3-Medium",
                fontWeight: isFocused ? "700" : "500",
                textAlign: "center",
              }}
            >
              {/* Nếu label là function (từ _layout trả về) thì gọi function, nếu string thì translate */}
              {typeof label === "function"
                ? label({
                    focused: isFocused,
                    color: labelColor,
                    position: "below-icon",
                    children: "",
                  })
                : t(label as string).toUpperCase()}
            </AppText>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

export default CustomTabBar;
