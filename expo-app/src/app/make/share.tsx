/* Share: send tonight's dishes, hand off the missing-ingredient list (the cart), open the calendar. */
import { Platform, View } from "react-native";
import { Button, Chip, Page } from "@/components/ui";
import { useBreakpoint } from "@/hooks/use-breakpoint";
import { toast } from "@/store/toast";
import { make, radius } from "@/theme";
import { MakeHeader, useMakeNav } from "@/features/make/components/MakeHeader";
import { Grid, MCard, MTxt } from "@/features/make/components/ui";
import { dishById } from "@/features/make/data";
import { useMakeStore } from "@/features/make/store";
import { useMakeStrings } from "@/features/make/strings";

async function copyText(text: string) {
  if (Platform.OS === "web" && typeof navigator !== "undefined" && navigator.clipboard) {
    await navigator.clipboard.writeText(text);
    return;
  }
  throw new Error("clipboard unavailable");
}

export default function ShareScreen() {
  const { t, nm, dishName, sep } = useMakeStrings();
  const { isPhone } = useBreakpoint();
  const nav = useMakeNav();
  const tonight = useMakeStore((s) => s.tonight);
  const cart = useMakeStore((s) => s.cart);
  const actions = [
    () => {
      if (tonight.length) toast(`${t.sent} · ${tonight.map((x) => dishName(dishById(x))).join(sep)}`);
      else nav.go("/make/recipes");
    },
    async () => {
      const text = cart.map((c) => `${nm(c.name, c.zh)} · ${c.amount}`).join("\n");
      if (!text) return toast(t.handoffEmpty);
      try {
        await copyText(text);
        toast(t.copied);
      } catch {
        toast(t.copyFail);
      }
    },
    () => nav.go("/calendar"),
  ];
  return (
    <Page background={make.background} gap={20}>
      <MakeHeader title={t.titles.share} />
      <Grid cols={isPhone ? 1 : 3} gap={isPhone ? 16 : 24}>
        {t.share.map((o, i) => (
          <MCard key={o.num} padding={isPhone ? 20 : 28} gap={16} style={{ minHeight: isPhone ? 0 : 360 }}>
            <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: make.primarySoft, alignItems: "center", justifyContent: "center" }}>
              <MTxt variant="h1" weight="700" color={make.primaryPressed}>
                {o.num}
              </MTxt>
            </View>
            <MTxt variant="section">{o.title}</MTxt>
            <MTxt muted>{o.body}</MTxt>
            {i === 0 && tonight.length ? (
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
                {tonight.map((id) => (
                  <Chip key={id} label={dishName(dishById(id))} soft />
                ))}
              </View>
            ) : null}
            {i === 1 ? (
              cart.length ? (
                <View style={{ gap: 8 }}>
                  {cart.map((c) => (
                    <View key={`${c.dishId}-${c.name}`} style={{ flexDirection: "row", justifyContent: "space-between", gap: 12, paddingHorizontal: 14, paddingVertical: 10, borderRadius: radius.md, backgroundColor: make.surface2 }}>
                      <MTxt weight="600" style={{ flexShrink: 1 }}>
                        {nm(c.name, c.zh)}
                      </MTxt>
                      <MTxt muted style={{ flexShrink: 1, textAlign: "right" }}>
                        {c.amount} · {dishName(dishById(c.dishId))}
                      </MTxt>
                    </View>
                  ))}
                </View>
              ) : (
                <MTxt muted>{t.handoffEmpty}</MTxt>
              )
            ) : null}
            <View style={{ marginTop: "auto", flexDirection: "row" }}>
              <Button size="lg" label={o.cta} onPress={() => void actions[i]()} />
            </View>
          </MCard>
        ))}
      </Grid>
    </Page>
  );
}
