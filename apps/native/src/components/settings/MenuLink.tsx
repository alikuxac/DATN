import React from "react";
import { View, TouchableOpacity, StyleSheet, TouchableOpacityProps } from "react-native";
import { useRouter, Href } from "expo-router";
import { AppText, Icon } from "@/components/ui";
import { useAppSelector } from "@/store/hooks";
import { useColors } from "@/hooks/useColors";
import { cn } from "@/utils";

export interface MenuLinkProps extends TouchableOpacityProps {
  icon: string;
  label: string;
  subLabel?: string;
  href?: Href<string>;
  isDestructive?: boolean;
}

export const MenuLink = (prop: MenuLinkProps) => {
  const {
    icon,
    label,
    subLabel,
    href,
    isDestructive,
    onPress,
    style,
    ...props
  } = prop;
  const router = useRouter();
  const { theme } = useAppSelector((state) => state.app);
  const colors = useColors();

  const handlePress = (e: any) => {
    if (onPress) {
      onPress(e);
    } else if (href) {
      router.push(href);
    }
  };

  const iconBgColor = isDestructive
    ? "#fee2e2"
    : theme === "dark"
      ? "#333"
      : "#f3f4f6";

  const contentColor = isDestructive ? "#ef4444" : colors.foreground;

  return (
    <TouchableOpacity
      onPress={handlePress}
      style={[
        styles.menuItem,
        {
          borderBottomColor: theme === "dark" ? "#333" : "#f1f5f9",
          backgroundColor: isDestructive
            ? theme === "dark"
              ? "#331111"
              : "#fef2f2"
            : "transparent",
        },
        style,
      ]}
      {...props}
    >
      <View style={styles.menuLeft}>
        <View style={[styles.iconContainer, { backgroundColor: iconBgColor }]}>
          <Icon
            name={icon as any}
            className={cn(
              "w-5 h-5",
              isDestructive ? "text-red-500" : "text-foreground"
            )}
            size={20}
            color={contentColor}
          />
        </View>
        <View>
          <AppText style={[styles.menuLabel, { color: contentColor }]}>
            {label}
          </AppText>
          {subLabel ? (
            <AppText style={styles.subLabel}> {subLabel} </AppText>
          ) : null}
        </View>
      </View>

      {!isDestructive && (
        <Icon
          name="ChevronRight"
          size={20}
          color={colors.neutrals400}
          className="w-5 h-5 text-gray-400"
        />
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
  },
  menuLeft: { flexDirection: "row", alignItems: "center", gap: 14 },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  menuLabel: { fontSize: 16, fontWeight: "500" },
  subLabel: { fontSize: 12, color: "#94a3b8", marginTop: 2 },
});
