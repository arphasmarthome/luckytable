/* 飲食資訊 tab (renderDiet): allergies and preferences with links to recipes and the member's schedule. */
import { useRouter } from "expo-router";
import { View } from "react-native";
import { Button, Icon, Txt } from "@/components/ui";
import { useBreakpoint } from "@/hooks/use-breakpoint";
import { useI18n } from "@/i18n";
import type { Member } from "@/store/device";
import { openDietForm } from "./dialogs";
import { fh } from "./shared";

export function scheduleHref(memberId: string) {
  return `/calendar?member=${encodeURIComponent(memberId)}&view=day`;
}

function Row({ icon, label, value }: { icon: string; label: string; value: string }) {
  const { isPhone } = useBreakpoint();
  return (
    <View style={{ flexDirection: isPhone ? "column" : "row", gap: isPhone ? 6 : 24, paddingVertical: 20, borderBottomWidth: 1, borderBottomColor: fh.line }}>
      <View style={{ width: isPhone ? undefined : 200, flexDirection: "row", alignItems: "center", gap: 10 }}>
        <Icon name={icon} size={20} color="#aa914f" />
        <Txt color="#6b8170">{label}</Txt>
      </View>
      <Txt variant="card" style={{ flex: 1, minWidth: 0 }}>
        {value}
      </Txt>
    </View>
  );
}

export function DietView({ person }: { person: Member }) {
  const { t } = useI18n();
  const router = useRouter();
  return (
    <View style={{ gap: 8 }}>
      <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 12 }}>
        <Txt variant="h2" style={{ flexGrow: 1 }}>
          {t("{name} 的飲食資訊", { name: person.name })}
        </Txt>
        <Button variant="text" icon="pencil" label={t("編輯")} onPress={() => openDietForm(person.id)} />
      </View>
      <View style={{ maxWidth: 1000 }}>
        <Row icon="shield-alert" label={t("過敏與忌口")} value={person.allergy ? t(person.allergy) : t("尚未填寫")} />
        <Row icon="utensils" label={t("飲食偏好")} value={person.preference ? t(person.preference) : t("尚未填寫")} />
      </View>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12, marginTop: 20 }}>
        <Button icon="utensils" iconRight="arrow-right" label={t("查看家庭食譜")} onPress={() => router.navigate("/make/recipes" as never)} />
        <Button icon="calendar-days" iconRight="arrow-right" label={t("查看 {name} 的行程", { name: person.name })} onPress={() => router.navigate(scheduleHref(person.id) as never)} />
      </View>
    </View>
  );
}
