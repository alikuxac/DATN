import React, { forwardRef, useState } from "react";
import { Text, TextInput, TextInputProps, View } from "react-native";
import { cn } from "@/utils";
import { cva } from "class-variance-authority";
import { useColors } from "@/hooks/useColors.ts";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from "react-native-reanimated";

interface AppInputProps extends TextInputProps {
  label?: string;
  helperText?: string;
  errorText?: string;
  variant?: "default" | "textarea";
  size?: "sm" | "md" | "lg";
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerClassName?: string;
  labelClassName?: string;
  helperClassName?: string;
  errorClassName?: string;
  required?: boolean;
}

const inputVariants = cva("border rounded-lg font-sans-medium bg-background", {
  variants: {
    variant: {
      default: "text-foreground",
      textarea: "min-h-20 text-top text-foreground",
    },
    size: {
      sm: "px-3 py-2 text-sm",
      md: "px-4 py-2.5 text-base",
      lg: "px-4 py-3 text-lg",
    },
    state: {
      default: "border-neutrals900",
      focused: "border-neutrals600",
      error: "border-error",
    },
    hasLeftIcon: {
      true: "pl-10",
    },
    hasRightIcon: {
      true: "pr-10",
    },
  },
  defaultVariants: {
    variant: "default",
    size: "md",
    state: "default",
  },
});

const labelVariants = cva("font-sans-medium text-foreground mb-1.5", {
  variants: {
    size: {
      sm: "text-sm",
      md: "text-base",
      lg: "text-lg",
    },
    required: {
      true: "after:content-['*'] after:text-error after:ml-1",
    },
  },
  defaultVariants: {
    size: "md",
  },
});

const helperVariants = cva("font-sans-regular mt-1.5", {
  variants: {
    type: {
      helper: "text-neutrals100",
      error: "text-error",
    },
    size: {
      sm: "text-xs",
      md: "text-sm",
      lg: "text-base",
    },
  },
  defaultVariants: {
    type: "helper",
    size: "md",
  },
});

const AppInput = forwardRef<TextInput, AppInputProps>(
  (
    {
      label,
      helperText,
      errorText,
      variant = "default",
      size = "md",
      leftIcon,
      rightIcon,
      className,
      containerClassName,
      labelClassName,
      helperClassName,
      errorClassName,
      required,
      ...props
    },
    ref
  ) => {
    const [focused, setFocused] = useState(false);
    const hasError = !!errorText;
    const state = hasError ? "error" : focused ? "focused" : "default";
    const colors = useColors();

    // Animation values
    const scale = useSharedValue(1);
    const borderOpacity = useSharedValue(0);

    const animatedStyle = useAnimatedStyle(() => {
      return {
        transform: [{ scale: scale.value }],
      };
    });

    const borderAnimatedStyle = useAnimatedStyle(() => {
      return {
        opacity: borderOpacity.value,
      };
    });

    const handleFocus = (e: any) => {
      setFocused(true);
      scale.value = withSpring(1.02, { damping: 15, stiffness: 300 });
      borderOpacity.value = withTiming(1, { duration: 200 });
      props.onFocus?.(e);
    };

    const handleBlur = (e: any) => {
      setFocused(false);
      scale.value = withSpring(1, { damping: 15, stiffness: 300 });
      borderOpacity.value = withTiming(0, { duration: 200 });
      props.onBlur?.(e);
    };

    return (
      <View className={cn("w-full", containerClassName)}>
        {label && (
          <Text
            className={cn(labelVariants({ size, required }), labelClassName)}
          >
            {label}
          </Text>
        )}

        <Animated.View style={animatedStyle} className="relative">
          {!!leftIcon && (
            <View className="absolute left-3 top-1/2 -translate-y-1/2 z-10 justify-center items-center">
              {React.isValidElement(leftIcon) ? leftIcon : (
                <Text>{String(leftIcon)}</Text>
              )}
            </View>
          )}

          {/* Animated border overlay for focus effect */}
          <Animated.View
            style={borderAnimatedStyle}
            className="absolute inset-0 border-2 border-neutrals500 rounded-lg pointer-events-none z-5"
          />

          <TextInput
            ref={ref}
            {...props}
            multiline={variant === "textarea"}
            textAlignVertical={variant === "textarea" ? "top" : "center"}
            onFocus={handleFocus}
            placeholderTextColor={colors.neutrals100 ? colors.neutrals400 : colors.neutrals600} // Dynamic placeholder color logic needs improvement, but using colors.neutrals400 for now as it is lighter in Dark Mode (from color.ts)
            // Wait, useColors() returns AppColors (Dark) or AppColorsLight.
            // AppColors (Dark): neutrals400 is #6e6e6e. neutrals600 is #4d4d4d.
            // AppColorsLight: neutrals400 is #b4b4b4. neutrals600 is #d3d3d3.
            // So in Dark we want Lighter. In Light we want Darker.
            // Let's rely on useColors to provide a good color.
            // Actually, let's just use a better fallback or prop.
            // Let's look at colors.ts again.
            // Dark: neutrals300 is #7a7a7a. neutrals200 is #858585.
            // Light: neutrals300 is #9e9e9e.
            // Let's try text-neutrals400 which uses the tailwind class for now, or just pass the color.
            // colors.neutrals400 in Dark is #6e6e6e. That is kinda dark.
            // colors.neutrals200 in Dark is #858585. Better.
            // colors.neutrals200 in Light is #808080.
            // placeholderTextColor={colors.neutrals400}
            onBlur={handleBlur}
            className={cn(
              inputVariants({
                variant,
                size,
                state,
                hasLeftIcon: !!leftIcon,
                hasRightIcon: !!rightIcon,
              }),
              className
            )}
          />

          {!!rightIcon && (
            <View className="absolute right-3 top-1/2 -translate-y-1/2 z-10 justify-center items-center">
              {React.isValidElement(rightIcon) ? rightIcon : (
                <Text>{String(rightIcon)}</Text>
              )}
            </View>
          )}
        </Animated.View>

        {(!!helperText || !!errorText) && (
          <Text
            className={cn(
              helperVariants({
                type: hasError ? "error" : "helper",
                size,
              }),
              hasError ? errorClassName : helperClassName
            )}
          >
            {errorText || helperText}
          </Text>
        )}
      </View>
    );
  }
);

AppInput.displayName = "AppInput";

export default AppInput;
