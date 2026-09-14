/* Responsive port of the device shell (prototype/device/index.html + lucky-ui.css):
 * ≥ 900 px: left navigation rail + top status bar (like the 1920x1080 kiosk);
 * narrower: compact top bar + bottom tab bar. */
import { usePathname, useRouter } from "expo-router";
import { useEffect, useState, type ReactNode } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Avatar, Button, DemoNotice, Icon, Txt } from "@/components/ui";
import { TodayTasksList } from "@/components/shell/TodayTasks";
import { todayKey } from "@/lib/date";
import { useBreakpoint } from "@/hooks/use-breakpoint";
import { useI18n } from "@/i18n";
import { today } from "@/lib/date";
import { ROUTES, routeIdFor, type RouteId } from "@/lib/routes";
import { dialog } from "@/store/dialog";
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

function MembersList() {
  const members = useDeviceStore((s) => s.members);
  const { t } = useI18n();
  return (
    <View>
      {members.map((person) => (
        <View key={person.id} style={{ flexDirection: "row", alignItems: "center", gap: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: shell.line }}>
          <Avatar color={person.color} initials={person.initials} />
          <View>
            <Txt variant="h3">{person.name}</Txt>
            <Txt variant="meta" muted>
              {t(person.role)}
            </Txt>
          </View>
        </View>
      ))}
    </View>
  );
}

function NavRail({ routeId, compact }: { routeId: RouteId; compact: boolean }) {
  const router = useRouter();
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const width = compact ? 96 : 208;
  return (
    <View style={{ width, paddingTop: insets.top, paddingBottom: Math.max(insets.bottom, 16), backgroundColor: "#fff", borderRightWidth: 1, borderRightColor: shell.line }}>
      <View style={{ height: compact ? 88 : 96, justifyContent: "center", paddingHorizontal: compact ? 0 : 24, alignItems: compact ? "center" : "flex-start" }}>
        <Txt variant={compact ? "h3" : "card"} weight="700" color={shell.green} numberOfLines={1} adjustsFontSizeToFit>
          {compact ? "LT" : "Lucky Table"}
        </Txt>
      </View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: compact ? 10 : 16, gap: 8, flexGrow: 1 }}>
        {ROUTES.map((route) => {
          const active = route.id === routeId;
          const last = route.id === "settings";
          return (
            <Pressable
              key={route.id}
              accessibilityRole="link"
              accessibilityState={{ selected: active }}
              accessibilityLabel={t(route.label)}
              onPress={() => router.navigate(route.href as never)}
              style={({ pressed }) => ({
                minHeight: 60,
                paddingHorizontal: compact ? 0 : 18,
                borderRadius: radius.sm,
                flexDirection: compact ? "column" : "row",
                alignItems: "center",
                justifyContent: compact ? "center" : "flex-start",
                gap: compact ? 4 : 12,
                marginTop: last ? "auto" : 0,
                backgroundColor: active ? shell.greenSoft : pressed ? shell.surfaceMuted : "transparent",
              })}>
              <Icon name={route.icon} size={compact ? 24 : 24} color={active ? shell.green : shell.navText} />
              <Txt variant={compact ? "caption" : "control"} weight={active ? "700" : "500"} color={active ? shell.green : shell.navText} numberOfLines={1} style={{ flexShrink: 1 }}>
                {t(route.label)}
              </Txt>
            </Pressable>
          );
        })}
      </ScrollView>
      {compact ? null : (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 28, paddingTop: 16 }}>
          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: shell.statusDot }} />
          <Txt variant="caption" muted numberOfLines={1} style={{ flexShrink: 1 }}>
            LT-15 · {t("本機演示裝置")}
          </Txt>
        </View>
      )}
    </View>
  );
}

function BottomTabs({ routeId }: { routeId: RouteId }) {
  const router = useRouter();
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flexDirection: "row", backgroundColor: "#fff", borderTopWidth: 1, borderTopColor: shell.line, paddingBottom: insets.bottom, paddingHorizontal: 2 }}>
      {ROUTES.map((route) => {
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

function TopBar({ routeId, pathname, isWide }: { routeId: RouteId; pathname: string; isWide: boolean }) {
  const router = useRouter();
  const { t, formatTime, formatDate } = useI18n();
  const insets = useSafeAreaInsets();
  const now = useClock();
  const city = useDeviceStore((s) => s.settings.city);
  const wifi = useDeviceStore((s) => s.settings.wifi);
  const network = useDeviceStore((s) => s.settings.network);
  const openTasks = useDeviceStore((s) => s.tasks.filter((task) => !task.completions.includes(todayKey)).length);
  const eventCount = useDeviceStore((s) => s.events.length);
  const taskCount = useDeviceStore((s) => s.tasks.length);
  const photoCount = useDeviceStore((s) => s.photoCount);
  const openTodayTasks = () => dialog.show({ title: t("今日家庭任務"), body: () => <TodayTasksList /> });
  const openSync = () =>
    dialog.show({
      title: t("家庭同步"),
      body: (
        <View style={{ gap: 12 }}>
          <DemoNotice>{t("本地互動原型，尚未連接家庭服務。")}</DemoNotice>
          <Txt>{t("{events} 個行程 · {tasks} 個家庭任務 · {photos} 張照片", { events: eventCount, tasks: taskCount, photos: photoCount })}</Txt>
        </View>
      ),
      footer: <Button variant="primary" label={t("知道了")} onPress={() => dialog.close()} />,
    });
  const title = pathname.startsWith("/make/cook") ? t("料理中") : t(ROUTES.find((r) => r.id === routeId)?.label || "首頁");
  const openAccount = () =>
    dialog.show({
      title: t("阿發家的成員"),
      body: () => <MembersList />,
      footer: (
        <Button
          variant="primary"
          label={t("家庭管理")}
          onPress={() => {
            dialog.close();
            router.navigate("/family" as never);
          }}
        />
      ),
    });
  return (
    <View style={{ paddingTop: isWide ? insets.top : insets.top, minHeight: isWide ? 80 : 60, paddingHorizontal: isWide ? 28 : 16, flexDirection: "row", alignItems: "center", gap: isWide ? 20 : 10, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: shell.line }}>
      {isWide ? null : (
        <Txt variant="h3" weight="700" color={shell.green} style={{ marginRight: 4 }}>
          LT
        </Txt>
      )}
      <Txt variant={isWide ? "h1" : "h3"} numberOfLines={1} style={{ flexShrink: 1, minWidth: 60 }}>
        {title}
      </Txt>
      {isWide ? (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginLeft: 8 }}>
          <Icon name="cloud-sun" size={26} color={shell.weather} />
          <Txt variant="body" muted numberOfLines={1}>
            {t(city)}{" "}
            <Txt variant="card" weight="500">
              24°
            </Txt>
          </Txt>
        </View>
      ) : null}
      {routeId === "home" ? (
        <Button variant="text" size="sm" icon="list-checks" label={isWide ? t("今日任務") : undefined} accessibilityLabel={t("今日任務")} onPress={openTodayTasks}>
          <View style={{ backgroundColor: shell.greenSoft, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2, minWidth: 26, alignItems: "center" }}>
            <Txt variant="meta" weight="600" color={shell.green}>
              {String(openTasks)}
            </Txt>
          </View>
        </Button>
      ) : null}
      <View style={{ flex: 1 }} />
      {isWide ? (
        <Pressable accessibilityRole="button" accessibilityLabel={t("家庭同步")} onPress={openSync} style={{ width: 48, height: 48, alignItems: "center", justifyContent: "center" }}>
          <Icon name="cloud-check" size={24} color={shell.muted} />
        </Pressable>
      ) : null}
      {isWide ? (
        <Pressable accessibilityRole="button" accessibilityLabel={wifi ? t("{network} · 演示連線", { network }) : t("離線模式 · 演示")} onPress={() => router.navigate("/settings?section=device" as never)} style={{ width: 48, height: 48, alignItems: "center", justifyContent: "center" }}>
          <Icon name={wifi ? "wifi" : "wifi-off"} size={24} color={shell.green} />
        </Pressable>
      ) : null}
      <View style={{ alignItems: "flex-end" }}>
        <Txt variant={isWide ? "h1" : "h3"} weight="600" style={{ fontVariant: ["tabular-nums"] }}>
          {formatTime(now)}
        </Txt>
        {isWide ? (
          <Txt variant="meta" muted numberOfLines={1}>
            {routeId === "home" ? formatDate(today, { year: "numeric", month: "long", day: "numeric" }) : formatDate(today, { month: "short", day: "numeric", weekday: "short" })}
          </Txt>
        ) : null}
      </View>
      <Pressable accessibilityRole="button" accessibilityLabel={t("阿發家的成員")} onPress={openAccount} style={{ width: isWide ? 48 : 40, height: isWide ? 48 : 40, borderRadius: 24, backgroundColor: shell.surfaceMuted, borderWidth: 1, borderColor: shell.line, alignItems: "center", justifyContent: "center" }}>
        <Icon name="user-round" size={isWide ? 24 : 20} color={shell.green} />
      </Pressable>
    </View>
  );
}

export function DeviceShell({ children }: { children: ReactNode }) {
  const { isWide, width } = useBreakpoint();
  const pathname = usePathname();
  const routeId = routeIdFor(pathname);
  const brightness = useDeviceStore((s) => s.settings.brightness);
  const dim = Math.max(0, (100 - brightness) / 250);
  return (
    <View style={{ flex: 1, flexDirection: isWide ? "row" : "column", backgroundColor: shell.canvas }}>
      {isWide ? <NavRail routeId={routeId} compact={width < 1100} /> : null}
      <View style={{ flex: 1, minWidth: 0 }}>
        <TopBar routeId={routeId} pathname={pathname} isWide={isWide} />
        <View style={{ flex: 1, minHeight: 0 }}>{children}</View>
        {isWide ? null : <BottomTabs routeId={routeId} />}
      </View>
      {dim > 0 ? <View style={[StyleSheet.absoluteFill, { backgroundColor: "#000", opacity: dim, pointerEvents: "none" }]} /> : null}
    </View>
  );
}
