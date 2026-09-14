import { Txt } from "./Txt";

export function EmptyNote({ children }: { children: string }) {
  return (
    <Txt variant="body" muted style={{ paddingVertical: 12 }}>
      {children}
    </Txt>
  );
}
