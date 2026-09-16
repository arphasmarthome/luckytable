/* Cooking: dish rail | photo | numbered steps (each with its own timer), or the A | B split
 * screen. Entering the route gates on tonight's readiness like the prototype's
 * activate({screen:"cook"}). */
import { useEffect, useRef, useState } from "react";
import { View } from "react-native";
import { Button, Icon, Page } from "@/components/ui";
import { useBreakpoint } from "@/hooks/use-breakpoint";
import { toast } from "@/store/toast";
import { make, radius } from "@/theme";
import { openAddDishModal } from "@/features/make/components/AddDishModal";
import { CookPane, DishRail, StepList, StepTimer } from "@/features/make/components/CookParts";
import { CookSummary } from "@/features/make/components/CookSummary";
import { FullSheet } from "@/features/make/components/FullSheet";
import { useMakeNav } from "@/features/make/components/MakeHeader";
import { MCard, MTxt, Photo } from "@/features/make/components/ui";
import { dishById, dishImg } from "@/features/make/data";
import { allDone, dishDone, useMakeStore, type CookRecord } from "@/features/make/store";
import { useMakeStrings } from "@/features/make/strings";

export default function CookScreen() {
  const { t, dishName } = useMakeStrings();
  const { isWide, isPhone, isDesktop, width } = useBreakpoint();
  const nav = useMakeNav();
  const cook = useMakeStore((s) => s.cook);
  const enterCook = useMakeStore((s) => s.enterCook);
  const finishCook = useMakeStore((s) => s.finishCook);
  const toggleSplit = useMakeStore((s) => s.toggleSplit);

  const [summary, setSummary] = useState<CookRecord | null>(null);
  const gated = useRef(false);
  useEffect(() => {
    if (gated.current) return;
    gated.current = true;
    if (!enterCook()) {
      nav.router.replace("/make" as never);
      if (useMakeStore.getState().tonight.length) toast(t.needAll);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const closeSummary = () => {
    setSummary(null);
    nav.home();
    toast(t.allDone);
  };
  const summarySheet = (
    <FullSheet visible={Boolean(summary)} title={t.summaryTitle} onClose={closeSummary} closeLabel={t.close} footer={<Button size="lg" variant="primary" accent={make.green} label={t.close} onPress={closeSummary} block />}>
      {summary ? <CookSummary record={summary} /> : null}
    </FullSheet>
  );

  if (!cook || !cook.dishIds.length) return <Page background={make.background}>{summarySheet}</Page>;

  const done = allDone(cook);
  const cookedCount = cook.dishIds.filter((id) => dishDone(cook, id)).length;
  const goBack = () => nav.back();
  const finish = () => {
    const record = finishCook();
    if (record) setSummary(record);
    else closeSummary();
  };
  const addDish = (pane: "A" | "B" | "" = "") => openAddDishModal(t.addDish, pane);

  const top = (
    <MCard padding={isPhone ? 10 : 12} style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: isPhone ? 10 : 14 }}>
      <Button square icon="columns-2" variant={cook.split ? "primary" : "secondary"} accent={make.primary} accessibilityLabel={cook.split ? t.singleScreen : t.splitScreen} onPress={toggleSplit} />
      <MTxt variant="meta" muted style={{ marginLeft: "auto" }}>
        {cook.dishIds.length} {cook.dishIds.length === 1 ? t.dishN : t.dishesN} · {cookedCount} {t.cooked}
      </MTxt>
      <Button icon="chevron-left" label={t.exit} onPress={goBack} />
    </MCard>
  );

  const finishBar = done ? (
    <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 16, paddingHorizontal: 22, paddingVertical: 18, borderRadius: radius.lg, backgroundColor: make.greenSoft }}>
      <Icon name="circle-check" size={28} color="#2f6a55" />
      <MTxt variant="card" weight="600" color="#2f6a55" style={{ flex: 1, minWidth: 160 }}>
        {t.allDone}
      </MTxt>
      <Button size="lg" variant="primary" accent={make.green} label={t.finish} onPress={finish} />
    </View>
  ) : null;

  if (cook.split) {
    return (
      <Page background={make.background} gap={8} scroll={!isWide}>
        {top}
        <View style={{ flex: isWide ? 1 : undefined, minHeight: 0, flexDirection: isWide ? "row" : "column", gap: 10, alignItems: isWide ? "stretch" : undefined }}>
          <CookPane cook={cook} tag="A" id={cook.active} onAdd={() => addDish("A")} />
          <CookPane cook={cook} tag="B" id={cook.paneB} onAdd={() => addDish("B")} />
        </View>
        {finishBar}
      </Page>
    );
  }

  const id = cook.active;
  const d = dishById(id);
  const sel = cook.selected[id] ?? 0;
  const activeStep = (cook.steps[id] || [])[sel];
  const photoWidth = isWide ? Math.min(isDesktop ? 440 : 360, Math.round(width * 0.32)) : undefined;

  const photoCol = (
    <View style={{ width: photoWidth, gap: 6, minHeight: 0 }}>
      <Photo uri={dishImg(id)} aspectRatio={isWide ? undefined : 1} round={radius.xl} style={isWide ? { flex: 1, minHeight: 160 } : undefined}>
        <View style={{ position: "absolute", left: 16, right: 16, bottom: 16, flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 10, borderRadius: radius.lg, backgroundColor: "#ffffffe8" }}>
          <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: make.primary, alignItems: "center", justifyContent: "center" }}>
            <MTxt weight="700" color="#fff">
              {String(cook.dishIds.indexOf(id) + 1)}
            </MTxt>
          </View>
          <MTxt variant="card" weight="600" numberOfLines={1} style={{ flex: 1 }}>
            {dishName(d)}
          </MTxt>
        </View>
      </Photo>
      {activeStep ? (
        <View style={{ paddingVertical: 8, paddingHorizontal: 12, borderRadius: radius.lg, backgroundColor: make.surface2 }}>
          <StepTimer key={`${id}-${sel}`} dishId={id} index={sel} step={activeStep} />
        </View>
      ) : null}
    </View>
  );

  const stepsCol = (
    <View style={{ flex: isWide ? 1 : undefined, minWidth: 0, minHeight: 0, gap: 12 }}>
      <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "baseline", gap: 14, paddingHorizontal: 4 }}>
        <MTxt variant="section">{dishName(d)}</MTxt>
        <MTxt variant="meta" muted>
          {(cook.steps[id] || []).length} {t.steps}
        </MTxt>
      </View>
      <StepList cook={cook} id={id} scroll={isWide} />
    </View>
  );

  return (
    <Page background={make.background} gap={10} scroll={!isWide}>
      {top}
      <View style={{ flex: isWide ? 1 : undefined, minHeight: 0, flexDirection: isWide ? "row" : "column", gap: isPhone ? 10 : 14, alignItems: isWide ? "stretch" : undefined }}>
        <DishRail cook={cook} horizontal={!isWide} onAdd={() => addDish("")} />
        {photoCol}
        {stepsCol}
      </View>
      {finishBar}
    </Page>
  );
}
