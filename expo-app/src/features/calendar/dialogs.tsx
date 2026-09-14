/* Dialog contents of the calendar module (eventForm, detail, delete confirm, jump, sync and the
 * voice flow voiceMember → voiceInput → confirm from prototype/device/calendar.js).
 * Each opener passes a render function so the body re-renders with store / language changes. */
import { useState, type ReactNode } from "react";
import { Pressable, View } from "react-native";
import { Button, Chip, Icon, TextField, Toggle, Txt } from "@/components/ui";
import { useBreakpoint } from "@/hooks/use-breakpoint";
import { t as translate, useI18n } from "@/i18n";
import { todayKey } from "@/lib/date";
import { memberById, useDeviceStore } from "@/store/device";
import { dialog } from "@/store/dialog";
import { toast } from "@/store/toast";
import { radius, shell, tint } from "@/theme";
import { deleteEvent, jumpTo, saveEvent } from "./actions";
import { cal, memberInitial, type CalEvent, type EventDraft } from "./helpers";
import { useCalendarUi } from "./store";
import { parseVoice } from "./voice";

/* ───────── small shared pieces ───────── */

function Badge({ children }: { children: string }) {
  return (
    <View style={{ backgroundColor: cal.badgeBg, borderRadius: radius.sm, paddingHorizontal: 10, paddingVertical: 6, alignSelf: "flex-start" }}>
      <Txt variant="meta" weight="500" color={cal.badgeFg}>
        {children}
      </Txt>
    </View>
  );
}

function VoiceContext({ step, transcript }: { step?: string; transcript?: string }) {
  const { t } = useI18n();
  return (
    <View style={{ gap: 6 }}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
        <Badge>{step ? t("App 語音流程演示") : t("語音流程演示")}</Badge>
        {step ? (
          <Txt variant="meta" muted>
            {step}
          </Txt>
        ) : null}
      </View>
      {transcript ? (
        <Txt variant="body" muted>
          {transcript}
        </Txt>
      ) : null}
    </View>
  );
}

function DialogActions({ children }: { children: ReactNode }) {
  return <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 12, paddingTop: 16, marginTop: 4, borderTopWidth: 1, borderTopColor: "#e8ece9" }}>{children}</View>;
}

function FormError({ message }: { message: string }) {
  if (!message) return null;
  return (
    <Txt variant="body" color={cal.error} accessibilityRole="alert" accessibilityLiveRegion="polite">
      {message}
    </Txt>
  );
}

export function MemberDot({ color, size = 9 }: { color: string; size?: number }) {
  return <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: color }} />;
}

function MemberChipLabel({ color, name }: { color: string; name: string }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 8, alignSelf: "flex-start", minHeight: 36, paddingHorizontal: 12, borderRadius: radius.pill, backgroundColor: shell.surfaceMuted }}>
      <MemberDot color={color} />
      <Txt variant="control" weight="500">
        {name}
      </Txt>
    </View>
  );
}

/* ───────── event form (new / edit / voice confirm) ───────── */

function EventForm({ draft, fromVoice }: { draft: EventDraft; fromVoice: boolean }) {
  const { t } = useI18n();
  const { isPhone } = useBreakpoint();
  const members = useDeviceStore((s) => s.members);
  const calendar = useDeviceStore((s) => s.calendar);
  const voiceDraft = useCalendarUi((s) => s.voiceDraft);
  const initialMember = draft.memberId || (calendar.member !== "all" ? calendar.member : members[0]?.id || "family");
  const [title, setTitle] = useState(draft.title ? t(draft.title) : "");
  const [date, setDate] = useState(draft.date ?? calendar.date ?? todayKey);
  const [memberId, setMemberId] = useState(initialMember);
  const [allDay, setAllDay] = useState(draft.time === "" && !draft.needsTime);
  const [time, setTime] = useState(draft.time ?? "09:00");
  const [endTime, setEndTime] = useState(draft.endTime || "");
  const [location, setLocation] = useState(draft.location ? t(draft.location) : "");
  const [note, setNote] = useState(draft.note || "");
  const [error, setError] = useState("");
  const owner = memberById(memberId, members);
  const source: "manual" | "voice" = fromVoice ? "voice" : draft.source || "manual";
  const people = [...members.map((person) => ({ id: person.id, name: person.name, color: person.color })), { id: "family", name: t("全家"), color: cal.family }];

  const submit = () => {
    const message = saveEvent({ id: draft.id || "", title, date, allDay, time, endTime, memberId, location, note, source });
    if (message) setError(message);
  };

  return (
    <View style={{ gap: 15 }}>
      {fromVoice ? <VoiceContext transcript={voiceDraft?.transcript || ""} /> : null}
      <TextField label={t("行程名稱")} value={title} onChangeText={setTitle} placeholder={t("例如：接孩子放學")} maxLength={60} autoFocus returnKeyType="done" />
      <View style={{ flexDirection: isPhone ? "column" : "row", gap: 15 }}>
        <TextField label={t("日期")} value={date} onChangeText={setDate} placeholder="YYYY-MM-DD" maxLength={10} autoCapitalize="none" style={{ flex: isPhone ? undefined : 1 }} />
        <View style={{ flex: isPhone ? undefined : 1, gap: 8 }}>
          <Txt variant="control" weight="500">
            {t("所屬成員")}
          </Txt>
          {fromVoice ? (
            <TextField value={owner.name} editable={false} inputStyle={{ backgroundColor: "#f5f7f5", color: "#697b6f" }} />
          ) : (
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {people.map((person) => (
                <Chip key={person.id} label={person.name} active={memberId === person.id} accent={person.color} onPress={() => setMemberId(person.id)} style={{ minHeight: 44 }} />
              ))}
            </View>
          )}
        </View>
      </View>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10, minHeight: 44 }}>
        <Toggle value={allDay} onChange={setAllDay} accessibilityLabel={t("全天")} />
        <Txt variant="control" color="#5e6e63">
          {t("全天")}
        </Txt>
      </View>
      <View style={{ flexDirection: isPhone ? "column" : "row", gap: 15 }}>
        <TextField
          label={`${t("開始時間")}${draft.needsTime ? t("（待補充）") : ""}`}
          value={time}
          onChangeText={setTime}
          placeholder="HH:MM"
          maxLength={5}
          editable={!allDay}
          keyboardType="numbers-and-punctuation"
          inputStyle={allDay ? { backgroundColor: "#f5f7f5", color: "#697b6f" } : undefined}
          style={{ flex: isPhone ? undefined : 1 }}
        />
        <TextField
          label={t("結束時間（選填）")}
          value={endTime}
          onChangeText={setEndTime}
          placeholder="HH:MM"
          maxLength={5}
          editable={!allDay}
          keyboardType="numbers-and-punctuation"
          inputStyle={allDay ? { backgroundColor: "#f5f7f5", color: "#697b6f" } : undefined}
          style={{ flex: isPhone ? undefined : 1 }}
        />
      </View>
      <TextField label={t("地點（選填）")} value={location} onChangeText={setLocation} placeholder={t("添加地點")} maxLength={100} />
      <TextField label={t("備註（選填）")} value={note} onChangeText={setNote} placeholder={t("添加行程備註")} maxLength={500} multiline />
      <FormError message={error} />
      <DialogActions>
        {fromVoice ? <Button variant="ghost" label={t("返回修改")} onPress={openVoiceInput} /> : <Button variant="ghost" label={t("取消")} onPress={() => dialog.close()} />}
        <Button variant="primary" icon="check" label={fromVoice ? t("確認加入行事曆") : t("儲存行程")} onPress={submit} />
      </DialogActions>
    </View>
  );
}

/** cal-add / cal-edit / voice confirm. */
export function openEventForm(draft: EventDraft = {}, fromVoice = false) {
  const key = `${draft.id || "new"}-${Date.now()}`;
  dialog.show({
    title: fromVoice ? translate("核對語音行程") : draft.id ? translate("編輯行程") : translate("新增行程"),
    body: () => <EventForm key={key} draft={draft} fromVoice={fromVoice} />,
  });
}

/* ───────── detail + delete ───────── */

function DetailRow({ icon, label, children }: { icon?: string; label: string; children: string }) {
  const { isPhone } = useBreakpoint();
  return (
    <View style={{ flexDirection: isPhone ? "column" : "row", gap: isPhone ? 4 : 18 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 7, width: isPhone ? undefined : 110 }}>
        {icon ? <Icon name={icon} size={20} color="#8a968d" /> : null}
        <Txt variant="control" color="#8a968d">
          {label}
        </Txt>
      </View>
      <Txt variant="control" color="#3d5043" style={{ flex: 1 }}>
        {children}
      </Txt>
    </View>
  );
}

function EventDetail({ id }: { id: string }) {
  const { t } = useI18n();
  const event = useDeviceStore((s) => s.events.find((item) => item.id === id)) as CalEvent | undefined;
  const members = useDeviceStore((s) => s.members);
  if (!event) return <Txt muted>{t("此行程已不存在")}</Txt>;
  const owner = memberById(event.memberId, members);
  return (
    <View style={{ gap: 20 }}>
      <MemberChipLabel color={owner.color} name={owner.name} />
      <View style={{ gap: 20, paddingVertical: 8 }}>
        <DetailRow icon="calendar-days" label={t("日期")}>
          {event.date}
        </DetailRow>
        <DetailRow icon="clock" label={t("時間")}>
          {`${event.time || t("全天")}${event.endTime ? ` - ${event.endTime}` : ""}`}
        </DetailRow>
        {event.location ? (
          <DetailRow icon="map-pin" label={t("地點")}>
            {t(event.location)}
          </DetailRow>
        ) : null}
        {event.note ? <DetailRow label={t("備註")}>{event.note}</DetailRow> : null}
        <DetailRow label={t("狀態")}>{`${event.done ? t("已完成") : t("未完成")}${event.source === "voice" ? t(" · 語音錄入") : ""}`}</DetailRow>
      </View>
      <DialogActions>
        <Button variant="danger" icon="trash-2" label={t("刪除")} onPress={() => openDeleteConfirm(id)} />
        <Button variant="primary" icon="pencil" label={t("編輯行程")} onPress={() => openEventForm(event)} />
      </DialogActions>
    </View>
  );
}

/** cal-detail */
export function openEventDetail(id: string) {
  const event = useDeviceStore.getState().events.find((item) => item.id === id);
  if (!event) {
    toast(translate("此行程已不存在"));
    return;
  }
  dialog.show({ title: translate(event.title), body: () => <EventDetail id={id} /> });
}

function DeleteConfirm({ id }: { id: string }) {
  const { t } = useI18n();
  const event = useDeviceStore((s) => s.events.find((item) => item.id === id));
  const members = useDeviceStore((s) => s.members);
  if (!event) return <Txt muted>{t("此行程已不存在")}</Txt>;
  return (
    <View style={{ gap: 8 }}>
      <Txt variant="h3" color="#3e5145">
        {t(event.title)}
      </Txt>
      <Txt variant="body" muted>
        {event.date} · {memberById(event.memberId, members).name}
      </Txt>
      <DialogActions>
        <Button variant="ghost" label={t("保留行程")} onPress={() => openEventDetail(id)} />
        <Button variant="danger" icon="trash-2" label={t("刪除行程")} onPress={() => deleteEvent(id)} />
      </DialogActions>
    </View>
  );
}

/** cal-delete */
export function openDeleteConfirm(id: string) {
  if (!useDeviceStore.getState().events.some((item) => item.id === id)) return;
  dialog.show({ title: translate("刪除這條行程？"), body: () => <DeleteConfirm id={id} /> });
}

/* ───────── jump to date ───────── */

function JumpForm() {
  const { t } = useI18n();
  const current = useDeviceStore((s) => s.calendar.date);
  const [value, setValue] = useState(current);
  const [error, setError] = useState("");
  const submit = () => {
    const message = jumpTo(value.trim());
    if (message) setError(message);
  };
  return (
    <View style={{ gap: 15 }}>
      <TextField label={t("選擇日期")} value={value} onChangeText={setValue} placeholder="YYYY-MM-DD" maxLength={10} autoFocus autoCapitalize="none" onSubmitEditing={submit} />
      <FormError message={error} />
      <DialogActions>
        <Button variant="ghost" label={t("取消")} onPress={() => dialog.close()} />
        <Button variant="primary" label={t("前往")} onPress={submit} />
      </DialogActions>
    </View>
  );
}

/** cal-jump */
export function openJump() {
  dialog.show({ title: translate("跳轉日期"), body: () => <JumpForm key={Date.now()} /> });
}

/* ───────── family sync (local demo) ───────── */

function SyncDialog() {
  const { t } = useI18n();
  const count = useDeviceStore((s) => s.events.length);
  const [before, strong = "", after = ""] = t("本機共有 <strong>{n}</strong> 個家庭行程", { n: count }).split(/<\/?strong>/);
  return (
    <View style={{ gap: 12 }}>
      <Badge>{t("本地演示")}</Badge>
      <Txt variant="h3" weight="400" color="#43584b" style={{ marginTop: 12 }}>
        {before}
        <Txt variant="h3" weight="700" color="#43584b">
          {strong}
        </Txt>
        {after}
      </Txt>
      <Txt variant="body" muted style={{ marginBottom: 14 }}>
        {t("尚未連接家庭同步服務，本次確認僅儲存本機資料。")}
      </Txt>
      <DialogActions>
        <Button variant="ghost" label={t("取消")} onPress={() => dialog.close()} />
        <Button
          variant="primary"
          icon="check"
          label={t("確認本機資料")}
          onPress={() => {
            dialog.close();
            toast(t("已確認本次頁面行程，未傳送至伺服器"));
          }}
        />
      </DialogActions>
    </View>
  );
}

/** cal-sync */
export function openSync() {
  dialog.show({ title: translate("家庭同步"), body: () => <SyncDialog /> });
}

/* ───────── voice flow: 1 pick a person → 2 transcript → 3 confirm (the event form) ───────── */

function VoiceMemberPicker() {
  const { t } = useI18n();
  const members = useDeviceStore((s) => s.members);
  return (
    <View style={{ gap: 18 }}>
      <VoiceContext step="1 / 3" />
      <View>
        {members.map((person) => (
          <Pressable
            key={person.id}
            accessibilityRole="button"
            accessibilityLabel={person.name}
            onPress={() => {
              useCalendarUi.getState().setVoiceDraft({ memberId: person.id, transcript: "" });
              openVoiceInput();
            }}
            style={({ pressed }) => ({ flexDirection: "row", alignItems: "center", gap: 16, minHeight: 72, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: "#e5ebe6", backgroundColor: pressed ? "#f6f9f6" : "transparent" })}>
            <View style={{ width: 44, height: 44, borderRadius: 22, borderWidth: 2, borderColor: tint(person.color, 0.5), backgroundColor: tint(person.color, 0.1), alignItems: "center", justifyContent: "center" }}>
              <Txt variant="card" weight="600" color={person.color}>
                {memberInitial(person)}
              </Txt>
            </View>
            <Txt variant="h3" weight="500" color="#415848" style={{ flex: 1 }}>
              {person.name}
            </Txt>
            <Icon name="chevron-right" size={20} color="#8e9a91" />
          </Pressable>
        ))}
      </View>
    </View>
  );
}

/** cal-voice */
export function openVoiceMember() {
  useCalendarUi.getState().setVoiceDraft({ memberId: "", transcript: "" });
  dialog.show({ title: translate("為誰添加行程？"), body: () => <VoiceMemberPicker /> });
}

function VoiceInputForm() {
  const { t } = useI18n();
  const members = useDeviceStore((s) => s.members);
  const draft = useCalendarUi((s) => s.voiceDraft);
  const [transcript, setTranscript] = useState(draft?.transcript || "");
  const [error, setError] = useState("");
  const person = memberById(draft?.memberId, members);
  const fillExample = () => {
    const example = t("{name} 今天 16:30 帶孩子去籃球訓練", { name: person.name });
    setTranscript(example);
    setError("");
    useCalendarUi.getState().setVoiceDraft({ memberId: person.id, transcript: example });
  };
  const review = () => {
    const text = transcript.trim();
    if (!text) {
      setError(t("請輸入語音轉寫內容。"));
      return;
    }
    useCalendarUi.getState().setVoiceDraft({ memberId: person.id, transcript: text });
    openEventForm(parseVoice(text, person), true);
  };
  return (
    <View style={{ gap: 15 }}>
      <VoiceContext step="2 / 3" />
      <Pressable accessibilityRole="button" accessibilityLabel={person.name} onPress={openVoiceMember} style={{ flexDirection: "row", alignItems: "center", gap: 8, alignSelf: "flex-start", minHeight: 44, paddingHorizontal: 14, borderRadius: radius.pill, backgroundColor: shell.surfaceMuted }}>
        <Icon name="user" size={18} color={shell.ink} />
        <Txt variant="control" weight="500">
          {person.name}
        </Txt>
        <Icon name="chevron-left" size={18} color={shell.muted} />
      </Pressable>
      <TextField label={t("語音轉寫內容")} value={transcript} onChangeText={setTranscript} placeholder={t("例如：今天 16:30 帶孩子去籃球訓練")} maxLength={300} multiline autoFocus />
      <Txt variant="body" muted style={{ marginTop: -6 }}>
        {t("本地演示，尚未連接語音服務。")}
      </Txt>
      <FormError message={error} />
      <DialogActions>
        <Button variant="ghost" label={t("填入範例")} onPress={fillExample} />
        <Button variant="primary" icon="arrow-right" label={t("核對行程")} onPress={review} />
      </DialogActions>
    </View>
  );
}

/** cal-voice-input (also the "返回修改" target from the confirm step) */
export function openVoiceInput() {
  if (!useCalendarUi.getState().voiceDraft?.memberId) {
    openVoiceMember();
    return;
  }
  dialog.show({ title: translate("錄入人物行程"), body: () => <VoiceInputForm key={Date.now()} /> });
}
