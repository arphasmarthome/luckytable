/* Settings → 家庭 (prototype householdMarkup / householdClick / householdSubmit):
 * member list (name + role) in the middle, the selected member's will-cook days, profile and 全家的共同點 on the right. */
import { useState } from "react";
import { Pressable, View } from "react-native";
import { Avatar, Button, Chip, Segmented, TextField, Txt } from "@/components/ui";
import { useBreakpoint } from "@/hooks/use-breakpoint";
import { useI18n } from "@/i18n";
import { HOUSEHOLD_SUGGEST, householdCookLabel, useDeviceStore, type Member, type Prefs } from "@/store/device";
import { toast } from "@/store/toast";
import { openHealthForm } from "@/features/health/dialogs";
import { activityLabel, goalNames } from "@/features/health/estimate";
import { radius, shell } from "@/theme";
import { SectionHeader } from "./SettingsRow";

type PrefField = keyof Omit<Prefs, "cook">;
const FIELDS: PrefField[] = ["likes", "dislikes", "allergies"];
const FIELD_LABEL: Record<PrefField, string> = { likes: "喜歡", dislikes: "不喜歡", allergies: "過敏" };
const DAYS = [0, 1, 2, 3, 4, 5, 6];

function Kicker({ children }: { children: string }) {
  return (
    <Txt variant="caption" weight="600" muted style={{ letterSpacing: 1, textTransform: "uppercase" }}>
      {children}
    </Txt>
  );
}

/* Removable preference chip (.hh-chip). The kit's Chip drops its row layout when it has no onPress, so it is local. */
function PrefChip({ label, onRemove, removeLabel }: { label: string; onRemove: () => void; removeLabel: string }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 4, paddingLeft: 14, paddingRight: 6, paddingVertical: 4, borderRadius: radius.pill, backgroundColor: shell.surfaceMuted }}>
      <Txt variant="meta">{label}</Txt>
      <Pressable accessibilityRole="button" accessibilityLabel={removeLabel} hitSlop={6} onPress={onRemove} style={({ pressed }) => ({ width: 30, height: 30, borderRadius: 15, alignItems: "center", justifyContent: "center", backgroundColor: pressed ? "#fff3f2" : "transparent" })}>
        <Txt variant="body" color={shell.muted}>
          ×
        </Txt>
      </Pressable>
    </View>
  );
}

function Panel({ children, selected, dashed, compact }: { children: React.ReactNode; selected?: boolean; dashed?: boolean; compact?: boolean }) {
  return (
    <View style={{ position: "relative", padding: compact ? 12 : 16, gap: compact ? 8 : 12, minWidth: 0, borderWidth: selected ? 2 : 1, borderStyle: dashed ? "dashed" : "solid", borderColor: selected ? shell.green : shell.line, borderRadius: radius.md, backgroundColor: selected ? "#f6faf7" : shell.surface }}>
      {children}
    </View>
  );
}

function MemberCard({ member, selected }: { member: Member; selected: boolean }) {
  const { t } = useI18n();
  const canRemove = useDeviceStore((s) => s.members.length > 1);
  const setHousehold = useDeviceStore((s) => s.setHousehold);
  const removeMember = useDeviceStore((s) => s.removeMember);
  return (
    <Panel selected={selected} compact>
      <Pressable accessibilityRole="button" accessibilityState={{ selected }} onPress={() => setHousehold({ selected: member.id })} style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingRight: 36 }}>
        <Avatar color={member.color} initials={member.initials || member.name.slice(0, 1)} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Txt variant="card" weight="600" numberOfLines={1}>
            {member.name}
          </Txt>
          <Txt variant="meta" muted numberOfLines={1}>
            {t(member.role)}
          </Txt>
        </View>
      </Pressable>
      {canRemove ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("移除 {name}", { name: member.name })}
          onPress={() => {
            removeMember(member.id);
            toast(t("已移除 {name}", { name: member.name }));
          }}
          style={({ pressed }) => ({ position: "absolute", top: 8, right: 8, width: 36, height: 36, borderRadius: radius.sm, alignItems: "center", justifyContent: "center", backgroundColor: pressed ? "#fff3f2" : "transparent" })}>
          <Txt variant="h3" color={shell.muted}>
            ×
          </Txt>
        </Pressable>
      ) : null}
    </Panel>
  );
}

function CookDays({ member, cookCount }: { member: Member; cookCount: (day: number) => number }) {
  const { t, isZh, weekday } = useI18n();
  const toggleCookDay = useDeviceStore((s) => s.toggleCookDay);
  const dayLabel = (i: number) => weekday((i + 1) % 7, "short").slice(0, isZh ? 1 : 2);
  return (
    <View style={{ gap: 8 }}>
      <Kicker>{t("本週掌廚")}</Kicker>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
        {DAYS.map((i) => {
          const on = Boolean(member.prefs.cook[i]);
          const shared = on && cookCount(i) > 1;
          return (
            <Pressable
              key={i}
              accessibilityRole="button"
              accessibilityLabel={weekday((i + 1) % 7)}
              accessibilityState={{ selected: on }}
              onPress={() => toggleCookDay(member.id, i)}
              style={{ width: 42, height: 44, borderRadius: radius.sm, alignItems: "center", justifyContent: "center", borderWidth: shared ? 2 : 1, borderColor: shared ? shell.coral : on ? shell.green : shell.line, backgroundColor: on ? shell.green : "#fff" }}>
              <Txt variant="meta" weight="600" color={on ? "#fff" : shell.muted}>
                {dayLabel(i)}
              </Txt>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function AddMemberCard() {
  const { t } = useI18n();
  const addMember = useDeviceStore((s) => s.addMember);
  const [name, setName] = useState("");
  const submit = () => {
    const value = name.trim();
    if (!value) return;
    addMember(value);
    setName("");
    toast(t("已新增 {name}", { name: value }));
  };
  return (
    <Panel dashed>
      <Kicker>{t("新增成員")}</Kicker>
      <TextField value={name} onChangeText={setName} maxLength={20} autoComplete="off" placeholder={t("姓名…")} accessibilityLabel={t("新增成員")} onSubmitEditing={submit} />
      <Button variant="primary" icon="plus" label={t("新增")} disabled={!name.trim()} onPress={submit} block />
    </Panel>
  );
}

function HealthBasics({ member }: { member: Member }) {
  const { t } = useI18n();
  const h = member.health;
  const filled = Boolean(h && h.height && h.weight);
  const cell = (label: string, value: string) => (
    <View key={label} style={{ minWidth: 96, flexGrow: 1, gap: 2 }}>
      <Txt variant="caption" muted>
        {label}
      </Txt>
      <Txt variant="body" weight="600">
        {value}
      </Txt>
    </View>
  );
  return (
    <View style={{ gap: 8, paddingTop: 12, borderTopWidth: 1, borderTopColor: shell.line }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        <Kicker>{t("基本資料")}</Kicker>
        <Button size="sm" variant="primary" icon="pencil" label={filled ? t("編輯資料") : t("新增資料")} onPress={() => openHealthForm(member.id)} style={{ marginLeft: "auto" }} />
      </View>
      {filled && h ? (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
          {cell(t("身高"), `${h.height} cm`)}
          {cell(t("體重"), `${h.weight} kg`)}
          {cell(t("年齡"), `${h.age} ${t("歲")}`)}
          {cell(t("性別"), h.sex === "female" ? t("女性") : t("男性"))}
          {cell(t("健康目標"), h.age < 18 ? t("成長記錄") : t(goalNames[h.goal] || goalNames.maintain))}
          {cell(t("活動程度"), t(activityLabel(h.activity)))}
        </View>
      ) : (
        <Txt variant="meta" muted>
          {t("目前沒有紀錄")}
        </Txt>
      )}
    </View>
  );
}

function Profile({ member, cookCount, together }: { member: Member; cookCount: (day: number) => number; together: string[] }) {
  const { t } = useI18n();
  const field = useDeviceStore((s) => s.household.field);
  const setHousehold = useDeviceStore((s) => s.setHousehold);
  const addPref = useDeviceStore((s) => s.addPref);
  const removePref = useDeviceStore((s) => s.removePref);
  const [value, setValue] = useState("");
  const submit = () => {
    const v = value.trim();
    if (!v) return;
    addPref(member.id, field, v);
    setValue("");
  };
  const suggestions = HOUSEHOLD_SUGGEST[field].filter((v) => !member.prefs[field].includes(v));
  return (
    <View style={{ padding: 18, gap: 14, borderWidth: 1, borderColor: shell.line, borderRadius: radius.md, backgroundColor: shell.surface }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
        <Avatar color={member.color} initials={member.initials || member.name.slice(0, 1)} size={52} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Txt variant="h2">{member.name}</Txt>
          <Txt variant="meta" muted>
            {`${t(member.role)} · ${householdCookLabel(member)}`}
          </Txt>
        </View>
      </View>
      <CookDays member={member} cookCount={cookCount} />
      <HealthBasics member={member} />
      {together.length ? (
        <View style={{ padding: 12, paddingHorizontal: 14, borderRadius: radius.md, backgroundColor: shell.greenSoft, gap: 2 }}>
          <Txt variant="meta" weight="600" color={shell.green}>
            {t("一起下廚")}
          </Txt>
          <Txt variant="meta" color={shell.green}>
            {together.join(" · ")}
          </Txt>
        </View>
      ) : null}
      {FIELDS.map((f) => (
        <View key={f} style={{ gap: 8 }}>
          <Kicker>{t(FIELD_LABEL[f])}</Kicker>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {member.prefs[f].length ? (
              member.prefs[f].map((v, ix) => <PrefChip key={`${v}-${ix}`} label={t(v)} removeLabel={`${t("移除")} ${t(v)}`} onRemove={() => removePref(member.id, f, ix)} />)
            ) : (
              <Txt variant="meta" muted>
                {t("目前沒有紀錄")}
              </Txt>
            )}
          </View>
        </View>
      ))}
      <View style={{ gap: 10 }}>
        <Segmented<PrefField> size="sm" value={field} options={FIELDS.map((f) => ({ value: f, label: t(FIELD_LABEL[f]) }))} onChange={(next) => setHousehold({ field: next })} />
        <View style={{ flexDirection: "row", gap: 10, alignItems: "center" }}>
          <TextField style={{ flex: 1, minWidth: 0 }} value={value} onChangeText={setValue} maxLength={20} autoComplete="off" placeholder={t("自行輸入…")} accessibilityLabel={t(FIELD_LABEL[field])} onSubmitEditing={submit} />
          <Button icon="plus" label={t("新增")} disabled={!value.trim()} onPress={submit} />
        </View>
      </View>
      {suggestions.length ? (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {suggestions.map((v) => (
            <Chip key={v} label={`+ ${t(v)}`} onPress={() => addPref(member.id, field, v)} />
          ))}
        </View>
      ) : null}
    </View>
  );
}

type Tally = { value: string; who: string[] };

function SharedBlock({ title, rows }: { title: string; rows: Tally[] }) {
  const { t, list } = useI18n();
  return (
    <View style={{ gap: 8 }}>
      <Kicker>{t(title)}</Kicker>
      {rows.length ? (
        rows.map((r) => (
          <View key={r.value} style={{ flexDirection: "row", justifyContent: "space-between", gap: 12, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: shell.line }}>
            <Txt variant="body" weight="600" style={{ flexShrink: 1 }}>
              {t(r.value)}
            </Txt>
            <Txt variant="meta" muted align="right" style={{ flexShrink: 1 }}>
              {list(r.who)}
            </Txt>
          </View>
        ))
      ) : (
        <Txt variant="meta" muted>
          {t("目前沒有紀錄")}
        </Txt>
      )}
    </View>
  );
}

export function HouseholdSection() {
  const { t, list, weekday } = useI18n();
  const { isDesktop } = useBreakpoint();
  const members = useDeviceStore((s) => s.members);
  const selectedId = useDeviceStore((s) => s.household.selected);
  const sel = members.find((m) => m.id === selectedId) || members[0];
  const cookCount = (i: number) => members.filter((m) => m.prefs.cook[i]).length;
  const together = DAYS.filter((i) => cookCount(i) > 1).map((i) => `${weekday((i + 1) % 7)} — ${list(members.filter((m) => m.prefs.cook[i]).map((m) => m.name))}`);
  const tally = (field: PrefField): Tally[] => {
    const seen: Record<string, string[]> = {};
    members.forEach((m) => m.prefs[field].forEach((v) => (seen[v] = seen[v] || []).push(m.name)));
    return Object.entries(seen).map(([value, who]) => ({ value, who }));
  };
  const shared = (field: PrefField) => tally(field).filter((x) => x.who.length > 1).sort((a, b) => b.who.length - a.who.length);
  const allergies = tally("allergies");
  const firstAllergy = allergies[0];

  const left = (
    <View style={{ flex: isDesktop ? 0.7 : undefined, minWidth: 0, gap: 10 }}>
      {members.map((m) => (
        <MemberCard key={m.id} member={m} selected={Boolean(sel && sel.id === m.id)} />
      ))}
      <AddMemberCard />
    </View>
  );
  const right = (
    <View style={{ flex: isDesktop ? 1.3 : undefined, minWidth: 0, gap: 14 }}>
      {sel ? <Profile member={sel} cookCount={cookCount} together={together} /> : null}
      <View style={{ padding: 18, gap: 14, borderWidth: 1, borderColor: shell.line, borderRadius: radius.md, backgroundColor: shell.surface }}>
        <Txt variant="h2">{t("全家的共同點")}</Txt>
        <SharedBlock title="多人都喜歡" rows={shared("likes")} />
        <SharedBlock title="多人都不喜歡" rows={shared("dislikes")} />
        <SharedBlock title="家中的過敏原" rows={allergies} />
        {firstAllergy ? (
          <View style={{ padding: 14, paddingHorizontal: 16, borderRadius: radius.md, backgroundColor: "#fbf0df", gap: 4 }}>
            <Txt variant="body" weight="600" color="#946126">
              {t("過敏優先")}
            </Txt>
            <Txt variant="body" color="#946126">
              {t("只要 {name} 在餐桌上，所有建議都不會出現{allergy}。", { name: firstAllergy.who[0], allergy: t(firstAllergy.value) })}
            </Txt>
          </View>
        ) : null}
      </View>
    </View>
  );
  return (
    <View>
      <SectionHeader title={t("家庭")} hint={t("餐桌上的家人")} />
      {isDesktop ? (
        <View style={{ flexDirection: "row", gap: 20, alignItems: "flex-start" }}>
          {left}
          {right}
        </View>
      ) : (
        <View style={{ gap: 18 }}>
          {left}
          {right}
        </View>
      )}
    </View>
  );
}
