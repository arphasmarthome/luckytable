/* Cooking-screen pieces: the numbered step list with a timer per step, the dish rail, and the
 * split-screen pane (photo with the timer overlaid, step list below). */
import { useEffect, useRef } from "react";
import { Platform, Pressable, ScrollView, View } from "react-native";
import { Button, Icon } from "@/components/ui";
import { useBreakpoint } from "@/hooks/use-breakpoint";
import { fmtClock } from "@/lib/date";
import { make, radius } from "@/theme";
import { dishById, dishImg } from "../data";
import { dishDone, ensureRecipe, planFor, stepAt, useMakeStore, type CookSession } from "../store";
import { useMakeStrings } from "../strings";
import { MTxt, Photo } from "./ui";

const online = () => Platform.OS !== "web" || typeof navigator === "undefined" || navigator.onLine !== false;

/** Numbered steps. `scroll` makes the list fill its column and scroll on its own; the list follows
 * the selected step (completed steps stay above, crossed out, and can be scrolled back to). */
export function StepList({ cook, id, compact, scroll }: { cook: CookSession; id: string; compact?: boolean; scroll?: boolean }) {
  const { t, lang } = useMakeStrings();
  const recipes = useMakeStore((s) => s.recipes);
  const fetching = useMakeStore((s) => s.fetching);
  const selectStep = useMakeStore((s) => s.selectStep);
  const steps = cook.steps[id] || [];
  const plan = planFor({ recipes }, id, lang);
  const selected = cook.selected[id] ?? 0;
  const listRef = useRef<ScrollView>(null);
  const offsets = useRef<Record<number, number>>({});
  useEffect(() => {
    if (!steps.length) ensureRecipe(id);
  }, [id, steps.length]);
  useEffect(() => {
    if (!scroll) return;
    const y = offsets.current[selected];
    if (y == null) return;
    const handle = setTimeout(() => listRef.current?.scrollTo({ y: Math.max(0, y - 6), animated: true }), 40);
    return () => clearTimeout(handle);
  }, [scroll, selected, id, steps.length]);
  if (!steps.length) {
    return (
      <View style={{ alignItems: "center", gap: 8, padding: 32, borderWidth: 2, borderStyle: "dashed", borderColor: make.border, borderRadius: radius.lg }}>
        <Icon name="hourglass" size={40} color={make.muted} />
        <MTxt variant="card" align="center">
          {fetching.includes(id) || online() ? t.loadingSteps : t.stepsOffline}
        </MTxt>
        <MTxt variant="caption" muted align="center">
          {t.stepsOffline}
        </MTxt>
      </View>
    );
  }
  const rows = (
    <View style={{ gap: compact ? 6 : 8 }}>
      {steps.map((s, i) => {
        const current = cook.selected[id] === i;
        const timerColor = s.done ? make.green : s.running ? make.primaryPressed : current ? make.foreground : make.muted;
        return (
          <Pressable
            key={i}
            onLayout={(e) => {
              offsets.current[i] = e.nativeEvent.layout.y;
            }}
            accessibilityRole="button"
            accessibilityState={{ selected: current }}
            onPress={() => selectStep(id, i)}
            style={({ pressed }) => ({
              flexDirection: "row",
              alignItems: "center",
              gap: compact ? 10 : 14,
              minHeight: compact ? 56 : 76,
              paddingVertical: compact ? 6 : 8,
              paddingLeft: compact ? 8 : 10,
              paddingRight: compact ? 10 : 14,
              borderWidth: 2,
              borderRadius: radius.lg,
              borderColor: current ? make.yellowStrong : make.border,
              backgroundColor: current ? make.yellow : make.surface,
              opacity: s.done ? 0.62 : pressed ? 0.85 : 1,
            })}>
            <View style={{ width: compact ? 36 : 42, height: compact ? 36 : 42, borderRadius: 21, alignItems: "center", justifyContent: "center", backgroundColor: s.done ? make.green : current ? make.yellowStrong : make.surface2 }}>
              {s.done ? <Icon name="check" size={compact ? 18 : 22} color="#fff" /> : (
                <MTxt variant={compact ? "body" : "h3"} weight="700" color={current ? make.yellowInk : make.foreground}>
                  {String(i + 1)}
                </MTxt>
              )}
            </View>
            <MTxt variant={compact ? "body" : "card"} style={[{ flex: 1 }, s.done ? { textDecorationLine: "line-through" } : null]}>
              {plan[i]?.text || ""}
            </MTxt>
            {/* one size and a fixed column so "1:00" → "Done" never resizes the row */}
            <MTxt variant={compact ? "h3" : "section"} weight="700" color={timerColor} numberOfLines={1} style={{ width: compact ? 64 : 84, textAlign: "right", fontVariant: ["tabular-nums"] }}>
              {s.done ? t.stepDone : fmtClock(s.remaining)}
            </MTxt>
          </Pressable>
        );
      })}
    </View>
  );
  if (!scroll) return rows;
  return (
    <ScrollView ref={listRef} style={{ flex: 1, minHeight: 0 }} contentContainerStyle={{ paddingBottom: 4 }} showsVerticalScrollIndicator>
      {rows}
    </ScrollView>
  );
}

/** 1 / 2 / 3 … dish switcher + "+" (vertical on wide screens, horizontal on phones). */
export function DishRail({ cook, horizontal, onAdd }: { cook: CookSession; horizontal: boolean; onAdd: () => void }) {
  const { t, dishName } = useMakeStrings();
  const setActiveDish = useMakeStore((s) => s.setActiveDish);
  const size = horizontal ? 60 : 72;
  return (
    <View style={{ flexDirection: horizontal ? "row" : "column", flexWrap: horizontal ? "wrap" : "nowrap", gap: 12, paddingTop: horizontal ? 0 : 8 }}>
      {cook.dishIds.map((x, i) => {
        const on = x === cook.active;
        const done = dishDone(cook, x);
        return (
          <Pressable
            key={x}
            accessibilityRole="button"
            accessibilityLabel={dishName(dishById(x))}
            accessibilityState={{ selected: on }}
            onPress={() => setActiveDish(x)}
            style={{ width: size, height: size, borderRadius: radius.lg, borderWidth: 2, borderColor: on ? make.primary : done ? make.green : make.borderStrong, backgroundColor: on ? make.primary : make.surface, alignItems: "center", justifyContent: "center" }}>
            <MTxt variant="section" weight="700" color={on ? "#fff" : done ? make.green : make.foreground}>
              {String(i + 1)}
            </MTxt>
            {done ? (
              <View style={{ position: "absolute", right: -6, top: -6, width: 22, height: 22, borderRadius: 11, backgroundColor: make.green, alignItems: "center", justifyContent: "center" }}>
                <Icon name="check" size={13} color="#fff" strokeWidth={3} />
              </View>
            ) : null}
          </Pressable>
        );
      })}
      <Pressable accessibilityRole="button" accessibilityLabel={t.addDish} onPress={onAdd} style={{ width: size, height: size, borderRadius: radius.lg, borderWidth: 2, borderStyle: "dashed", borderColor: make.borderStrong, alignItems: "center", justifyContent: "center" }}>
        <MTxt variant="section" weight="700" muted>
          +
        </MTxt>
      </Pressable>
    </View>
  );
}

function PaneChips({ cook, tag, id, onAdd }: { cook: CookSession; tag: "A" | "B"; id: string | null; onAdd: () => void }) {
  const { t, dishName } = useMakeStrings();
  const setPaneDish = useMakeStore((s) => s.setPaneDish);
  return (
    <View style={{ flexDirection: "row", gap: 6, marginLeft: 4 }}>
      {cook.dishIds.map((x, i) => {
        const on = x === id;
        const done = dishDone(cook, x);
        return (
          <Pressable key={x} accessibilityRole="button" accessibilityLabel={dishName(dishById(x))} accessibilityState={{ selected: on }} onPress={() => setPaneDish(tag, x)} style={{ width: 40, height: 40, borderRadius: radius.md, borderWidth: 2, borderColor: on ? make.primary : done ? make.green : make.borderStrong, backgroundColor: on ? make.primary : make.surface, alignItems: "center", justifyContent: "center" }}>
            <MTxt variant="h3" weight="700" color={on ? "#fff" : done ? make.green : make.foreground}>
              {String(i + 1)}
            </MTxt>
            {done ? (
              <View style={{ position: "absolute", right: -6, top: -6, width: 20, height: 20, borderRadius: 10, backgroundColor: make.green, alignItems: "center", justifyContent: "center" }}>
                <Icon name="check" size={12} color="#fff" strokeWidth={3} />
              </View>
            ) : null}
          </Pressable>
        );
      })}
      <Pressable accessibilityRole="button" accessibilityLabel={t.addDish} onPress={onAdd} style={{ width: 40, height: 40, borderRadius: radius.md, borderWidth: 2, borderStyle: "dashed", borderColor: make.borderStrong, alignItems: "center", justifyContent: "center" }}>
        <MTxt variant="h3" weight="700" muted>
          +
        </MTxt>
      </Pressable>
    </View>
  );
}

/** One side of the split screen. */
export function CookPane({ cook, tag, id, onAdd }: { cook: CookSession; tag: "A" | "B"; id: string | null; onAdd: () => void }) {
  const { t, dishName } = useMakeStrings();
  const { isPhone, isWide } = useBreakpoint();
  const toggleTimer = useMakeStore((s) => s.toggleTimer);
  const completeStep = useMakeStore((s) => s.completeStep);
  const resetStep = useMakeStore((s) => s.resetStep);
  const valid = Boolean(id && cook.dishIds.includes(id));
  const head = (
    // no wrapping: both panes keep the same head height so Step 1 lines up on the A and B sides
    <View style={{ flexDirection: "row", alignItems: "center", gap: 8, height: 44 }}>
      <View style={{ width: 40, height: 40, borderRadius: radius.md, backgroundColor: make.foreground, alignItems: "center", justifyContent: "center" }}>
        <MTxt variant="h3" weight="700" color="#fff">
          {tag}
        </MTxt>
      </View>
      <PaneChips cook={cook} tag={tag} id={valid ? id : null} onAdd={onAdd} />
      {valid ? (
        <MTxt variant="body" weight="600" numberOfLines={1} style={{ marginLeft: "auto", flexShrink: 1 }}>
          {dishName(dishById(id!))}
        </MTxt>
      ) : null}
    </View>
  );
  if (!valid || !id) {
    return (
      <View style={{ flex: 1, gap: 8, padding: 12, borderWidth: 1, borderColor: make.border, borderRadius: radius.xl, backgroundColor: make.surface2 }}>
        {head}
        <View style={{ alignItems: "center", gap: 12, padding: 24 }}>
          <Icon name="cooking-pot" size={40} color={make.muted} />
          <MTxt muted align="center">
            {t.chooseSide}
          </MTxt>
        </View>
      </View>
    );
  }
  const sel = cook.selected[id] ?? 0;
  const s = stepAt(cook, id, sel);
  return (
    <View style={{ flex: 1, minHeight: 0, gap: 8, padding: isPhone ? 10 : 12, borderWidth: 1, borderColor: make.border, borderRadius: radius.xl, backgroundColor: make.surface2 }}>
      {head}
      <Photo uri={dishImg(id)} height={isPhone ? 200 : isWide ? 168 : 240} round={16}>
        <View style={{ position: "absolute", left: 12, top: 12, flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 6, paddingLeft: 14, paddingRight: 10, borderRadius: 14, backgroundColor: "#1f1f1dcc" }}>
          <View style={{ minWidth: 96 }}>
            <MTxt variant="caption" color="#ffffffcc" style={{ textTransform: "uppercase", letterSpacing: 1 }}>
              {t.step} {sel + 1}
            </MTxt>
            <MTxt variant="h1" weight="700" color={s?.running ? "#ffb27a" : "#fff"} numberOfLines={1} style={{ fontVariant: ["tabular-nums"] }}>
              {s ? (s.done ? t.stepDone : fmtClock(s.remaining)) : "--"}
            </MTxt>
          </View>
          <Button square round icon={s?.running ? "pause" : "play"} variant="primary" accent={make.primary} disabled={!s || s.done} accessibilityLabel={s?.running ? t.pause : t.play} onPress={() => toggleTimer(id, sel)} />
          <Button square round icon="rotate-ccw" disabled={!s} accessibilityLabel={t.reset} onPress={() => resetStep(id, sel)} />
          <Button square round icon="check" variant="primary" accent={make.green} disabled={!s || s.done} accessibilityLabel={t.done} onPress={() => completeStep(id, sel)} />
        </View>
        <View style={{ position: "absolute", right: 12, bottom: 12, maxWidth: "80%", paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.pill, backgroundColor: "#ffffffe6" }}>
          <MTxt variant="meta" weight="600" numberOfLines={1}>
            {cook.dishIds.indexOf(id) + 1} · {dishName(dishById(id))}
          </MTxt>
        </View>
      </Photo>
      <StepList cook={cook} id={id} compact scroll={isWide} />
    </View>
  );
}
