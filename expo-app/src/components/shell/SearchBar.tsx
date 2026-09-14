/* Universal search in the top bar: dishes, today's and upcoming events, family members and
 * pages, with a voice button (Web Speech API on browsers that have it; a demo note elsewhere). */
import { useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Platform, Pressable, TextInput, View } from "react-native";
import { Icon, Txt } from "@/components/ui";
import { MAKE_DISHES, MAKE_DISH_IMG } from "@/features/make/dishes";
import { useBreakpoint } from "@/hooks/use-breakpoint";
import { t, useI18n } from "@/i18n";
import { todayKey } from "@/lib/date";
import { ROUTES } from "@/lib/routes";
import { dialog } from "@/store/dialog";
import { memberById, useDeviceStore } from "@/store/device";
import { toast } from "@/store/toast";
import { fontFamily, radius, shell } from "@/theme";

type Hit = { key: string; icon: string; title: string; meta: string; href: string };

function useHits(query: string): Hit[] {
  const { t, isZh } = useI18n();
  const events = useDeviceStore((s) => s.events);
  const members = useDeviceStore((s) => s.members);
  return useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const hits: Hit[] = [];
    for (const route of ROUTES) {
      const label = t(route.label);
      if (label.toLowerCase().includes(q) || route.id.includes(q)) hits.push({ key: `page-${route.id}`, icon: route.icon, title: label, meta: t("頁面"), href: route.href });
    }
    for (const m of members) {
      if (m.name.toLowerCase().includes(q)) hits.push({ key: `member-${m.id}`, icon: "user-round", title: m.name, meta: t(m.role), href: "/settings?section=family" });
    }
    for (const e of events) {
      if (t(e.title).toLowerCase().includes(q) && e.date >= todayKey) hits.push({ key: `event-${e.id}`, icon: "calendar-days", title: t(e.title), meta: `${e.date} ${e.time || t("全天")} · ${memberById(e.memberId, members).name}`, href: `/calendar?view=day&date=${e.date}&eventId=${e.id}` });
      if (hits.length > 14) break;
    }
    let dishes = 0;
    for (const d of MAKE_DISHES) {
      if (dishes >= 8) break;
      if (d.name.toLowerCase().includes(q) || d.zh.includes(query.trim()) || d.cat.toLowerCase().includes(q)) {
        dishes += 1;
        hits.push({ key: `dish-${d.id}`, icon: MAKE_DISH_IMG[d.id] ? "utensils" : "chef-hat", title: isZh ? d.zh : d.name, meta: `${t("做菜")} · ${d.cat}`, href: `/make/dish/${d.id}` });
      }
    }
    return hits.slice(0, 18);
  }, [query, events, members, t, isZh]);
}

function Results({ query, onPick }: { query: string; onPick: () => void }) {
  const { t } = useI18n();
  const router = useRouter();
  const hits = useHits(query);
  if (!query.trim()) return <Txt muted>{t("輸入菜名、行程、家人或頁面名稱。")}</Txt>;
  if (!hits.length) return <Txt muted>{t("找不到「{q}」。", { q: query.trim() })}</Txt>;
  return (
    <View style={{ gap: 4 }}>
      {hits.map((hit) => (
        <Pressable
          key={hit.key}
          accessibilityRole="button"
          onPress={() => {
            onPick();
            router.navigate(hit.href as never);
          }}
          style={({ pressed }) => ({ flexDirection: "row", alignItems: "center", gap: 12, minHeight: 48, paddingHorizontal: 10, borderRadius: radius.sm, backgroundColor: pressed ? shell.surfaceMuted : "transparent" })}>
          <Icon name={hit.icon} size={20} color={shell.green} />
          <View style={{ flex: 1, minWidth: 0 }}>
            <Txt variant="control" weight="500" numberOfLines={1}>
              {hit.title}
            </Txt>
            <Txt variant="caption" muted numberOfLines={1}>
              {hit.meta}
            </Txt>
          </View>
          <Icon name="arrow-right" size={16} color={shell.muted} />
        </Pressable>
      ))}
    </View>
  );
}

type Recognition = { lang: string; interimResults: boolean; onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null; onerror: (() => void) | null; onend: (() => void) | null; start: () => void; stop: () => void };
function speechRecognition(): (new () => Recognition) | null {
  if (Platform.OS !== "web" || typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: new () => Recognition; webkitSpeechRecognition?: new () => Recognition };
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

let setQueryExternal: ((q: string) => void) | null = null;

/** Opens the search dialog (optionally starting with a query). */
export function openSearch(initial = "", startListening = false) {
  let query = initial;
  const Body = () => {
    const { t, tag } = useI18n();
    const [q, setQ] = useState(query);
    const [listening, setListening] = useState(false);
    const recognizer = useRef<Recognition | null>(null);
    const voice = () => {
      const Ctor = speechRecognition();
      if (!Ctor) {
        toast(t("此瀏覽器不支援語音輸入（示範）"));
        return;
      }
      if (listening) {
        recognizer.current?.stop();
        return;
      }
      const rec = new Ctor();
      recognizer.current = rec;
      rec.lang = tag;
      rec.interimResults = true;
      rec.onresult = (e) => {
        const text = Array.from(e.results).map((r) => r[0].transcript).join(" ");
        query = text;
        setQ(text);
      };
      rec.onerror = () => setListening(false);
      rec.onend = () => setListening(false);
      setListening(true);
      rec.start();
    };
    useEffect(() => {
      setQueryExternal = (value) => {
        query = value;
        setQ(value);
      };
      if (startListening) voice();
      return () => {
        setQueryExternal = null;
        recognizer.current?.stop();
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    return (
      <View style={{ gap: 14 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <View style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 8, minHeight: 48, paddingHorizontal: 12, borderWidth: 1, borderColor: shell.inputBorder, borderRadius: radius.pill, backgroundColor: "#fff" }}>
            <Icon name="search" size={18} color={shell.muted} />
            <TextInput
              autoFocus
              value={q}
              onChangeText={(value) => {
                query = value;
                setQ(value);
              }}
              placeholder={t("搜尋菜色、行程、家人…")}
              placeholderTextColor={shell.muted}
              style={[{ flex: 1, fontSize: 16, color: shell.ink, paddingVertical: 8 }, fontFamily ? { fontFamily } : null, Platform.OS === "web" ? ({ outlineStyle: "none" } as object) : null]}
            />
            {q ? (
              <Pressable accessibilityRole="button" accessibilityLabel={t("清除")} onPress={() => { query = ""; setQ(""); }} hitSlop={8}>
                <Icon name="x" size={16} color={shell.muted} />
              </Pressable>
            ) : null}
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel={t("語音搜尋")} accessibilityState={{ selected: listening }} onPress={voice} style={{ width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center", backgroundColor: listening ? shell.danger : shell.greenSoft }}>
            <Icon name={listening ? "mic-off" : "mic"} size={20} color={listening ? "#fff" : shell.green} />
          </Pressable>
        </View>
        {listening ? (
          <Txt variant="meta" color={shell.danger}>
            {t("聆聽中…再按一次停止。")}
          </Txt>
        ) : null}
        <Results query={q} onPick={() => dialog.close()} />
      </View>
    );
  };
  dialog.show({ title: t("搜尋"), body: () => <Body />, onClose: () => { setQueryExternal = null; } });
}

/** Search field for the top bar (a compact icon button on narrow screens). */
export function SearchBar({ compact }: { compact?: boolean }) {
  const { t } = useI18n();
  const { isDesktop } = useBreakpoint();
  if (compact) {
    return (
      <Pressable accessibilityRole="button" accessibilityLabel={t("搜尋")} onPress={() => openSearch()} style={{ width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", backgroundColor: shell.surfaceMuted, borderWidth: 1, borderColor: shell.line }}>
        <Icon name="search" size={18} color={shell.ink} />
      </Pressable>
    );
  }
  return (
    <View style={{ flexDirection: "row", alignItems: "center", height: 44, width: isDesktop ? 300 : 220, paddingRight: 6, borderRadius: radius.pill, borderWidth: 1, borderColor: shell.line, backgroundColor: shell.canvas }}>
      <Pressable accessibilityRole="button" accessibilityLabel={t("搜尋")} onPress={() => openSearch()} style={({ pressed }) => ({ flex: 1, flexDirection: "row", alignItems: "center", gap: 10, height: "100%", paddingLeft: 14, opacity: pressed ? 0.7 : 1 })}>
        <Icon name="search" size={18} color={shell.muted} />
        <Txt variant="meta" muted numberOfLines={1} style={{ flex: 1 }}>
          {t("搜尋菜色、行程、家人…")}
        </Txt>
      </Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel={t("語音搜尋")} onPress={() => openSearch("", true)} style={{ width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center", backgroundColor: shell.greenSoft }}>
        <Icon name="mic" size={16} color={shell.green} />
      </Pressable>
    </View>
  );
}
