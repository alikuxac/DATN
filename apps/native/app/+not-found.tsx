import { Link, Stack } from "expo-router";
import { View, Text, TouchableOpacity } from "react-native";
import { router } from "expo-router";
import { Icon, AppText, AppButton } from "@/components/ui";

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Oops!" }} />
      <View className="flex-1 items-center justify-center bg-white px-5">
        {/* Icon cảnh báo đơn giản */}
        <Icon
          name="Map"
          className="mb-6 h-24 w-24 items-center justify-center rounded-full bg-red-50"
        ></Icon>

        <AppText className="mb-2 text-center text-2xl font-bold text-gray-900">
          Không tìm thấy màn hình
        </AppText>

        <TouchableOpacity className="rounded-full bg-blue-600 px-8 py-3 active:bg-blue-700">
          <AppButton
            children={
              <AppText className="font-semibold text-white">
                Về Trang trước đó.
              </AppText>
            }
            onPress={() =>router.replace("/(tabs)")}
          />
        </TouchableOpacity>
      </View>
    </>
  );
}
