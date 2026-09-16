/* Responsive port of the device shell (prototype/device/index.html + lucky-ui.css):
 * ≥ 900 px: left navigation rail + top status bar (like the 1920x1080 kiosk);
 * narrower: compact top bar + bottom tab bar. */
import { usePathname, useRouter } from "expo-router";
import { useEffect, useState, type ReactNode } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Icon, Txt } from "@/components/ui";
import { SearchBar } from "@/components/shell/SearchBar";
import { useBreakpoint } from "@/hooks/use-breakpoint";
import { useI18n } from "@/i18n";
import { NAV_ROUTES, ROUTES, routeIdFor, type RouteId } from "@/lib/routes";
import { useRsvpSync } from "@/features/rsvp/useRsvpSync";
import { useDeviceStore } from "@/store/device";
import { radius, shell } from "@/theme";

function useClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(id);
  }, []);
  return now;
}

function NavRail({ routeId }: { routeId: RouteId }) {
  const router = useRouter();
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  return (
    <View style={{ width: 96, paddingTop: insets.top, paddingBottom: Math.max(insets.bottom, 16), backgroundColor: "#fff", borderRightWidth: 1, borderRightColor: shell.line }}>
      <View style={{ height: 88, justifyContent: "center", alignItems: "center" }}>
        <Txt variant="h3" weight="700" color={shell.green}>
          LT
        </Txt>
      </View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 10, gap: 8, flexGrow: 1 }}>
        {NAV_ROUTES.map((route) => {
          const active = route.id === routeId;
          return (
            <Pressable
              key={route.id}
              accessibilityRole="link"
              accessibilityState={{ selected: active }}
              accessibilityLabel={t(route.label)}
              onPress={() => router.navigate(route.href as never)}
              style={({ pressed }) => ({
                minHeight: 60,
                borderRadius: radius.sm,
                alignItems: "center",
                justifyContent: "center",
                gap: 4,
                backgroundColor: active ? shell.greenSoft : pressed ? shell.surfaceMuted : "transparent",
              })}>
              <Icon name={route.icon} size={24} color={active ? shell.green : shell.navText} />
              <Txt variant="caption" weight={active ? "700" : "500"} color={active ? shell.green : shell.navText} numberOfLines={1} style={{ flexShrink: 1 }}>
                {t(route.label)}
              </Txt>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

function BottomTabs({ routeId }: { routeId: RouteId }) {
  const router = useRouter();
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flexDirection: "row", backgroundColor: "#fff", borderTopWidth: 1, borderTopColor: shell.line, paddingBottom: insets.bottom, paddingHorizontal: 2 }}>
      {NAV_ROUTES.map((route) => {
        const active = route.id === routeId;
        return (
          <Pressable
            key={route.id}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            accessibilityLabel={t(route.label)}
            onPress={() => router.navigate(route.href as never)}
            style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 3, paddingVertical: 8, minHeight: 56 }}>
            <View style={{ paddingHorizontal: 12, paddingVertical: 3, borderRadius: radius.pill, backgroundColor: active ? shell.greenSoft : "transparent" }}>
              <Icon name={route.icon} size={22} color={active ? shell.green : shell.navText} />
            </View>
            <Txt variant="caption" weight={active ? "700" : "500"} color={active ? shell.green : shell.navText} numberOfLines={1} style={{ fontSize: 11, lineHeight: 14 }}>
              {t(route.label)}
            </Txt>
          </Pressable>
        );
      })}
    </View>
  );
}

function SettingsButton({ active, size }: { active: boolean; size: number }) {
  const router = useRouter();
  const { t } = useI18n();
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={t("設定")} onPress={() => router.navigate("/settings" as never)} style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: active ? shell.greenSoft : shell.surfaceMuted, borderWidth: 1, borderColor: active ? shell.green : shell.line, alignItems: "center", justifyContent: "center" }}>
      <Icon name="settings" size={size > 40 ? 22 : 20} color={shell.green} />
    </Pressable>
  );
}

/** Demo weather is a constant 24°C; converted to °F when the user picks Fahrenheit in
 * Settings → Display & language. */
function formatTemp(celsius: number, unit: "C" | "F") {
  const value = unit === "F" ? Math.round((celsius * 9) / 5 + 32) : Math.round(celsius);
  return `${value}°${unit}`;
}

function TopBar({ routeId, pathname, isWide }: { routeId: RouteId; pathname: string; isWide: boolean }) {
  const router = useRouter();
  const { t, formatTime, formatDate, formatClock } = useI18n();
  const insets = useSafeAreaInsets();
  const now = useClock();
  const wifi = useDeviceStore((s) => s.settings.wifi);
  const network = useDeviceStore((s) => s.settings.network);
  const tempUnit = useDeviceStore((s) => s.settings.tempUnit);
  const familyName = useDeviceStore((s) => s.settings.familyName);
  const title = pathname.startsWith("/make/cook") ? t("料理中") : pathname.startsWith("/calendar") ? t(familyName) : t(ROUTES.find((r) => r.id === routeId)?.label || "首頁");
  const onSettings = routeId === "settings";
  return (
    <View style={{ paddingTop: insets.top, minHeight: isWide ? 76 : 60, paddingHorizontal: isWide ? 24 : 16, flexDirection: "row", alignItems: "center", gap: isWide ? 12 : 10, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: shell.line }}>
      {isWide ? null : (
        <Txt variant="h3" weight="700" color={shell.green} style={{ marginRight: 4 }}>
          LT
        </Txt>
      )}
      <View style={{ flex: 1, minWidth: 60 }}>
        <Txt variant={isWide ? "h1" : "h3"} numberOfLines={1}>
          {title}
        </Txt>
      </View>
      <SearchBar compact={!isWide} />
      {isWide ? (
        <View style={{ flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "flex-end", gap: 14 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
            <Icon name="cloud-sun" size={22} color={shell.weather} />
            <Txt variant="card" weight="500" numberOfLines={1}>
              {formatTemp(24, tempUnit)}
            </Txt>
          </View>
          <View style={{ flexDirection: "row", alignItems: "baseline", gap: 8 }}>
            <Txt variant="card" muted numberOfLines={1}>
              {formatDate(now, { weekday: "short", month: "short", day: "numeric" })}
            </Txt>
            <Txt variant="h3" weight="600" numberOfLines={1} style={{ fontVariant: ["tabular-nums"] }}>
              {formatClock(now)}
            </Txt>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel={wifi ? t("{network} · 演示連線", { network }) : t("離線模式 · 演示")} onPress={() => router.navigate("/settings?section=device" as never)} style={{ width: 40, height: 40, alignItems: "center", justifyContent: "center" }}>
            <Icon name={wifi ? "wifi" : "wifi-off"} size={22} color={shell.green} />
          </Pressable>
          <SettingsButton active={onSettings} size={44} />
        </View>
      ) : (
        <>
          <Txt variant="h3" weight="600" style={{ fontVariant: ["tabular-nums"] }}>
            {formatTime(now)}
          </Txt>
          <SettingsButton active={onSettings} size={40} />
        </>
      )}
    </View>
  );
}

export function DeviceShell({ children }: { children: ReactNode }) {
  const { isWide } = useBreakpoint();
  useRsvpSync();
  const pathname = usePathname();
  const routeId = routeIdFor(pathname);
  const brightness = useDeviceStore((s) => s.settings.brightness);
  const dim = Math.max(0, (100 - brightness) / 250);
  return (
    <View style={{ flex: 1, flexDirection: isWide ? "row" : "column", backgroundColor: shell.canvas }}>
      {isWide ? <NavRail routeId={routeId} /> : null}
      <View style={{ flex: 1, minWidth: 0 }}>
        <TopBar routeId={routeId} pathname={pathname} isWide={isWide} />
        <View style={{ flex: 1, minHeight: 0 }}>{children}</View>
        {isWide ? null : <BottomTabs routeId={routeId} />}
      </View>
      {dim > 0 ? <View style={[StyleSheet.absoluteFill, { backgroundColor: "#000", opacity: dim, pointerEvents: "none" }]} /> : null}
    </View>
  );
}
