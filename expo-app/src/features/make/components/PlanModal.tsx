/* "Plan this dish" modal: pick one of the next seven days and a dinner time. Planning it for
 * today also puts the dish on tonight's table. */
import { View } from "react-native";
import { Button, Chip } from "@/components/ui";
import { today } from "@/lib/date";
import { dialog } from "@/store/dialog";
import { toast } from "@/store/toast";
import { make } from "@/theme";
import { DAY_EN, DAY_ZH, PLAN_TIMES, dishById } from "../data";
import { useMakeStore } from "../store";
import { useMakeStrings } from "../strings";
import { Kicker } from "./ui";

function PlanBody() {
  const { t, zh } = useMakeStrings();
  const evDay = useMakeStore((s) => s.evDay);
  const evTime = useMakeStore((s) => s.evTime);
  const setEvDay = useMakeStore((s) => s.setEvDay);
  const setEvTime = useMakeStore((s) => s.setEvTime);
  const days = Array.from({ length: 7 }, (_, i) => {
    const x = new Date(today);
    x.setDate(today.getDate() + i);
    return { i, label: `${zh ? DAY_ZH[x.getDay()] : DAY_EN[x.getDay()]} ${x.getDate()}` };
  });
  return (
    <View style={{ gap: 20 }}>
      <View style={{ gap: 10 }}>
        <Kicker>{t.evDay}</Kicker>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
          {days.map((x) => (
            <Chip key={x.i} label={x.label} active={evDay === x.i} accent={make.primary} onPress={() => setEvDay(x.i)} />
          ))}
        </View>
      </View>
      <View style={{ gap: 10 }}>
        <Kicker>{t.evTime}</Kicker>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
          {PLAN_TIMES.map((x) => (
            <Chip key={x} label={x} active={evTime === x} accent={make.primary} onPress={() => setEvTime(x)} />
          ))}
        </View>
      </View>
    </View>
  );
}

function PlanFooter({ dishId }: { dishId: string }) {
  const { t, zh, dishName } = useMakeStrings();
  const savePlan = useMakeStore((s) => s.savePlan);
  return (
    <>
      <Button size="lg" label={t.cancel} onPress={() => dialog.close()} />
      <Button
        size="lg"
        variant="primary"
        accent={make.primary}
        label={t.save}
        onPress={() => {
          const { day, time } = savePlan(dishId);
          dialog.close();
          toast(`${t.planned} ${dishName(dishById(dishId))} · ${zh ? DAY_ZH[day.getDay()] : DAY_EN[day.getDay()]} ${day.getDate()} ${time}`);
        }}
      />
    </>
  );
}

export function openPlanModal(dishId: string, title: string) {
  useMakeStore.getState().setEvDay(0);
  dialog.show({ title, body: () => <PlanBody />, footer: () => <PlanFooter dishId={dishId} /> });
}
