/* Make home: the three entry tiles — What can I make? / I want to make… / Summary. Tonight's
 * dishes are managed from Home and the dish pages; Summary lists every finished session; a running cooking session is reachable from
 * the header's "Continue cooking" button. */
import { Image } from "expo-image";
import { Pressable, View } from "react-native";
import { Icon, Page } from "@/components/ui";
import { useBreakpoint } from "@/hooks/use-breakpoint";
import { make, radius } from "@/theme";
import { MakeHeader, useMakeNav } from "@/features/make/components/MakeHeader";
import { Grid, MTxt } from "@/features/make/components/ui";
import { DISHES, dishImg, hasDishImg } from "@/features/make/data";
import { useMakeStore } from "@/features/make/store";
import { useMakeStrings } from "@/features/make/strings";

const TILE_IMAGES = { fridge: require("@/assets/images/lucky/tile-fridge.webp"), dish: require("@/assets/images/lucky/tile-dish.webp") } as const;

/** Summary tile backdrop: a mosaic of dishes the family has cooked (catalog dishes until then). */
function DishMosaic({ uris }: { uris: string[] }) {
  return (
    <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, flexDirection: "row", flexWrap: "wrap", opacity: 0.38 }}>
      {uris.map((uri, i) => (
        <Image key={`${uri}-${i}`} source={{ uri }} contentFit="cover" style={{ width: "33.33%", height: "25%" }} />
      ))}
    </View>
  );
}

function Tile({ icon, title, body, tone, image, mosaic, onPress }: { icon: string; title: string; body: string; tone: "primary" | "green" | "plain"; image?: keyof typeof TILE_IMAGES; mosaic?: string[]; onPress: () => void }) {
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
      {mosaic?.length ? <DishMosaic uris={mosaic} /> : null}
      <View style={{ flex: isPhone ? undefined : 1, alignSelf: isPhone ? "center" : "stretch", alignItems: "center", justifyContent: "center" }}>
        <View style={{ width: isPhone ? 64 : 88, height: isPhone ? 64 : 88, borderRadius: 44, backgroundColor: ringBg, alignItems: "center", justifyContent: "center" }}>
          <Icon name={icon} size={isPhone ? 30 : 42} color={ringFg} strokeWidth={2.2} />
        </View>
      </View>
      <View style={[{ flex: isPhone ? 1 : undefined, gap: 6 }, mosaic?.length ? { alignSelf: "stretch", marginHorizontal: -12, marginBottom: -12, padding: 12, borderRadius: radius.lg, backgroundColor: "rgba(255,255,255,0.86)" } : null]}>
        <MTxt variant="section" weight="700" color={fg} numberOfLines={1} adjustsFontSizeToFit style={{ fontSize: isPhone ? 24 : 27, lineHeight: isPhone ? 30 : 35 }}>
          {title}
        </MTxt>
        <MTxt variant="body" color={tone === "plain" ? make.muted : "#ffffffe6"} numberOfLines={2} style={{ fontSize: isPhone ? 18 : 21, lineHeight: isPhone ? 24 : 28, height: isPhone ? undefined : 56 }}>
          {body}
        </MTxt>
      </View>
    </Pressable>
  );
}

export default function MakeHomeScreen() {
  const { t } = useMakeStrings();
  const { isPhone } = useBreakpoint();
  const nav = useMakeNav();
  const history = useMakeStore((s) => s.history);
  const cooked = [...new Set(history.flatMap((r) => r.dishIds))];
  const mosaic = cooked.concat(DISHES.map((d) => d.id).filter((id) => !cooked.includes(id) && hasDishImg(id))).slice(0, 12).map(dishImg);
  return (
    <Page background={make.background} gap={12} scroll={isPhone}>
      <MakeHeader brand />
      <Grid cols={isPhone ? 1 : 3} gap={isPhone ? 14 : 20} style={isPhone ? undefined : { flex: 1, minHeight: 0, alignContent: "stretch" }}>
        <Tile icon="camera" tone="primary" image="fridge" title={t.tile1} body={t.tile1Body} onPress={() => nav.go("/make/capture")} />
        <Tile icon="cooking-pot" tone="green" image="dish" title={t.tile2} body={t.tile2Body} onPress={() => nav.go("/make/wantmake")} />
        <Tile icon="book-open" tone="plain" mosaic={mosaic} title={t.tile3} body={t.tile3Body} onPress={() => nav.go("/make/summary")} />
      </Grid>
    </Page>
  );
}
