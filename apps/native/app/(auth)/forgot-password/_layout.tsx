import { Stack } from 'expo-router';

export default function ForgotPasswordLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="verify" />
      <Stack.Screen name="reset" />
    </Stack>
  );
}
