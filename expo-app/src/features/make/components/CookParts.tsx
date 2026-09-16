/* Cooking-screen pieces: the numbered step list, the dish rail, the timer for whichever step is
 * selected (shown below the photo), and the split-screen pane. */
import { useEffect, useRef, useState } from "react";
import { Animated, Platform, Pressable, ScrollView, View } from "react-native";
import { Icon } from "@/components/ui";
import { useBreakpoint } from "@/hooks/use-breakpoint";
import { make, radius } from "@/theme";
import { dishById, dishImg } from "../data";
import { dishDone, ensureRecipe, planFor, useMakeStore, type CookSession, type StepState } from "../store";
import { useMakeStrings } from "../strings";
import { MTxt, Photo } from "./ui";

const online = () => Platform.OS !== "web" || typeof navigator === "undefined" || navigator.onLine !== false;
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const MAX_STEP_SECONDS = 99 * 60 + 59;

/** A small round −/+ button: one tap = one step; holding repeats rapidly after a short delay. */
function StepperButton({ icon, accessibilityLabel, onStep, disabled, compact }: { icon: string; accessibilityLabel: string; onStep: () => void; disabled?: boolean; compact?: boolean }) {
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const repeatTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const stop = () => {
    if (holdTimer.current) clearTimeout(holdTimer.current);
    if (repeatTimer.current) clearInterval(repeatTimer.current);
    holdTimer.current = null;
    repeatTimer.current = null;
  };
  useEffect(() => stop, []);
  const size = compact ? 28 : 52;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: Boolean(disabled) }}
      disabled={disabled}
      onPressIn={() => {
        if (disabled) return;
        onStep();
        holdTimer.current = setTimeout(() => {
          repeatTimer.current = setInterval(onStep, 90);
        }, 450);
      }}
      onPressOut={stop}
      style={({ pressed }) => ({ width: size, height: size, borderRadius: size / 2, alignItems: "center", justifyContent: "center", backgroundColor: pressed ? make.surfacePressed : make.surface2, opacity: disabled ? 0.4 : 1 })}>
      <Icon name={icon} size={compact ? 14 : 24} color={make.foreground} />
    </Pressable>
  );
}

/** The tappable "MM" or "SS" half of the clock — tapping it makes that unit the +/- target. */
function TimePart({ label, value, active, onPress, compact }: { label: string; value: string; active: boolean; onPress: () => void; compact?: boolean }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ selected: active }} onPress={onPress} hitSlop={4} style={{ paddingHorizontal: compact ? 3 : 6, paddingVertical: compact ? 1 : 2, borderRadius: 8, backgroundColor: active ? make.primarySoft : "transparent" }}>
      <MTxt variant={compact ? "body" : "timer"} weight="700" color={active ? make.primaryPressed : make.foreground} numberOfLines={1} style={{ fontVariant: ["tabular-nums"] }}>
        {value}
      </MTxt>
    </Pressable>
  );
}

/** Loops a 0→1→0 pulse while `active`, used to flash the timer when a step's alarm is ringing. */
function useAlarmPulse(active: boolean) {
  const value = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!active) {
      value.stopAnimation();
      value.setValue(0);
      return;
    }
    const loop = Animated.loop(Animated.sequence([Animated.timing(value, { toValue: 1, duration: 420, useNativeDriver: false }), Animated.timing(value, { toValue: 0, duration: 420, useNativeDriver: false })]));
    loop.start();
    return () => loop.stop();
  }, [active, value]);
  return value;
}

/** The selected step's timer: [+] MM:SS [-] with a play/pause dot, or the flashing "time's up"
 * alarm once the step reaches zero — tapping it anywhere silences the alarm, marks the step done,
 * and the next step's own timer starts on its own. */
export function StepTimer({ dishId, index, step, compact }: { dishId: string; index: number; step: StepState; compact?: boolean }) {
  const { t } = useMakeStrings();
  const toggleTimer = useMakeStore((s) => s.toggleTimer);
  const nudgeStep = useMakeStore((s) => s.nudgeStep);
  const dismissAlarm = useMakeStore((s) => s.dismissAlarm);
  const resetStep = useMakeStore((s) => s.resetStep);
  const completeStep = useMakeStore((s) => s.completeStep);
  const [unit, setUnit] = useState<"min" | "sec">("min");
  const pulse = useAlarmPulse(step.alarming);

  if (step.alarming) {
    const bg = pulse.interpolate({ inputRange: [0, 1], outputRange: [make.danger, "#f3b3ae"] });
    return (
      <AnimatedPressable
        accessibilityRole="button"
        accessibilityLabel={t.stopAlarm}
        onPress={() => dismissAlarm(dishId, index)}
        style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: compact ? 6 : 10, width: compact ? undefined : "100%", paddingHorizontal: compact ? 8 : 12, minHeight: compact ? 32 : 64, borderRadius: radius.pill, backgroundColor: bg }}>
        <Icon name="bell-ring" size={compact ? 15 : 24} color="#fff" />
        {compact ? null : (
          <MTxt variant="h2" weight="700" color="#fff">
            {t.stopAlarm}
          </MTxt>
        )}
      </AnimatedPressable>
    );
  }

  const mm = String(Math.floor(step.remaining / 60)).padStart(2, "0");
  const ss = String(step.remaining % 60).padStart(2, "0");
  const atZero = step.remaining <= 0;
  const atMax = step.remaining >= MAX_STEP_SECONDS;
  const unitLabel = unit === "min" ? t.minutesLabel : t.secondsLabel;
  return (
    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: compact ? "flex-start" : "space-between", width: compact ? undefined : "100%", gap: compact ? 3 : 8 }}>
      <StepperButton icon="plus" compact={compact} disabled={atMax} accessibilityLabel={`+ ${unitLabel}`} onStep={() => nudgeStep(dishId, index, unit, 1)} />
      <TimePart label={t.minutesLabel} value={mm} active={unit === "min"} onPress={() => setUnit("min")} compact={compact} />
      <MTxt variant={compact ? "body" : "timer"} weight="700" color={make.muted}>
        :
      </MTxt>
      <TimePart label={t.secondsLabel} value={ss} active={unit === "sec"} onPress={() => setUnit("sec")} compact={compact} />
      <StepperButton icon="minus" compact={compact} disabled={atZero} accessibilityLabel={`- ${unitLabel}`} onStep={() => nudgeStep(dishId, index, unit, -1)} />
      <Pressable accessibilityRole="button" accessibilityLabel={step.running ? t.pause : t.play} onPress={() => toggleTimer(dishId, index)} style={{ width: compact ? 26 : 46, height: compact ? 26 : 46, borderRadius: 999, alignItems: "center", justifyContent: "center", backgroundColor: step.running ? make.primarySoft : make.surface2 }}>
        <Icon name={step.running ? "pause" : "play"} size={compact ? 12 : 20} color={step.running ? make.primaryPressed : make.foreground} />
      </Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel={t.reset} onPress={() => resetStep(dishId, index)} style={{ width: compact ? 26 : 46, height: compact ? 26 : 46, borderRadius: 999, alignItems: "center", justifyContent: "center", backgroundColor: make.surface2 }}>
        <Icon name="rotate-ccw" size={compact ? 12 : 20} color={make.muted} />
      </Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel={t.done} accessibilityState={{ selected: step.done }} onPress={() => completeStep(dishId, index)} style={{ width: compact ? 26 : 46, height: compact ? 26 : 46, borderRadius: 999, alignItems: "center", justifyContent: "center", backgroundColor: step.done ? make.green : make.greenSoft }}>
        <Icon name="check" size={compact ? 12 : 20} color={step.done ? "#fff" : make.green} />
      </Pressable>
    </View>
  );
}

/** Numbered steps. `scroll` makes the list fill its column and scroll on its own; the list follows
 * the selected step (completed steps stay above, crossed out, and can be scrolled back to). */
export function StepList({ cook, id, compact, scroll }: { cook: CookSession; id: string; compact?: boolean; scroll?: boolean }) {
  const { t, lang } = useMakeStrings();
  const recipes = useMakeStore((s) => s.recipes);
  const fetching = useMakeStore((s) => s.fetching);
  const selectStep = useMakeStore((s) => s.selectStep);
  const completeStep = useMakeStore((s) => s.completeStep);
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
        return (
          <View
            key={i}
            onLayout={(e) => {
              offsets.current[i] = e.nativeEvent.layout.y;
            }}
            style={{
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
              opacity: s.done ? 0.62 : 1,
            }}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={s.done ? t.stepDone : String(i + 1)}
              accessibilityState={{ selected: s.done }}
              onPress={() => completeStep(id, i)}
              style={({ pressed }) => ({ width: compact ? 36 : 42, height: compact ? 36 : 42, borderRadius: 21, alignItems: "center", justifyContent: "center", backgroundColor: s.done ? make.green : current ? make.yellowStrong : make.surface2, opacity: pressed ? 0.85 : 1 })}>
              {s.done ? <Icon name="check" size={compact ? 18 : 22} color="#fff" /> : (
                <MTxt variant={compact ? "body" : "h3"} weight="700" color={current ? make.yellowInk : make.foreground}>
                  {String(i + 1)}
                </MTxt>
              )}
            </Pressable>
            <Pressable accessibilityRole="button" accessibilityState={{ selected: current }} onPress={() => selectStep(id, i)} style={({ pressed }) => ({ flex: 1, minWidth: 0, opacity: pressed ? 0.85 : 1 })}>
              <MTxt variant={compact ? "body" : "card"} style={[{ flex: 1 }, s.done ? { textDecorationLine: "line-through" } : null]}>
                {plan[i]?.text || ""}
              </MTxt>
            </Pressable>
          </View>
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
  const activeStep = (cook.steps[id] || [])[sel];
  return (
    <View style={{ flex: 1, minHeight: 0, gap: 8, padding: isPhone ? 10 : 12, borderWidth: 1, borderColor: make.border, borderRadius: radius.xl, backgroundColor: make.surface2 }}>
      {head}
      <Photo uri={dishImg(id)} height={isPhone ? 160 : isWide ? 130 : 200} round={16}>
        <View style={{ position: "absolute", left: 12, top: 12, paddingVertical: 6, paddingHorizontal: 12, borderRadius: 14, backgroundColor: "#1f1f1dcc" }}>
          <MTxt variant="caption" color="#ffffffcc" style={{ textTransform: "uppercase", letterSpacing: 1 }}>
            {t.step} {sel + 1}
          </MTxt>
        </View>
        <View style={{ position: "absolute", right: 12, bottom: 12, maxWidth: "80%", paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.pill, backgroundColor: "#ffffffe6" }}>
          <MTxt variant="meta" weight="600" numberOfLines={1}>
            {cook.dishIds.indexOf(id) + 1} · {dishName(dishById(id))}
          </MTxt>
        </View>
      </Photo>
      {activeStep ? (
        <View style={{ alignItems: "center", paddingVertical: 4 }}>
          <StepTimer key={`${id}-${sel}`} dishId={id} index={sel} step={activeStep} compact />
        </View>
      ) : null}
      <StepList cook={cook} id={id} compact scroll={isWide} />
    </View>
  );
}
