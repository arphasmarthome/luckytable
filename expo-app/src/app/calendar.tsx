import { useLocalSearchParams } from "expo-router";
import { CalendarScreen, type CalendarParams } from "@/features/calendar/CalendarScreen";

const one = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

export default function CalendarRoute() {
  const raw = useLocalSearchParams<{ date?: string; view?: string; member?: string; action?: string; eventId?: string }>();
  const params: CalendarParams = { date: one(raw.date), view: one(raw.view), member: one(raw.member), action: one(raw.action), eventId: one(raw.eventId) };
  return <CalendarScreen params={params} />;
}
