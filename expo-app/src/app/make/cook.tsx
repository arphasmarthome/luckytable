/* Cooking: time left for all food on top, dish rail | photo + timer controls | numbered steps,
 * or the A | B split screen. Entering the route gates on tonight's readiness like the
 * prototype's activate({screen:"cook"}). */
import { useEffect, useRef } from "react";
import { View } from "react-native";
import { Button, Icon, Page } from "@/components/ui";
import { useBreakpoint } from "@/hooks/use-breakpoint";
import { fmtClock } from "@/lib/date";
import { toast } from "@/store/toast";
import { make, radius } from "@/theme";
import { openAddDishModal } from "@/features/make/components/AddDishModal";
import { CookPane, DishRail, StepList } from "@/features/make/components/CookParts";
import { useMakeNav } from "@/features/make/components/MakeHeader";
import { Bar, MCard, MTxt, Photo } from "@/features/make/components/ui";
import { dishById, dishImg, fmtMin } from "@/features/make/data";
import { allDone, anyRunning, dishDone, dishRunning, planSeconds, stepAt, totalPct, totalRemaining, useMakeStore } from "@/features/make/store";
import { useMakeStrings } from "@/features/make/strings";

export default function CookScreen() {
  const { t, dishName } = useMakeStrings();
  const { isWide, isPhone, isDesktop, width } = useBreakpoint();
  const nav = useMakeNav();
  const cook = useMakeStore((s) => s.cook);
  const recipes = useMakeStore((s) => s.recipes);
  const enterCook = useMakeStore((s) => s.enterCook);
  const finishCook = useMakeStore((s) => s.finishCook);
  const toggleSplit = useMakeStore((s) => s.toggleSplit);
  const startAll = useMakeStore((s) => s.startAll);
  const pauseAll = useMakeStore((s) => s.pauseAll);
  const toggleTimer = useMakeStore((s) => s.toggleTimer);
  const addMinute = useMakeStore((s) => s.addMinute);
  const resetStep = useMakeStore((s) => s.resetStep);
  const completeStep = useMakeStore((s) => s.completeStep);

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

  if (!cook || !cook.dishIds.length) return <Page background={make.background}>{null}</Page>;

  const running = anyRunning(cook);
  const done = allDone(cook);
  const cookedCount = cook.dishIds.filter((id) => dishDone(cook, id)).length;
  const goBack = () => nav.back();
  const finish = () => {
    finishCook();
    nav.home();
    toast(t.allDone);
  };
  const addDish = (pane: "A" | "B" | "" = "") => openAddDishModal(t.addDish, pane);

  const top = (
    <MCard padding={isPhone ? 12 : 14} style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: isPhone ? 12 : 18 }}>
      <Button square icon="columns-2" variant={cook.split ? "primary" : "secondary"} accent={make.primary} accessibilityLabel={cook.split ? t.singleScreen : t.splitScreen} onPress={toggleSplit} />
      <View style={{ flex: 1, minWidth: 200, gap: 4 }}>
        <MTxt variant="meta" muted weight="600" style={{ textTransform: "uppercase", letterSpacing: 1 }}>
          {t.timeLeftAll}
        </MTxt>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
          <MTxt variant="timer" weight="700" color={running ? make.primaryPressed : make.foreground} style={{ fontVariant: ["tabular-nums"] }}>
            {fmtClock(totalRemaining(cook))}
          </MTxt>
          <View style={{ flex: 1 }}>
            <Bar pct={totalPct(cook)} color={make.primary} height={14} />
          </View>
        </View>
      </View>
      <Button icon={running ? "pause" : "play"} label={running ? t.pauseAll : t.startAll} variant={running ? "secondary" : "primary"} accent={make.primary} disabled={done} onPress={running ? pauseAll : startAll} />
      <MTxt variant="meta" muted>
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
      <Page background={make.background} gap={12} scroll={!isWide}>
        {top}
        <View style={{ flex: isWide ? 1 : undefined, minHeight: 0, flexDirection: isWide ? "row" : "column", gap: 14, alignItems: isWide ? "stretch" : undefined }}>
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
  const s = stepAt(cook, id, sel);
  const playLabel = s?.running ? t.pause : dishRunning(cook, id) || (s && s.remaining < s.seconds) ? t.resume : t.play;
  const photoWidth = isWide ? Math.min(isDesktop ? 440 : 360, Math.round(width * 0.32)) : undefined;

  const photoCol = (
    <View style={{ width: photoWidth, gap: 12, minHeight: 0 }}>
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
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
        <Button size="lg" icon={s?.running ? "pause" : "play"} label={playLabel} variant="primary" accent={make.primary} disabled={!s || s.done} onPress={() => toggleTimer(id, sel)} style={{ flexGrow: 1.6, flexBasis: isPhone ? "47%" : 160 }} />
        <Button size="lg" icon="plus" label={t.plusMin} disabled={!s} onPress={() => addMinute(id, sel)} style={{ flexGrow: 1, flexBasis: isPhone ? "47%" : 100 }} />
        <Button size="lg" icon="rotate-ccw" label={t.reset} disabled={!s} onPress={() => resetStep(id, sel)} style={{ flexGrow: 1, flexBasis: isPhone ? "47%" : 100 }} />
        <Button size="lg" icon="check" label={s?.done ? t.reset : t.done} variant="primary" accent={s?.done ? make.yellowStrong : make.green} onAccent={s?.done ? make.yellowInk : "#fff"} disabled={!s} onPress={() => completeStep(id, sel)} style={{ flexGrow: 1, flexBasis: isPhone ? "47%" : 100 }} />
      </View>
    </View>
  );

  const stepsCol = (
    <View style={{ flex: isWide ? 1 : undefined, minWidth: 0, minHeight: 0, gap: 12 }}>
      <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "baseline", gap: 14, paddingHorizontal: 4 }}>
        <MTxt variant="section">{dishName(d)}</MTxt>
        <MTxt variant="meta" muted>
          {(cook.steps[id] || []).length} {t.steps} · {t.est} {fmtMin(planSeconds({ recipes }, id))}
        </MTxt>
      </View>
      <StepList cook={cook} id={id} scroll={isWide} />
    </View>
  );

  return (
    <Page background={make.background} gap={12} scroll={!isWide}>
      {top}
      <View style={{ flex: isWide ? 1 : undefined, minHeight: 0, flexDirection: isWide ? "row" : "column", gap: isPhone ? 12 : 16, alignItems: isWide ? "stretch" : undefined }}>
        <DishRail cook={cook} horizontal={!isWide} onAdd={() => addDish("")} />
        {photoCol}
        {stepsCol}
      </View>
      {finishBar}
    </Page>
  );
}
