import { useColors } from "@/hooks/useColors.ts";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { ChevronLeft } from "lucide-react-native";
import React from "react";
import { NativeStackHeaderProps } from "@react-navigation/native-stack";
import { BottomTabHeaderProps } from "@react-navigation/bottom-tabs";
import { router } from "expo-router";
import { useAppSelector } from "@/store/hooks";
import { Icon } from "@/components/ui";

export default function CustomScreenHeader({
  navigation,
  route,
  options,
}: BottomTabHeaderProps) {
  const { theme } = useAppSelector((state) => state.app);
  const colors = useColors();

  const canGoBack = navigation.canGoBack();
  const back = canGoBack ? () => navigation.goBack() : undefined;

  return (
    <View
      className={
        "bg-background px-4 py-3 pt-safe-offset-3 flex-row items-center border-b border-neutrals1000"
      }
    >
      {options.headerLeft ? (
        options.headerLeft({ tintColor: colors.foreground, canGoBack: !!back })
      ) : back ? (
        <TouchableOpacity
          onPress={navigation.goBack}
          style={{ marginRight: 12 }}
        >
          <ChevronLeft size={24} color={colors.foreground} />
        </TouchableOpacity>
      ) : null}
      <Text
        className={"text-foreground text-lg font-sans-semibold flex-1"}
        numberOfLines={1}
      >
        {options.title || route.name}
      </Text>
      <TouchableOpacity
        onPress={() => router.push("/settings")}
        style={[
          styles.iconButton,
          { backgroundColor: theme === "dark" ? "#333" : "#f1f5f9" },
        ]}
      >
        <Icon name="Settings" size={24} color={colors.foreground} />
      </TouchableOpacity>
      {options.headerRight
        ? options.headerRight({
            tintColor: colors.foreground,
            canGoBack: !!back,
          })
        : null}
    </View>
  );
}

const styles = StyleSheet.create({
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
});
