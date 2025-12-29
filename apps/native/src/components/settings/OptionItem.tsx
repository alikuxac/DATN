import React from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import { AppText, Icon } from "@/components/ui";
import { useColors } from "@/hooks/useColors";

interface OptionItemProps {
  label: string;
  isSelected: boolean;
  onPress: () => void;
  icon?: string;
  flag?: string;
  isLast?: boolean;
  isDarkMode?: boolean;
}

export const OptionItem = ({
  label,
  isSelected,
  onPress,
  icon,
  flag,
  isLast,
  isDarkMode,
}: OptionItemProps) => {
  const colors = useColors();

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.row,
        !isLast && { borderBottomWidth: 1, borderBottomColor: colors.border },
      ]}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        {icon ? (
          <View
            style={[
              styles.iconBox,
              { backgroundColor: isDarkMode ? "#333" : "#f3f4f6" },
            ]}
          >
            <Icon name={icon as any} size={20} color={colors.foreground} />
          </View>
        ) : (
          <AppText style={{ fontSize: 24 }}>{flag}</AppText>
        )}
        <AppText style={{ fontSize: 16, color: colors.foreground }}>
          {label}
        </AppText>
      </View>
      {isSelected && <Icon name="Check" size={20} color={colors.primary} />}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
});
