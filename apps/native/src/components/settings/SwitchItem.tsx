import React from "react";
import { View, StyleSheet } from "react-native";
import { AppText, Icon } from "@/components/ui";
import Switch from "@/components/ui/Switch";
import { useColors } from "@/hooks/useColors";

interface SwitchItemProps {
  label: string;
  description?: string;
  value: boolean;
  onToggle: () => void;
  icon: string;
  isLast?: boolean;
}

export const SwitchItem = ({
  label,
  description,
  value,
  onToggle,
  icon,
  isLast,
}: SwitchItemProps) => {
  const colors = useColors();

  return (
    <View
      style={[
        styles.row,
        !isLast && { borderBottomWidth: 1, borderBottomColor: colors.border },
      ]}
    >
      <View
        style={{ flexDirection: "row", alignItems: "center", flex: 1, gap: 12 }}
      >
        <View style={[styles.iconBox, { backgroundColor: colors.background }]}>
          <Icon name={icon as any} size={20} color={colors.foreground} />
        </View>
        <View style={{ flex: 1 }}>
          <AppText
            style={{
              fontSize: 16,
              fontWeight: "500",
              color: colors.foreground,
            }}
          >
            {label}
          </AppText>
          {description && (
            <AppText
              style={{ fontSize: 12, color: colors.neutrals500, marginTop: 2 }}
            >
              {description}
            </AppText>
          )}
        </View>
      </View>
      <Switch value={value} onValueChange={onToggle} />
    </View>
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
