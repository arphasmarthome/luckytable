import { Text, type TextProps } from "react-native";
import { useBreakpoint, type TypeKey } from "@/hooks/use-breakpoint";
import { fontFamily, shell } from "@/theme";

const HEADINGS: TypeKey[] = ["hero", "page", "h1", "section", "h2", "h3", "timer"];

export type TxtProps = TextProps & {
  variant?: TypeKey;
  color?: string;
  weight?: "400" | "500" | "600" | "700";
  align?: "left" | "center" | "right";
  muted?: boolean;
};

/** Themed text: `variant` picks a size from the responsive type scale. */
export function Txt({ variant = "body", color, weight, align, muted, style, children, ...rest }: TxtProps) {
  const { fs } = useBreakpoint();
  const size = fs(variant);
  const heading = HEADINGS.includes(variant);
  const lineHeight = Math.round(size * (heading ? 1.3 : 1.5));
  return (
    <Text
      {...rest}
      style={[
        { fontSize: size, lineHeight, color: color ?? (muted ? shell.muted : shell.ink), fontWeight: weight ?? (heading ? "600" : "400"), textAlign: align },
        fontFamily ? { fontFamily } : null,
        style,
      ]}>
      {children}
    </Text>
  );
}
