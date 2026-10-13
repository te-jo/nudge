import { Pressable, Text, type PressableProps } from "react-native";

import { useOnCream } from "@/components/window-modal";

type Variant = "primary" | "secondary" | "destructive";

const VARIANT_STYLES: Record<Variant, { container: string; text: string }> = {
  primary: { container: "bg-blue-600 active:bg-blue-700", text: "text-white" },
  secondary: {
    container: "bg-gray-100 active:bg-gray-200 dark:bg-gray-800 dark:active:bg-gray-700",
    text: "text-black dark:text-white",
  },
  destructive: { container: "bg-red-600 active:bg-red-700", text: "text-white" },
};

// Window cards are cream in both colour schemes, so secondary goes light-only there.
const SECONDARY_ON_CREAM = { container: "bg-white/70 active:bg-white", text: "text-black" };

export function Button({
  title,
  variant = "primary",
  disabled,
  ...props
}: PressableProps & { title: string; variant?: Variant }) {
  const onCream = useOnCream();
  const styles = onCream && variant === "secondary" ? SECONDARY_ON_CREAM : VARIANT_STYLES[variant];
  return (
    <Pressable
      disabled={disabled}
      className={`items-center justify-center rounded-xl px-4 py-3 ${styles.container} ${disabled ? "opacity-50" : ""}`}
      {...props}>
      <Text className={`text-base font-semibold ${styles.text}`}>{title}</Text>
    </Pressable>
  );
}
