/* Shopping cart: everything queued from dish pages (name, amount and which dish it's for), with
 * a remove action per row and a checkout hand-off to Instacart. */
import { Linking, Pressable, View } from "react-native";
import { Button, Chip, EmptyNote, Icon, Page } from "@/components/ui";
import { toast } from "@/store/toast";
import { make } from "@/theme";
import { MakeHeader } from "@/features/make/components/MakeHeader";
import { MCard, MTxt } from "@/features/make/components/ui";
import { dishById } from "@/features/make/data";
import { useMakeStore } from "@/features/make/store";
import { useMakeStrings } from "@/features/make/strings";
import { VENDORS, vendorById } from "@/features/make/vendors";

export default function CartScreen() {
  const { t, nm, dishName } = useMakeStrings();
  const cart = useMakeStore((s) => s.cart);
  const removeFromCart = useMakeStore((s) => s.removeFromCart);
  const vendorId = useMakeStore((s) => s.vendor);
  const setVendor = useMakeStore((s) => s.setVendor);
  const vendor = vendorById(vendorId);
  const checkoutLabel = [t.checkoutOn, vendor.label, t.checkoutSuffix].filter(Boolean).join(" ");

  const checkout = () => {
    void Linking.openURL(vendor.url).catch(() => toast(t.copyFail));
  };

  return (
    <Page background={make.background} gap={12}>
      <MakeHeader title={t.titles.cart} />
      {cart.length ? (
        <MCard padding={0} gap={0} style={{ overflow: "hidden" }}>
          {cart.map((c, index) => (
            <View
              key={`${c.dishId}-${c.name}`}
              style={{ flexDirection: "row", alignItems: "center", gap: 14, paddingHorizontal: 18, paddingVertical: 14, borderTopWidth: index ? 1 : 0, borderTopColor: make.border }}>
              <View style={{ flex: 1, minWidth: 0 }}>
                <MTxt weight="600">{nm(c.name, c.zh)}</MTxt>
                <MTxt variant="meta" muted numberOfLines={1}>
                  {c.amount} · {dishName(dishById(c.dishId))}
                </MTxt>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${t.del}: ${nm(c.name, c.zh)}`}
                onPress={() => removeFromCart(c.dishId, c.name)}
                style={({ pressed }) => ({ width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center", backgroundColor: pressed ? make.surfacePressed : make.surface2 })}>
                <Icon name="x" size={16} color={make.muted} />
              </Pressable>
            </View>
          ))}
        </MCard>
      ) : (
        <MCard>
          <EmptyNote>{t.handoffEmpty}</EmptyNote>
        </MCard>
      )}
      <View style={{ marginTop: "auto", gap: 10 }}>
        <Button size="lg" variant="primary" accent={make.primary} icon="shopping-cart" disabled={!cart.length} label={checkoutLabel} onPress={checkout} />
        <View style={{ flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
          <MTxt variant="caption" muted>
            {t.orderFrom}
          </MTxt>
          {VENDORS.map((v) => (
            <Chip key={v.id} label={v.label} active={v.id === vendor.id} accent={make.primary} onPress={() => setVendor(v.id)} style={{ minHeight: 34, paddingHorizontal: 12 }} />
          ))}
        </View>
        <Pressable accessibilityRole="link" onPress={() => void Linking.openURL(vendor.url)} style={{ alignSelf: "center" }}>
          <MTxt variant="caption" color={make.primaryPressed} align="center" style={{ fontFamily: "monospace", textDecorationLine: "underline" }}>
            {vendor.host}
          </MTxt>
        </Pressable>
      </View>
    </Page>
  );
}
