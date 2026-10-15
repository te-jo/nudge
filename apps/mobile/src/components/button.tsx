import { Pressable, Text, type PressableProps } from "react-native";

import { useOnCream } from "@/components/window-modal";

type Variant = "primary" | "secondary" | "destructive";

// The light gray fill and dark gray outline come from the room illustrations
// (see tailwind.config.js).
// Every variant has a 2px border so filled and outlined buttons line up.
const VARIANT_STYLES: Record<Variant, { container: string; text: string }> = {
  primary: { container: "border-mist bg-mist active:border-mist-dark active:bg-mist-dark", text: "text-ink" },
  // Outlined, so its text sits on whatever is behind it — see below.
  secondary: { container: "border-ink active:bg-ink/10 dark:border-white", text: "text-ink dark:text-white" },
  destructive: { container: "border-red-600 bg-red-600 active:border-red-700 active:bg-red-700", text: "text-white" },
};

export function Button({
  title,
  variant = "primary",
  disabled,
  ...props
}: PressableProps & { title: string; variant?: Variant }) {
  const onCream = useOnCream();
  const styles = VARIANT_STYLES[variant];
  // Window cards are cream in both colour schemes, so no white outline or text there.
  const outlinedOnCream = onCream && variant === "secondary";
  const container = outlinedOnCream ? "border-ink active:bg-ink/10" : styles.container;
  const text = outlinedOnCream ? "text-ink" : styles.text;
  return (
    <Pressable
      disabled={disabled}
      className={`items-center justify-center rounded-xl border-2 px-4 py-3 ${container} ${disabled ? "opacity-50" : ""}`}
      {...props}>
      <Text className={`text-base font-semibold ${text}`}>{title}</Text>
    </Pressable>
  );
}
