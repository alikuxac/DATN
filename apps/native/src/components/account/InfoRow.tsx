import React from "react";
import { View, StyleSheet } from "react-native";
import { AppText } from "@/components/ui";

interface InfoRowProps {
  label: string;
  value?: string | null;
  placeholder?: string;
  colors: any;
}

export const InfoRow = ({
  label,
  value,
  placeholder = "---",
  colors,
}: InfoRowProps) => (
  <View style={styles.container}>
    <AppText style={styles.label}>
      {label}
    </AppText>
    <AppText
      style={[
        styles.value,
        {
          color: value ? colors.foreground : colors.neutrals400,
        },
      ]}
    >
      {value || placeholder}
    </AppText>
  </View>
);

const styles = StyleSheet.create({
  container: { marginBottom: 12 },
  label: { fontSize: 13, color: "#9ca3af", marginBottom: 4 },
  value: {
    fontSize: 16,
    fontWeight: "500",
  },
});
