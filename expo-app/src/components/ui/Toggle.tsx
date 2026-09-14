import { Switch } from "react-native";
import { shell } from "@/theme";

export function Toggle({ value, onChange, accessibilityLabel, disabled }: { value: boolean; onChange: (value: boolean) => void; accessibilityLabel?: string; disabled?: boolean }) {
  return <Switch value={value} onValueChange={onChange} disabled={disabled} accessibilityLabel={accessibilityLabel} trackColor={{ false: "#c6d0c9", true: shell.green }} thumbColor="#fff" {...({ activeThumbColor: "#fff" } as object)} />;
}
