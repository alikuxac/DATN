import { useRouter } from "expo-router";
import { useEffect } from "react";

export default function TabIndex() {
  const router = useRouter();

  useEffect(() => {
    // Navigate after mount to avoid "Attempted to navigate before mounting Root Layout" error
    // Use setImmediate or requestAnimationFrame to ensure we are in the next tick
    const timeout = setTimeout(() => {
      router.replace("/(tabs)/account");
    }, 0);
    
    return () => clearTimeout(timeout);
  }, []);

  return null;
}
