import { View } from "react-native";

import { AppText } from "../ui";
import { expo } from '../../../app.json';
import AuthHeaderActions from "./AuthHeaderActions";

export default function AuthHeader() {
  return (
    <View className="mb-8">
      {/* Actions ở góc trên bên phải */}
      <View className="items-end mb-4">
        <AuthHeaderActions />
      </View>

      {/* Logo và Title ở giữa */}
      <View className="items-center">
        <View className="w-20 h-20 bg-primary/10 rounded-3xl items-center justify-center mb-4">
          <AppText variant="display1">💧</AppText>
        </View>
        <AppText variant="heading1" weight="bold" className="mb-1">
          {expo.name}
        </AppText>
        <AppText variant="body" color="muted" align="center">
          Emergency Relief Network
        </AppText>
      </View>
    </View>
  );
}
