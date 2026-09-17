import { Pressable, Text, type PressableProps } from "react-native";

type Variant = "primary" | "secondary" | "destructive";

const VARIANT_STYLES: Record<Variant, { container: string; text: string }> = {
  primary: { container: "bg-blue-600 active:bg-blue-700", text: "text-white" },
  secondary: {
    container: "bg-gray-100 active:bg-gray-200 dark:bg-gray-800 dark:active:bg-gray-700",
    text: "text-black dark:text-white",
  },
  destructive: { container: "bg-red-600 active:bg-red-700", text: "text-white" },
};

export function Button({
  title,
  variant = "primary",
  disabled,
  ...props
}: PressableProps & { title: string; variant?: Variant }) {
  const styles = VARIANT_STYLES[variant];
  return (
    <Pressable
      disabled={disabled}
      className={`items-center justify-center rounded-xl px-4 py-3 ${styles.container} ${disabled ? "opacity-50" : ""}`}
      {...props}>
      <Text className={`text-base font-semibold ${styles.text}`}>{title}</Text>
    </Pressable>
  );
}
