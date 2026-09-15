/* What's in stock: item, category, size (metric / imperial from Settings), count stepper, updated. */
import { View } from "react-native";
import { Button, Page, YesNoSlider } from "@/components/ui";
import { useBreakpoint } from "@/hooks/use-breakpoint";
import { useDeviceStore } from "@/store/device";
import { make, radius } from "@/theme";
import { MakeHeader } from "@/features/make/components/MakeHeader";
import { MTxt, Stepper, Tag } from "@/features/make/components/ui";
import { WHEN, categoryLabel, sizeLabel, typicalSize, unitLabel } from "@/features/make/data";
import { useMakeStore } from "@/features/make/store";
import { useMakeStrings } from "@/features/make/strings";

export default function StockScreen() {
  const { t, zh, nm } = useMakeStrings();
  const { isPhone } = useBreakpoint();
  const units = useDeviceStore((s) => s.settings.units);
  const stock = useMakeStore((s) => s.stock);
  const stockQty = useMakeStore((s) => s.stockQty);
  const stockRemove = useMakeStore((s) => s.stockRemove);
  const autoDeduct = useMakeStore((s) => s.autoDeduct);
  const setAutoDeduct = useMakeStore((s) => s.setAutoDeduct);
  const weightUnit = (name: string, size: typeof stock[number]["size"]) => `${sizeLabel(typicalSize(name, size), units)} / ${unitLabel(name, zh)}`;
  const cols = [2, 1, 1, 1.1, 1, 0.9];
  const head = [t.colItem, t.colCat, t.colSize, t.colCount, t.colAdded, ""];
  return (
    <Page background={make.background} gap={12}>
      <MakeHeader title={t.titles.stock} />
      <MTxt muted>
        {t.unitsLabel}:{" "}
        <MTxt weight="600">{units === "imperial" ? t.imperial : t.metric}</MTxt> · {t.unitsHint}
      </MTxt>
      <MTxt variant="caption" muted style={{ marginTop: -6 }}>
        {t.stockDisclaimer}
      </MTxt>
      {isPhone ? null : (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 16, paddingHorizontal: 26 }}>
          {head.map((label, i) => (
            <MTxt key={i} variant="caption" weight="600" muted align={i === 3 ? "center" : undefined} style={{ flex: cols[i], textTransform: "uppercase", letterSpacing: 1 }}>
              {label}
            </MTxt>
          ))}
        </View>
      )}
      <View style={{ gap: 10 }}>
        {stock.map((x) => {
          const cat = categoryLabel(x.name, zh);
          const when = zh ? WHEN[x.added] || x.added : x.added;
          const remove = <Button size="sm" variant="danger" label={t.del} onPress={() => stockRemove(x.name)} />;
          if (isPhone)
            return (
              <View key={x.name} style={{ gap: 10, paddingHorizontal: 16, paddingVertical: 12, borderWidth: 1, borderColor: make.border, borderRadius: radius.xl, backgroundColor: make.surface }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                  <MTxt weight="500" style={{ flex: 1 }}>
                    {nm(x.name, x.zh)}
                  </MTxt>
                  <Tag green>{cat}</Tag>
                </View>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                  <MTxt weight="500" style={{ fontVariant: ["tabular-nums"] }}>
                    {weightUnit(x.name, x.size)}
                  </MTxt>
                  <MTxt variant="meta" muted>
                    {when}
                  </MTxt>
                  <View style={{ marginLeft: "auto" }}>
                    <Stepper value={x.qty} onDelta={(delta) => stockQty(x.name, delta)} size={44} />
                  </View>
                </View>
                <View style={{ flexDirection: "row", justifyContent: "flex-end" }}>{remove}</View>
              </View>
            );
          return (
            <View key={x.name} style={{ flexDirection: "row", alignItems: "center", gap: 16, minHeight: 68, paddingHorizontal: 26, paddingVertical: 8, borderWidth: 1, borderColor: make.border, borderRadius: radius.pill, backgroundColor: make.surface }}>
              <MTxt weight="500" style={{ flex: cols[0] }}>
                {nm(x.name, x.zh)}
              </MTxt>
              <View style={{ flex: cols[1] }}>
                <Tag green>{cat}</Tag>
              </View>
              <MTxt weight="500" style={{ flex: cols[2], fontVariant: ["tabular-nums"] }}>
                {weightUnit(x.name, x.size)}
              </MTxt>
              <View style={{ flex: cols[3], alignItems: "center" }}>
                <Stepper value={x.qty} onDelta={(delta) => stockQty(x.name, delta)} />
              </View>
              <MTxt muted style={{ flex: cols[4] }}>
                {when}
              </MTxt>
              <View style={{ flex: cols[5], alignItems: "flex-end" }}>{remove}</View>
            </View>
          );
        })}
      </View>
      <View style={{ flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 14, marginTop: 8, paddingHorizontal: isPhone ? 4 : 10 }}>
        <YesNoSlider value={autoDeduct} onChange={setAutoDeduct} yesLabel={t.yes} noLabel={t.no} accessibilityLabel={t.autoDeduct} width={96} height={38} />
        <View style={{ flex: 1, minWidth: 200 }}>
          <MTxt weight="600">{t.autoDeduct}</MTxt>
          <MTxt variant="caption" muted>
            {t.autoDeductHint}
          </MTxt>
        </View>
      </View>
    </Page>
  );
}
