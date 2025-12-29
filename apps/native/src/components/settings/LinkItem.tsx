import React from "react";
import { View, TouchableOpacity, StyleSheet, Linking } from "react-native";
import { AppText, Icon } from "@/components/ui";
import { useColors } from "@/hooks/useColors";

interface LinkItemProps {
  label: string;
  icon: string;
  url: string;
  isLast?: boolean;
}

export const LinkItem = ({ label, icon, url, isLast }: LinkItemProps) => {
  const colors = useColors();

  const handleOpenLink = async (url: string) => {
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    }
  };

  return (
    <TouchableOpacity
      onPress={() => handleOpenLink(url)}
      style={[
        styles.row,
        !isLast && { borderBottomWidth: 1, borderBottomColor: colors.border },
      ]}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        <Icon name={icon as any} size={20} color={colors.foreground} />
        <AppText style={{ fontSize: 16, color: colors.foreground }}>
          {label}
        </AppText>
      </View>
      <Icon name="ExternalLink" size={16} color={colors.neutrals400} />
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
});
