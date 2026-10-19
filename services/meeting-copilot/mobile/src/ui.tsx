import type { ReactNode } from "react";
import { Pressable, Text } from "react-native";
import { s } from "./theme";

export function Button({
  title,
  onPress,
  primary,
  disabled,
}: {
  title: string;
  onPress: () => void;
  primary?: boolean;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: !!disabled }}
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [s.button, primary && s.primary, { opacity: disabled ? 0.45 : pressed ? 0.8 : 1 }]}
    >
      <Text style={[s.buttonText, primary && s.primaryText]}>{title}</Text>
    </Pressable>
  );
}

export function Muted({ children }: { children: ReactNode }) {
  return <Text style={s.muted}>{children}</Text>;
}
