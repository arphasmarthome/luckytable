/* Settings (prototype renderSettings): category nav on the left (horizontal strip on phones) + the section content.
 * `?section=` in the URL wins over the stored section; the store is kept in sync so other modules can deep-link. */
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useRef } from "react";
import { Platform, Pressable, ScrollView, View } from "react-native";
import { Icon, Page, Txt } from "@/components/ui";
import { DeviceSection } from "@/features/settings/DeviceSection";
import { DisplaySection } from "@/features/settings/DisplaySection";
import { FrameSection } from "@/features/settings/FrameSection";
import { HouseholdSection } from "@/features/settings/HouseholdSection";
import { RemindersSection } from "@/features/settings/RemindersSection";
import { useBreakpoint } from "@/hooks/use-breakpoint";
import { useI18n } from "@/i18n";
import { useDeviceStore, type SettingsSection } from "@/store/device";
import { radius, shell } from "@/theme";

const TABS: { id: SettingsSection; label: string; icon: string }[] = [
  { id: "device", label: "裝置與資料", icon: "monitor" },
  { id: "display", label: "顯示與語言", icon: "sun" },
  { id: "family", label: "家庭", icon: "users" },
  { id: "reminders", label: "家庭提醒", icon: "bell" },
  { id: "frame", label: "相框", icon: "images" },
];
const isSection = (value: unknown): value is SettingsSection => TABS.some((tab) => tab.id === value);

function SettingsNav({ section, onSelect }: { section: SettingsSection; onSelect: (id: SettingsSection) => void }) {
  const { t } = useI18n();
  const { isWide, isDesktop } = useBreakpoint();
  /* phone strip: keep the active tab in view. Native measures via onLayout; on web onLayout does not fire for
     items inside the horizontal ScrollView, so the DOM nodes are measured directly. */
  const strip = useRef<ScrollView>(null);
  const offsets = useRef<Partial<Record<SettingsSection, number>>>({});
  const nodes = useRef<Partial<Record<SettingsSection, View | null>>>({});
  const scrollToActive = useCallback(() => {
    if (isWide) return;
    type DomNode = { scrollTo?: (options: { left: number; behavior?: string }) => void; scrollLeft: number; getBoundingClientRect: () => { left: number } };
    const scroller = (strip.current as unknown as { getScrollableNode?: () => DomNode } | null)?.getScrollableNode?.();
    let x = offsets.current[section];
    const item = nodes.current[section] as unknown as { getBoundingClientRect?: () => { left: number } } | null | undefined;
    if (Platform.OS === "web" && scroller && item?.getBoundingClientRect) x = item.getBoundingClientRect().left - scroller.getBoundingClientRect().left + scroller.scrollLeft;
    if (x === undefined) return;
    const left = Math.max(0, x - 16);
    if (scroller?.scrollTo) scroller.scrollTo({ left, behavior: "smooth" });
    else strip.current?.scrollTo({ x: left, animated: true });
  }, [section, isWide]);
  useEffect(() => {
    const id = setTimeout(scrollToActive, 50);
    return () => clearTimeout(id);
  }, [scrollToActive]);
  const items = TABS.map((tab) => {
    const active = tab.id === section;
    const item = (
      <Pressable
        key={tab.id}
        accessibilityRole="tab"
        accessibilityState={{ selected: active }}
        onPress={() => onSelect(tab.id)}
        style={({ pressed }) => ({ flexDirection: "row", alignItems: "center", gap: 12, minHeight: isWide ? 64 : 44, paddingHorizontal: 14, paddingVertical: isWide ? 14 : 8, borderRadius: radius.sm, backgroundColor: active ? shell.greenSoft : pressed ? shell.surfaceMuted : "transparent" })}>
        <Icon name={tab.icon} size={isWide ? 22 : 18} color={active ? shell.green : "#617068"} />
        <Txt variant={isDesktop ? "card" : isWide ? "body" : "meta"} weight={active ? "600" : "400"} color={active ? shell.green : "#617068"} style={isWide ? { flex: 1 } : undefined}>
          {t(tab.label)}
        </Txt>
        {isWide ? <Icon name="chevron-right" size={17} color={active ? shell.green : "#617068"} /> : null}
      </Pressable>
    );
    if (isWide) return item;
    return (
      <View
        key={tab.id}
        ref={(node) => {
          nodes.current[tab.id] = node;
        }}
        onLayout={(e) => {
          offsets.current[tab.id] = e.nativeEvent.layout.x;
          if (active) scrollToActive();
        }}>
        {item}
      </View>
    );
  });
  if (!isWide) {
    return (
      <ScrollView ref={strip} horizontal showsHorizontalScrollIndicator={false} onContentSizeChange={scrollToActive} accessibilityLabel={t("設定分類")} contentContainerStyle={{ gap: 6, paddingBottom: 4 }}>
        {items}
      </ScrollView>
    );
  }
  return (
    <View accessibilityLabel={t("設定分類")} style={{ width: isDesktop ? 244 : 200, paddingRight: isDesktop ? 24 : 16, paddingTop: 6, gap: 10, borderRightWidth: 1, borderRightColor: shell.line }}>
      <Txt variant="h3" weight="500" muted style={{ marginHorizontal: 14, marginTop: 6, marginBottom: 12 }}>
        {t("偏好設定")}
      </Txt>
      {items}
    </View>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ section?: string | string[] }>();
  const paramSection = Array.isArray(params.section) ? params.section[0] : params.section;
  const stored = useDeviceStore((s) => s.settings.section);
  const setSettings = useDeviceStore((s) => s.setSettings);
  const { isWide, isDesktop } = useBreakpoint();

  /* A `?section=` param is applied to the store once; after that the store (tab clicks) is the source of truth. */
  const applied = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (applied.current === paramSection) return;
    applied.current = paramSection;
    if (isSection(paramSection) && paramSection !== useDeviceStore.getState().settings.section) setSettings({ section: paramSection });
  }, [paramSection, setSettings]);

  const pendingParam = isSection(paramSection) && applied.current !== paramSection ? paramSection : undefined;
  const section: SettingsSection = pendingParam ?? (isSection(stored) ? stored : "device");
  const select = (id: SettingsSection) => {
    setSettings({ section: id });
    router.setParams({ section: id } as never);
  };

  const content = section === "device" ? <DeviceSection /> : section === "display" ? <DisplaySection /> : section === "family" ? <HouseholdSection /> : section === "reminders" ? <RemindersSection /> : <FrameSection />;

  if (!isWide) {
    return (
      <Page gap={16}>
        <SettingsNav section={section} onSelect={select} />
        {content}
      </Page>
    );
  }
  return (
    <Page>
      <View style={{ flexDirection: "row", gap: isDesktop ? 40 : 24, alignItems: "flex-start" }}>
        <SettingsNav section={section} onSelect={select} />
        <View style={{ flex: 1, minWidth: 0 }}>{content}</View>
      </View>
    </Page>
  );
}
