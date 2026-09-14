import { TextInput, View, type StyleProp, type TextInputProps, type ViewStyle } from "react-native";
import { useBreakpoint } from "@/hooks/use-breakpoint";
import { fontFamily, radius, shell } from "@/theme";
import { Txt } from "./Txt";

export type TextFieldProps = TextInputProps & { label?: string; style?: StyleProp<ViewStyle>; inputStyle?: TextInputProps["style"]; error?: string };

export function TextField({ label, style, inputStyle, error, multiline, ...rest }: TextFieldProps) {
  const { fs } = useBreakpoint();
  return (
    <View style={[{ gap: 8 }, style]}>
      {label ? (
        <Txt variant="control" weight="500">
          {label}
        </Txt>
      ) : null}
      <TextInput
        placeholderTextColor={shell.muted}
        multiline={multiline}
        {...rest}
        style={[
          {
            minHeight: multiline ? 96 : 50,
            fontSize: fs("control"),
            color: shell.ink,
            borderWidth: 1,
            borderColor: error ? shell.danger : shell.inputBorder,
            borderRadius: radius.sm,
            paddingHorizontal: 14,
            paddingVertical: 11,
            backgroundColor: "#fff",
            textAlignVertical: multiline ? "top" : "center",
          },
          fontFamily ? { fontFamily } : null,
          inputStyle,
        ]}
      />
      {error ? (
        <Txt variant="meta" color={shell.danger}>
          {error}
        </Txt>
      ) : null}
    </View>
  );
}
