/* Make home: tonight's table strip (dishes, diners, estimated time, Start cooking) and the three
 * entry tiles — What can I make? / I want to make… / Share. */
import { useMemo } from "react";
import { Image } from "expo-image";
import { Pressable, ScrollView, View } from "react-native";
import { Button, Icon, Page } from "@/components/ui";
import { useBreakpoint } from "@/hooks/use-breakpoint";
import { toast } from "@/store/toast";
import { useDeviceStore } from "@/store/device";
import { make, radius } from "@/theme";
import { openAddDishModal } from "@/features/make/components/AddDishModal";
import { MakeHeader, useMakeNav } from "@/features/make/components/MakeHeader";
import { Grid, MCard, MTxt, Photo } from "@/features/make/components/ui";
import { dishById, dishImg, fmtMin, hasDishImg } from "@/features/make/data";
import { usePantrySlice } from "@/features/make/hooks";
import { dishDone, planSeconds, readiness, totalRemaining, useMakeStore } from "@/features/make/store";
import { useMakeStrings } from "@/features/make/strings";

const TILE_IMAGES = { fridge: require("@/assets/images/lucky/tile-fridge.webp"), dish: require("@/assets/images/lucky/tile-dish.webp") } as const;

function Tile({ icon, title, body, tone, image, onPress }: { icon: string; title: string; body: string; tone: "primary" | "green" | "plain"; image?: keyof typeof TILE_IMAGES; onPress: () => void }) {
  const { isPhone } = useBreakpoint();
  const bg = tone === "primary" ? make.primary : tone === "green" ? make.green : make.surface;
  const fg = tone === "plain" ? make.foreground : "#fff";
  const ringBg = tone === "plain" ? make.primarySoft : "#ffffff2e";
  const ringFg = tone === "plain" ? make.primary : "#fff";
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      onPress={onPress}
      style={({ pressed }) => ({ flex: isPhone ? undefined : 1, overflow: "hidden", backgroundColor: bg, borderWidth: 1, borderColor: tone === "plain" ? make.border : bg, borderRadius: radius.xl, padding: isPhone ? 20 : 24, gap: 16, minHeight: isPhone ? 0 : 200, justifyContent: "space-between", opacity: pressed ? 0.85 : 1, flexDirection: isPhone ? "row" : "column", alignItems: isPhone ? "center" : "flex-start" })}>
      {image ? <Image source={TILE_IMAGES[image]} contentFit="cover" style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, opacity: 0.32 }} /> : null}
      <View style={{ width: isPhone ? 64 : 80, height: isPhone ? 64 : 80, borderRadius: 40, backgroundColor: ringBg, alignItems: "center", justifyContent: "center", alignSelf: "center" }}>
        <Icon name={icon} size={isPhone ? 30 : 38} color={ringFg} strokeWidth={2.2} />
      </View>
      <View style={{ flex: isPhone ? 1 : undefined, gap: 6 }}>
        <MTxt variant="section" weight="700" color={fg} numberOfLines={1} adjustsFontSizeToFit>
          {title}
        </MTxt>
        <MTxt variant="body" color={tone === "plain" ? make.muted : "#ffffffe6"} numberOfLines={2} style={isPhone ? undefined : { height: 48 }}>
          {body}
        </MTxt>
      </View>
    </Pressable>
  );
}

export default function MakeHomeScreen() {
  const { t, lang, dishName, sep } = useMakeStrings();
  const { isPhone } = useBreakpoint();
  const nav = useMakeNav();
  const slice = usePantrySlice();
  const tonightIds = useMakeStore((s) => s.tonight);
  const cook = useMakeStore((s) => s.cook);
  const removeTonight = useMakeStore((s) => s.removeTonight);
  const beginCook = useMakeStore((s) => s.beginCook);
  const members = useDeviceStore((s) => s.members);
  const dinnerMembers = useDeviceStore((s) => s.dinnerMembers);
  const dinerNames = members.filter((m) => dinnerMembers.includes(m.id)).map((m) => m.name);

  const tonight = useMemo(() => tonightIds.map((id) => ({ d: dishById(id), r: readiness(slice, dishById(id), lang) })), [tonightIds, slice, lang]);
  const notReady = tonight.filter((x) => x.r.pct < 100);
  const est = cook ? totalRemaining(cook) : tonight.reduce((a, x) => a + planSeconds(slice, x.d.id), 0);
  const canCook = tonight.length > 0 && notReady.length === 0;

  const metaParts: { text: string; tone?: "warn" | "ok" }[] = [];
  if (dinerNames.length) metaParts.push({ text: `${dinerNames.length} ${t.eating} · ${dinerNames.join(sep)}` });
  if (tonight.length) metaParts.push({ text: `${tonight.length} ${tonight.length === 1 ? t.dishN : t.dishesN} · ${t.est} ${fmtMin(est)} ${t.left}` });
  if (notReady.length) metaParts.push({ text: `${notReady.length} ${t.notReady}`, tone: "warn" });
  else if (tonight.length) metaParts.push({ text: t.readyAll, tone: "ok" });

  const onCook = () => {
    const result = beginCook(null);
    if (result === "needAll") toast(t.needAll);
    else if (result === "ok") nav.go("/make/cook");
  };

  return (
    <Page background={make.background} gap={16} scroll={isPhone}>
      <MakeHeader brand />
      <MCard background={make.surface2} padding={isPhone ? 16 : 20} gap={14}>
        <View>
          <MTxt variant="section">{t.tonight}</MTxt>
          <MTxt variant="meta" muted>
            {metaParts.map((part, i) => (
              <MTxt key={i} variant="meta" color={part.tone === "warn" ? make.primaryPressed : part.tone === "ok" ? make.green : make.muted} weight={part.tone ? "600" : "400"}>
                {i ? " · " : ""}
                {part.text}
              </MTxt>
            ))}
          </MTxt>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 2 }}>
          {tonight.length ? (
            tonight.map(({ d, r }, i) => {
              const short = r.pct < 100;
              const status = cook && dishDone(cook, d.id) ? t.cooked : short ? `${t.missing} ${r.missing.length}` : t.ready;
              return (
                <View key={d.id} style={{ flexDirection: "row", alignItems: "center", gap: 6, minHeight: 60, padding: 6, borderWidth: 1, borderColor: make.border, borderRadius: radius.pill, backgroundColor: make.surface }}>
                  <Pressable accessibilityRole="button" accessibilityLabel={dishName(d)} onPress={() => nav.go(`/make/dish/${d.id}`)} style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingRight: 8 }}>
                    <Photo uri={hasDishImg(d.id) ? dishImg(d.id) : undefined} round={24} style={{ width: 48, height: 48, alignItems: "center", justifyContent: "center" }}>
                      {hasDishImg(d.id) ? null : (
                        <MTxt weight="700" color={make.primary}>
                          {String(i + 1)}
                        </MTxt>
                      )}
                    </Photo>
                    <MTxt weight="500">{dishName(d)}</MTxt>
                    <MTxt variant="meta" color={short ? make.primaryPressed : make.green}>
                      {status}
                    </MTxt>
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={t.removeDish}
                    onPress={() => {
                      removeTonight(d.id);
                      toast(`${t.removeDish}: ${dishName(d)}`);
                    }}
                    style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: make.surface2, alignItems: "center", justifyContent: "center" }}>
                    <Icon name="x" size={18} color={make.muted} />
                  </Pressable>
                </View>
              );
            })
          ) : (
            <MTxt muted>{t.tonightNone}</MTxt>
          )}
          <Button square icon="plus" accessibilityLabel={t.addDish} onPress={() => openAddDishModal(t.addDish)} />
        </ScrollView>
        <View style={{ flexDirection: "row" }}>
          <Button size="lg" variant="primary" accent={make.primary} icon="flame" label={cook ? t.continueCook : t.cookNow} disabled={!canCook} accessibilityLabel={canCook ? undefined : t.needAll} onPress={onCook} />
        </View>
      </MCard>
      <Grid cols={isPhone ? 1 : 3} gap={isPhone ? 14 : 20} style={isPhone ? undefined : { flex: 1, minHeight: 0, alignContent: "stretch" }}>
        <Tile icon="camera" tone="primary" image="fridge" title={t.tile1} body={t.tile1Body} onPress={() => nav.go("/make/capture")} />
        <Tile icon="cooking-pot" tone="green" image="dish" title={t.tile2} body={t.tile2Body} onPress={() => nav.go("/make/wantmake")} />
        <Tile icon="share-2" tone="plain" title={t.tile3} body={t.tile3Body} onPress={() => nav.go("/make/share")} />
      </Grid>
    </Page>
  );
}
