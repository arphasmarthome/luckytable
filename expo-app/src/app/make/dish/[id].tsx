/* Dish detail: photo, family vote, tonight's menu / plan / Start cooking, readiness with the
 * ingredient checklist and the hand-off cart. Steps only appear on the cooking screen. */
import { useLocalSearchParams } from "expo-router";
import { useEffect, useMemo } from "react";
import { Linking, Pressable, ScrollView, View } from "react-native";
import { Button, Icon, Page } from "@/components/ui";
import { useBreakpoint } from "@/hooks/use-breakpoint";
import { toast } from "@/store/toast";
import { make, radius } from "@/theme";
import { MakeHeader, useMakeNav } from "@/features/make/components/MakeHeader";
import { openPlanModal } from "@/features/make/components/PlanModal";
import { Bar, Kicker, MCard, MTxt, Photo } from "@/features/make/components/ui";
import { cookMinutes, dishById, dishImg, hasDish } from "@/features/make/data";
import { usePantrySlice } from "@/features/make/hooks";
import { pantryNames, readiness, useMakeStore } from "@/features/make/store";
import { useMakeStrings } from "@/features/make/strings";
import { vendorById } from "@/features/make/vendors";


export default function DishScreen() {
  const { t, lang, zh, dishName, sep } = useMakeStrings();
  const { isWide, isPhone, isDesktop } = useBreakpoint();
  const nav = useMakeNav();
  const params = useLocalSearchParams<{ id: string }>();
  const id = hasDish(params.id) ? String(params.id) : "";
  const openDish = useMakeStore((s) => s.openDish);
  useEffect(() => {
    if (id) openDish(id);
  }, [id, openDish]);

  const slice = usePantrySlice();
  const tonight = useMakeStore((s) => s.tonight);
  const myVotes = useMakeStore((s) => s.myVotes);
  const votes = useMakeStore((s) => s.votes);
  const cart = useMakeStore((s) => s.cart);
  const vendor = vendorById(useMakeStore((s) => s.vendor));
  const toggleVote = useMakeStore((s) => s.toggleVote);
  const toggleTonight = useMakeStore((s) => s.toggleTonight);
  const toggleAcquired = useMakeStore((s) => s.toggleAcquired);
  const addMissingToCart = useMakeStore((s) => s.addMissingToCart);
  const beginCook = useMakeStore((s) => s.beginCook);

  const d = dishById(id);
  const r = useMemo(() => readiness(slice, d, lang, pantryNames(slice)), [slice, d, lang]);
  if (!id) return null;
  const { ings, have, pct, missing } = r;
  const voted = myVotes.includes(d.id);
  const voteCount = (votes[d.id] || 0) + (voted ? 1 : 0);
  const inTonight = tonight.includes(d.id);
  const rec = slice.recipes[d.id];
  const carted = cart.some((c) => c.dishId === d.id);
  const cartedNames = new Set(cart.filter((c) => c.dishId === d.id).map((c) => c.name));
  const canCook = pct === 100;

  const onCook = () => {
    const result = beginCook(d.id);
    if (result === "needAll") toast(t.needAll);
    else if (result === "ok") nav.go("/make/cook");
  };

  const main = (
    <View style={{ flex: isWide ? 1 : undefined, minWidth: 0, minHeight: 0, gap: 16 }}>
      <Photo uri={dishImg(d.id)} height={isWide ? undefined : isPhone ? 220 : 380} round={radius.xl} style={isWide ? { flex: 1, minHeight: 200 } : undefined}>
        <View style={{ position: "absolute", left: 20, bottom: 18, maxWidth: "70%", paddingHorizontal: 18, paddingVertical: 8, borderRadius: radius.pill, backgroundColor: "#ffffffe6" }}>
          <MTxt variant="card" weight="600" numberOfLines={1}>
            {dishName(d)}
          </MTxt>
        </View>
        <View style={{ position: "absolute", right: 20, ...(isPhone ? { top: 16 } : { bottom: 18 }), flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 16, paddingVertical: 8, borderRadius: radius.pill, backgroundColor: "#1f1f1dcc" }}>
          <Icon name="timer" size={18} color="#fff" />
          <MTxt weight="600" color="#fff">
            {cookMinutes(d)} {t.minShort} · {t.filters[d.cat] || d.cat}
          </MTxt>
        </View>
      </Photo>
      <View style={{ flexDirection: isPhone ? "column" : "row", gap: 16 }}>
        <MCard style={{ flex: isPhone ? undefined : 1 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <Kicker>{t.famVote}</Kicker>
            <MTxt variant="h1" weight="700" color={make.green} style={{ marginLeft: "auto" }}>
              {String(voteCount)}
            </MTxt>
          </View>
          <Button icon={voted ? "check" : "thumbs-up"} label={voted ? t.voted : t.voteFor} variant={voted ? "primary" : "secondary"} accent={make.yellowStrong} onAccent={make.yellowInk} onPress={() => toggleVote(d.id)} />
          <MTxt variant="caption" muted>
            {t.voteLine}
          </MTxt>
        </MCard>
        <MCard style={{ flex: isPhone ? undefined : 1.4 }}>
          <Kicker>{t.addMenuTitle}</Kicker>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
            <Button icon={inTonight ? "check" : "calendar-plus"} label={inTonight ? t.addedMenu : t.addMenu} variant={inTonight ? "soft" : "secondary"} accent={inTonight ? make.yellowInk : make.primary} onPress={() => toggleTonight(d.id)} />
            <Button icon="calendar-days" label={t.planDay} onPress={() => openPlanModal(d.id, `${t.planTitle} · ${dishName(d)}`)} />
            <Button icon="flame" label={t.cookNow} variant="primary" accent={make.primary} disabled={!canCook} accessibilityLabel={canCook ? undefined : t.needAll} onPress={onCook} />
          </View>
          <MTxt variant="caption" muted>
            {canCook ? t.stepsLater : carted ? t.tickToUnlock : t.needAll}
            {rec?.source ? (
              <MTxt variant="caption" color={make.primaryPressed} onPress={() => { void Linking.openURL(rec.source); }} accessibilityRole="link">
                {" · "}TheMealDB
              </MTxt>
            ) : null}
          </MTxt>
        </MCard>
      </View>
    </View>
  );

  const aside = (
    <View style={{ width: isWide ? (isDesktop ? 460 : 380) : undefined, gap: 16, minHeight: 0 }}>
      <MCard padding={14} gap={8} style={isWide ? { flex: 1, minHeight: 0 } : undefined}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <MTxt variant="h3">{t.readyToCook}</MTxt>
          <MTxt variant="section" weight="700" color={pct === 100 ? make.green : make.primaryPressed} style={{ marginLeft: "auto" }}>
            {pct}%
          </MTxt>
        </View>
        <Bar pct={pct} height={10} />
        <MTxt variant="meta" muted numberOfLines={2} style={{ minHeight: 42 }}>
          {pct === 100 ? t.allReady : zh ? `${have}／${ings.length} ${t.ingReady}` : `${have} ${t.ofReady} ${ings.length} ${t.ingReady}`}
        </MTxt>
        <ScrollView style={isWide ? { flex: 1, minHeight: 0 } : undefined} contentContainerStyle={{ gap: 6 }} scrollEnabled={isWide} showsVerticalScrollIndicator>
        {ings.map((i, index) => {
          const inCart = !i.have && cartedNames.has(i.name);
          /* Green = already in stock; yellow = not in stock, marked "have it" by tapping the row
             (added later); orange "+" = still to buy (whether or not it's queued in the cart). */
          const tone = i.have
            ? i.fromStock
              ? { border: "#cfe3d9", bg: make.greenSoft, dot: make.green, dotFg: "#fff" }
              : { border: make.yellowStrong, bg: make.yellow, dot: make.yellowStrong, dotFg: make.yellowInk }
            : inCart
              ? { border: make.selectedBorder, bg: make.primarySoft, dot: make.primary, dotFg: "#fff" }
              : { border: make.border, bg: make.surface, dot: make.primary, dotFg: "#fff" };
          return (
          <Pressable
            key={`${i.name}-${index}`}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: i.have || inCart }}
            accessibilityLabel={inCart ? `${i.label} · ${t.inCart}` : i.label}
            onPress={() => toggleAcquired(d.id, i.name)}
            style={{ flexDirection: "row", alignItems: "center", gap: 10, minHeight: 40, paddingVertical: 3, paddingLeft: 6, paddingRight: 12, borderWidth: 1, borderColor: tone.border, borderRadius: radius.pill, backgroundColor: tone.bg }}>
            <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: tone.dot, alignItems: "center", justifyContent: "center" }}>
              <MTxt variant="meta" weight="700" color={tone.dotFg}>
                {i.have ? "✓" : "+"}
              </MTxt>
            </View>
            <MTxt variant="meta" weight="500" numberOfLines={1} style={{ flex: 1 }}>
              {i.label}
            </MTxt>
            {inCart ? (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 2, borderRadius: radius.pill, backgroundColor: make.greenSoft }}>
                <Icon name="shopping-cart" size={11} color="#2f6a55" />
                <MTxt variant="caption" weight="600" color="#2f6a55">
                  {t.inCart}
                </MTxt>
              </View>
            ) : null}
            <MTxt variant="caption" muted numberOfLines={1} style={{ maxWidth: 110 }}>
              {i.amount}
            </MTxt>
          </Pressable>
          );
        })}
        </ScrollView>
      </MCard>
      <MCard background={make.primarySoft} border={make.selectedBorder} padding={14} gap={8}>
        <MTxt variant="meta" weight="600" numberOfLines={2}>
          {missing.length ? `${t.stillNeed} ${missing.length}: ${missing.map((i) => i.label).join(sep)}` : t.nothingToBuy}
        </MTxt>
        <Button
          size="md"
          icon="shopping-cart"
          variant={missing.length && !carted ? "primary" : "secondary"}
          accent={make.primary}
          disabled={!missing.length}
          label={missing.length ? `${t.addToCart} ${missing.length} ${t.toCart}` : t.nothingInCart}
          onPress={() => {
            const n = addMissingToCart(d.id, lang);
            toast(`${t.addedToCart} ${n} ${t.toCart}`);
          }}
        />
        {carted ? (
          <MTxt variant="caption" weight="600" color="#2f6a55" align="center">
            {t.addedToCart} ✓
          </MTxt>
        ) : null}
        <Pressable accessibilityRole="link" onPress={() => { void Linking.openURL(vendor.url); }} style={{ alignSelf: "center" }}>
          <MTxt variant="caption" color={make.primaryPressed} align="center" style={{ fontFamily: "monospace", textDecorationLine: "underline" }}>
            {vendor.host}
          </MTxt>
        </Pressable>
      </MCard>
    </View>
  );

  return (
    <Page background={make.background} gap={12} scroll={!isWide}>
      <MakeHeader title={dishName(d)} />
      <View style={{ flex: isWide ? 1 : undefined, minHeight: 0, flexDirection: isWide ? "row" : "column", gap: 16, alignItems: isWide ? "stretch" : undefined }}>
        {main}
        {aside}
      </View>
    </Page>
  );
}
