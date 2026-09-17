import type { ReactNode } from "react";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// SafeAreaView doesn't support `className` (see AGENTS.md Styling Rules) —
// it only handles safe-area insets here; the inner View carries styling.
export function Screen({ children }: { children: ReactNode }) {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View className="flex-1 bg-white dark:bg-black">{children}</View>
    </SafeAreaView>
  );
}
