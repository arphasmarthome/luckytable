/* Dish detail: photo, family vote, tonight's menu / plan / Start cooking, readiness with the
 * ingredient checklist and the hand-off cart. Steps only appear on the cooking screen. */
import { useLocalSearchParams } from "expo-router";
import { useEffect, useMemo } from "react";
import { Linking, Pressable, View } from "react-native";
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
  const canCook = pct === 100;

  const onCook = () => {
    const result = beginCook(d.id);
    if (result === "needAll") toast(t.needAll);
    else if (result === "ok") nav.go("/make/cook");
  };

  const main = (
    <View style={{ flex: isWide ? 1 : undefined, minWidth: 0, gap: 20 }}>
      <Photo uri={dishImg(d.id)} height={isPhone ? 220 : 380} round={radius.xl}>
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
          <Button icon={voted ? "check" : "thumbs-up"} label={voted ? t.voted : t.voteFor} variant={voted ? "primary" : "secondary"} accent={make.green} onPress={() => toggleVote(d.id)} />
          <MTxt variant="caption" muted>
            {t.voteLine}
          </MTxt>
        </MCard>
        <MCard style={{ flex: isPhone ? undefined : 1.4 }}>
          <Kicker>{t.addMenuTitle}</Kicker>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
            <Button icon={inTonight ? "check" : "calendar-plus"} label={inTonight ? t.addedMenu : t.addMenu} variant={inTonight ? "soft" : "secondary"} accent={make.primary} onPress={() => toggleTonight(d.id)} />
            <Button icon="calendar-days" label={t.planDay} onPress={() => openPlanModal(d.id, `${t.planTitle} · ${dishName(d)}`)} />
            <Button icon="flame" label={t.cookNow} variant="primary" accent={make.primary} disabled={!canCook} accessibilityLabel={canCook ? undefined : t.needAll} onPress={onCook} />
          </View>
          <MTxt variant="caption" muted>
            {canCook ? t.stepsLater : t.needAll}
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
    <View style={{ width: isWide ? (isDesktop ? 460 : 380) : undefined, gap: 16 }}>
      <MCard>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <MTxt variant="h3">{t.readyToCook}</MTxt>
          <MTxt variant="hero" weight="700" color={pct === 100 ? make.green : make.primaryPressed} style={{ marginLeft: "auto" }}>
            {pct}%
          </MTxt>
        </View>
        <Bar pct={pct} />
        <MTxt muted>{pct === 100 ? t.allReady : zh ? `${have}／${ings.length} ${t.ingReady}` : `${have} ${t.ofReady} ${ings.length} ${t.ingReady}`}</MTxt>
        <Kicker>{t.ingredients}</Kicker>
        {ings.map((i, index) => (
          <Pressable
            key={`${i.name}-${index}`}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: i.have }}
            accessibilityLabel={i.label}
            onPress={() => toggleAcquired(d.id, i.name)}
            style={{ flexDirection: "row", alignItems: "center", gap: 14, minHeight: 56, paddingVertical: 6, paddingLeft: 8, paddingRight: 16, borderWidth: 1, borderColor: i.have ? "#cfe3d9" : make.border, borderRadius: radius.pill, backgroundColor: i.have ? make.greenSoft : make.surface }}>
            <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: i.have ? make.green : make.primary, alignItems: "center", justifyContent: "center" }}>
              <MTxt weight="700" color="#fff">
                {i.have ? "✓" : "+"}
              </MTxt>
            </View>
            <MTxt weight="500" style={{ flex: 1 }}>
              {i.label}
            </MTxt>
            <MTxt variant="meta" muted>
              {i.amount}
            </MTxt>
          </Pressable>
        ))}
      </MCard>
      <MCard background={make.primarySoft} border={make.selectedBorder}>
        <MTxt weight="600">{missing.length ? `${t.stillNeed} ${missing.length}: ${missing.map((i) => i.label).join(sep)}` : t.nothingToBuy}</MTxt>
        <Button
          size="lg"
          icon="shopping-cart"
          variant={missing.length && !carted ? "primary" : "secondary"}
          accent={make.primary}
          disabled={!missing.length}
          label={missing.length ? (carted ? `${t.addedToCart} ${missing.length} ${t.toCart} ✓` : `${t.addToCart} ${missing.length} ${t.toCart}`) : t.nothingInCart}
          onPress={() => {
            const n = addMissingToCart(d.id, lang);
            toast(`${t.addedToCart} ${n} ${t.toCart}`);
          }}
        />
        <MTxt variant="caption" color={make.primaryPressed} align="center" style={{ fontFamily: "monospace" }}>
          shop.pxgo.com.tw
        </MTxt>
      </MCard>
    </View>
  );

  return (
    <Page background={make.background} gap={20}>
      <MakeHeader title={dishName(d)} />
      <View style={{ flexDirection: isWide ? "row" : "column", gap: 24, alignItems: isWide ? "flex-start" : undefined }}>
        {main}
        {aside}
      </View>
    </Page>
  );
}
