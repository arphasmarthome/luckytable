/* Phone page (opened from the QR code in Settings › Link phone): pick who you are and answer
 * whether you're joining dinner tonight. Talks to the same relay the device polls. */
import { Image } from "expo-image";
import { useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Platform, Pressable, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Avatar, Icon, Txt } from "@/components/ui";
import { useI18n } from "@/i18n";
import { radius, shell } from "@/theme";
import { fetchRsvp, sendReply, type RsvpState } from "@/features/rsvp/client";

const MEMBER_KEY = "luckytable-phone-member";
const POLL_MS = 4000;
const readSaved = () => { try { return Platform.OS === "web" ? localStorage.getItem(MEMBER_KEY) : null; } catch { return null; } };
const saveMember = (id: string) => { try { if (Platform.OS === "web") localStorage.setItem(MEMBER_KEY, id); } catch { /* private mode */ } };

export default function PhoneScreen() {
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ device?: string | string[]; member?: string | string[] }>();
  const device = String(Array.isArray(params.device) ? params.device[0] : params.device || "");
  const [state, setState] = useState<RsvpState | null>(null);
  const [failed, setFailed] = useState(false);
  const [me, setMe] = useState<string | null>(() => (Array.isArray(params.member) ? params.member[0] : params.member) || readSaved());
  const [sending, setSending] = useState(false);
  const [sentAt, setSentAt] = useState(0);

  const refresh = useCallback(async () => {
    if (!device) return;
    const next = await fetchRsvp(device);
    setFailed(!next);
    if (next) setState(next);
  }, [device]);
  useEffect(() => {
    void refresh();
    const handle = setInterval(() => void refresh(), POLL_MS);
    return () => clearInterval(handle);
  }, [refresh]);

  const snapshot = state?.snapshot;
  const members = snapshot?.members || [];
  const self = members.find((m) => m.id === me) || null;
  const answer = self ? state?.joining[self.id] : undefined;
  const reply = async (joining: boolean) => {
    if (!self || sending) return;
    setSending(true);
    const next = await sendReply(device, self.id, joining, "phone");
    setSending(false);
    if (next) {
      setState(next);
      setSentAt(Date.now());
    } else setFailed(true);
  };

  const pick = (id: string) => {
    setMe(id);
    saveMember(id);
  };

  return (
    <View style={{ flex: 1, backgroundColor: shell.canvas }}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 20, paddingBottom: insets.bottom + 28, paddingHorizontal: 20, gap: 18, maxWidth: 520, width: "100%", alignSelf: "center" }}>
        <View style={{ gap: 4 }}>
          <Txt variant="caption" weight="700" color={shell.green} style={{ letterSpacing: 2, textTransform: "uppercase" }}>
            Lucky Table
          </Txt>
          <Txt variant="h1">{snapshot?.familyName || t("家人")}</Txt>
          <Txt variant="meta" muted>
            {snapshot?.dinnerTime ? t("晚餐 {time}", { time: snapshot.dinnerTime }) : device ? t("等待裝置連線…") : t("離線模式 · 演示")}
          </Txt>
        </View>

        {failed ? (
          <View style={{ padding: 12, borderRadius: radius.md, backgroundColor: "#fdece9" }}>
            <Txt variant="meta" color={shell.danger}>
              {t("連線失敗，稍後再試")}
            </Txt>
          </View>
        ) : null}

        <View style={{ gap: 10 }}>
          <Txt variant="h3">{t("你是誰？")}</Txt>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {members.length ? (
              members.map((m) => {
                const on = m.id === me;
                return (
                  <Pressable key={m.id} accessibilityRole="radio" accessibilityState={{ selected: on }} accessibilityLabel={m.name} onPress={() => pick(m.id)} style={{ flexDirection: "row", alignItems: "center", gap: 8, paddingLeft: 6, paddingRight: 14, height: 44, borderRadius: 22, borderWidth: on ? 2 : 1, borderColor: on ? shell.green : shell.line, backgroundColor: on ? shell.greenSoft : shell.surface }}>
                    <Avatar color={m.color} initials={m.initials} size={32} />
                    <Txt variant="body" weight={on ? "700" : "500"} color={on ? shell.green : shell.ink}>
                      {m.name}
                    </Txt>
                  </Pressable>
                );
              })
            ) : (
              <Txt variant="meta" muted>
                {t("等待裝置連線…")}
              </Txt>
            )}
          </View>
        </View>

        <View style={{ gap: 12, padding: 18, borderRadius: radius.lg, backgroundColor: shell.surface, borderWidth: 1, borderColor: shell.line }}>
          <Txt variant="h2">{t("今晚要一起吃嗎？")}</Txt>
          <View style={{ flexDirection: "row", gap: 10 }}>
            <Pressable accessibilityRole="button" accessibilityLabel={t("我會到")} accessibilityState={{ selected: answer === true }} disabled={!self || sending} onPress={() => void reply(true)} style={({ pressed }) => ({ flex: 1, minHeight: 64, borderRadius: radius.md, alignItems: "center", justifyContent: "center", gap: 4, opacity: !self ? 0.5 : pressed ? 0.85 : 1, backgroundColor: answer === true ? "#3ee36f" : shell.greenSoft, borderWidth: 2, borderColor: answer === true ? "#3ee36f" : shell.line })}>
              <Icon name="check" size={24} color={answer === true ? shell.ink : shell.green} strokeWidth={2.6} />
              <Txt variant="body" weight="700" color={shell.ink}>
                {t("我會到")}
              </Txt>
            </Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel={t("今晚不會")} accessibilityState={{ selected: answer === false }} disabled={!self || sending} onPress={() => void reply(false)} style={({ pressed }) => ({ flex: 1, minHeight: 64, borderRadius: radius.md, alignItems: "center", justifyContent: "center", gap: 4, opacity: !self ? 0.5 : pressed ? 0.85 : 1, backgroundColor: answer === false ? "#8a94a6" : shell.surfaceMuted, borderWidth: 2, borderColor: answer === false ? "#8a94a6" : shell.line })}>
              <Icon name="x" size={24} color={answer === false ? "#fff" : shell.muted} strokeWidth={2.6} />
              <Txt variant="body" weight="700" color={answer === false ? "#fff" : shell.ink}>
                {t("今晚不會")}
              </Txt>
            </Pressable>
          </View>
          {sentAt ? (
            <Txt variant="caption" color={shell.green}>
              {t("已送出 · 餐桌上的裝置會立即更新")}
            </Txt>
          ) : null}
        </View>

        {snapshot?.tonight.length ? (
          <View style={{ gap: 10 }}>
            <Txt variant="h3">{t("今晚的菜色")}</Txt>
            {snapshot.tonight.map((d) => (
              <View key={d.id} style={{ flexDirection: "row", alignItems: "center", gap: 12, padding: 8, borderRadius: radius.md, backgroundColor: shell.surface, borderWidth: 1, borderColor: shell.line }}>
                <View style={{ width: 64, height: 48, borderRadius: radius.sm, overflow: "hidden", backgroundColor: shell.surfaceMuted }}>
                  {d.img ? <Image source={{ uri: d.img }} contentFit="cover" style={{ width: "100%", height: "100%" }} accessibilityLabel="" /> : null}
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Txt variant="body" weight="600" numberOfLines={1}>
                    {d.name}
                  </Txt>
                  {d.minutes ? (
                    <Txt variant="meta" muted>
                      {d.minutes} {t("分鐘")}
                    </Txt>
                  ) : null}
                </View>
              </View>
            ))}
          </View>
        ) : null}

        {members.length ? (
          <View style={{ gap: 8 }}>
            <Txt variant="h3">{t("誰會來")}</Txt>
            {members.map((m) => {
              const value = state?.joining[m.id];
              return (
                <View key={m.id} style={{ flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: shell.line }}>
                  <Avatar color={m.color} initials={m.initials} size={28} />
                  <Txt variant="body" weight="600" style={{ flex: 1 }}>
                    {m.name}
                  </Txt>
                  <Icon name={value === false ? "x" : "check"} size={18} color={value === false ? shell.muted : "#2f9e57"} strokeWidth={2.6} />
                  <Txt variant="meta" weight="600" color={value === false ? shell.muted : "#2f9e57"}>
                    {value === false ? t("否") : t("是")}
                  </Txt>
                </View>
              );
            })}
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}
