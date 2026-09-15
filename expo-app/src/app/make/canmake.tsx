/* What can I make: dishes ranked by match against either this capture or the whole stock (?mode=). */
import { useLocalSearchParams } from "expo-router";
import { useEffect, useMemo } from "react";
import { View } from "react-native";
import { Chip, Page, Segmented } from "@/components/ui";
import { useBreakpoint } from "@/hooks/use-breakpoint";
import { make } from "@/theme";
import { DishGrid } from "@/features/make/components/DishCard";
import { MakeHeader, useMakeNav } from "@/features/make/components/MakeHeader";
import { Kicker, MCard } from "@/features/make/components/ui";
import { useDecoratedDishes } from "@/features/make/hooks";
import { capturedItems, rankDishes, useMakeStore, type MatchMode } from "@/features/make/store";
import { useMakeStrings } from "@/features/make/strings";

export default function CanMakeScreen() {
  const { t, lang, nm } = useMakeStrings();
  const { isWide } = useBreakpoint();
  const nav = useMakeNav();
  const params = useLocalSearchParams<{ mode?: string }>();
  const mode: MatchMode = params.mode === "captured" ? "captured" : "stock";
  const setMatchMode = useMakeStore((s) => s.setMatchMode);
  const openDish = useMakeStore((s) => s.openDish);
  useEffect(() => {
    setMatchMode(mode);
  }, [mode, setMatchMode]);
  const matchMode = useMakeStore((s) => s.matchMode);
  const stock = useMakeStore((s) => s.stock);
  const shots = useMakeStore((s) => s.shots);
  const qty = useMakeStore((s) => s.qty);
  const { dishes } = useDecoratedDishes();
  const ranked = useMemo(() => rankDishes(dishes), [dishes]);
  const sources = matchMode === "captured" ? capturedItems({ shots, qty }, lang).map((c) => ({ label: c.label, qty: c.qty })) : stock.map((x) => ({ label: nm(x.name, x.zh), qty: x.qty }));
  const hasCapture = shots > 0;
  const aside = (
    <MCard style={{ width: isWide ? 300 : undefined }}>
      <Kicker>{t.matchingFrom}</Kicker>
      {hasCapture ? (
        <Segmented<MatchMode>
          size="sm"
          accent={make.primary}
          value={matchMode}
          options={[
            { value: "captured", label: t.modeCaptured },
            { value: "stock", label: t.modeStock },
          ]}
          onChange={(value) => nav.router.setParams({ mode: value })}
          accessibilityLabel={t.matchingFrom}
        />
      ) : null}
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
        {sources.map((s, i) => (
          <Chip key={`${s.label}-${i}`} label={s.label} count={s.qty} soft accent={make.primaryPressed} />
        ))}
      </View>
    </MCard>
  );
  return (
    <Page background={make.background} gap={14}>
      <MakeHeader title={t.titles.canmake} />
      <View style={{ flexDirection: isWide ? "row" : "column", gap: 24, alignItems: isWide ? "flex-start" : undefined }}>
        {aside}
        <View style={{ flex: isWide ? 1 : undefined, minWidth: 0 }}>
          <DishGrid
            dishes={ranked}
            cols={isWide ? undefined : undefined}
            noteOf={(d) => d.note}
            onOpen={(id) => {
              openDish(id);
              nav.go(`/make/dish/${id}`);
            }}
          />
        </View>
      </View>
    </Page>
  );
}
