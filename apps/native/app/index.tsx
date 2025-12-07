import { useAppSelector } from "@/store/hooks";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import SignUpScreen from "./(auth)/sign-up";
import SignInScreen from "./(auth)/sign-in";

export default function HomeScreen() {
  const { token } = useAppSelector(state => state.app);

  if (!token) return <SignUpScreen />;

  return <SignInScreen />;
}