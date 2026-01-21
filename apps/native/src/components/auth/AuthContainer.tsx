import React from 'react';
import {
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {cn} from '@/utils';

interface AuthContainerProps {
  children: React.ReactNode;
  className?: string;
}

export default function AuthContainer({children, className}: AuthContainerProps) {
  return (
    <SafeAreaView className="flex-1 bg-background relative">
      {/* Decorative Background Elements */}
      <View className="absolute top-[-100px] right-[-100px] w-64 h-64 bg-primary/10 rounded-full blur-3xl z-[-1]" />
      <View className="absolute bottom-[-50px] left-[-50px] w-80 h-80 bg-red-500/5 rounded-full blur-3xl z-[-1]" />
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1">
        <ScrollView
          contentContainerStyle={{flexGrow: 1}}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View className={cn('flex-1 px-6 py-8', className)}>
            {children}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
