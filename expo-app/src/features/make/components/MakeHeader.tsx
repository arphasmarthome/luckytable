/* Per-screen Make header: home + back + title (or the brand block on the Make home) and the
 * fixed "Recipes" / "What's in stock" actions in the upper right. Language and units switches
 * of the standalone prototype are gone — those come from the device Settings now. */
import { usePathname, useRouter } from "expo-router";
import { View } from "react-native";
import { Button, Icon } from "@/components/ui";
import { useBreakpoint } from "@/hooks/use-breakpoint";
import { make } from "@/theme";
import { useMakeStore } from "../store";
import { useMakeStrings } from "../strings";
import { MTxt } from "./ui";

export function useMakeNav() {
  const router = useRouter();
  return {
    router,
    home: () => router.navigate("/make" as never),
    back: () => {
      if (router.canGoBack()) router.back();
      else router.navigate("/make" as never);
    },
    go: (path: string) => router.navigate(path as never),
  };
}

export function MakeHeader({ title, brand }: { title?: string; brand?: boolean }) {
  const { t } = useMakeStrings();
  const { isPhone } = useBreakpoint();
  const pathname = usePathname();
  const nav = useMakeNav();
  const onRecipes = pathname.startsWith("/make/recipes");
  const onStock = pathname.startsWith("/make/stock");
  const onShare = pathname.startsWith("/make/share");
  const cartCount = useMakeStore((s) => s.cart.length);
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 12, minHeight: 56 }}>
      {brand ? (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 14, flex: 1, minWidth: 200 }}>
          <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: make.primary, alignItems: "center", justifyContent: "center" }}>
            <Icon name="chef-hat" size={26} color="#fff" />
          </View>
          <MTxt variant="h1" numberOfLines={1} style={{ flexShrink: 1 }}>
            {t.brand}
          </MTxt>
        </View>
      ) : (
        <>
          <Button square icon="house" variant="soft" accent={make.primary} accessibilityLabel={t.homeBtn} onPress={nav.home} />
          <Button square icon="chevron-left" accessibilityLabel={t.backBtn} onPress={nav.back} />
          <MTxt variant="h1" style={{ flex: 1, minWidth: 120 }} numberOfLines={2}>
            {title || ""}
          </MTxt>
        </>
      )}
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, marginLeft: "auto" }}>
        <Button icon="book-open" label={isPhone ? undefined : t.navRec} accessibilityLabel={t.navRec} variant={onRecipes ? "soft" : "secondary"} accent={make.primary} onPress={() => { if (!onRecipes) nav.go("/make/recipes"); }} />
        <Button icon="boxes" label={isPhone ? undefined : t.stockBtn} accessibilityLabel={t.stockBtn} variant={onStock ? "soft" : "secondary"} accent={make.primary} onPress={() => { if (!onStock) nav.go("/make/stock"); }} />
        <Button icon="shopping-cart" accessibilityLabel={`${t.cartBtn} · ${cartCount}`} variant={onShare ? "soft" : "secondary"} accent={make.primary} onPress={() => { if (!onShare) nav.go("/make/share"); }}>
          {cartCount ? (
            <View style={{ minWidth: 22, height: 22, paddingHorizontal: 6, borderRadius: 11, backgroundColor: make.primary, alignItems: "center", justifyContent: "center" }}>
              <MTxt variant="caption" weight="700" color="#fff">
                {String(cartCount)}
              </MTxt>
            </View>
          ) : null}
        </Button>
      </View>
    </View>
  );
}
