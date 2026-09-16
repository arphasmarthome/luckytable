/* Device side of the phone RSVP: keeps the relay's snapshot of tonight current, mirrors the device's
 * own Yes/No toggles up, and applies replies that came from a phone. Runs only while a phone is linked. */
import { useEffect, useRef } from "react";
import { useMakeSummary } from "@/features/make/summary";
import { t } from "@/i18n";
import { useDeviceStore } from "@/store/device";
import { toast } from "@/store/toast";
import { fetchRsvp, pushSnapshot, sendReply } from "./client";

const POLL_MS = 4000;

export function useRsvpSync() {
  const deviceId = useDeviceStore((s) => s.settings.deviceId);
  const linked = useDeviceStore((s) => s.settings.phones.length > 0);
  const familyName = useDeviceStore((s) => s.settings.familyName);
  const members = useDeviceStore((s) => s.members);
  const dinnerMembers = useDeviceStore((s) => s.dinnerMembers);
  const dinnerTime = useDeviceStore((s) => s.dinner.time);
  const setDinner = useDeviceStore((s) => s.setDinner);
  const { tonight } = useMakeSummary();
  const tonightKey = tonight.map((d) => `${d.id}:${d.name}`).join("|");
  const joiningKey = dinnerMembers.slice().sort().join(",");
  const lastApplied = useRef(0);
  const sessionStart = useRef(Date.now());
  const lastPushedJoining = useRef<string | null>(null);

  // tonight's table → relay (debounced), so the phone page has something to show
  useEffect(() => {
    if (!linked || !deviceId) return;
    const handle = setTimeout(() => {
      const joining = Object.fromEntries(members.map((m) => [m.id, dinnerMembers.includes(m.id)]));
      void pushSnapshot(deviceId, { familyName: t(familyName), dinnerTime, members: members.map((m) => ({ id: m.id, name: m.name, color: m.color, initials: m.initials || m.name.slice(0, 1) })), tonight: tonight.map((d) => ({ id: d.id, name: d.name, img: d.img, minutes: d.minutes })) }, joining);
    }, 600);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [linked, deviceId, familyName, dinnerTime, tonightKey, members.length]);

  // the device's own toggles → relay, one reply per changed member
  useEffect(() => {
    if (!linked || !deviceId) return;
    const prev = lastPushedJoining.current;
    lastPushedJoining.current = joiningKey;
    if (prev === null) return;
    const before = new Set(prev.split(",").filter(Boolean));
    const now = new Set(dinnerMembers);
    members.forEach((m) => {
      if (before.has(m.id) !== now.has(m.id)) void sendReply(deviceId, m.id, now.has(m.id), "device");
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [joiningKey, linked, deviceId]);

  // phone replies → the device
  useEffect(() => {
    if (!linked || !deviceId) return;
    let stopped = false;
    const tick = async () => {
      const state = await fetchRsvp(deviceId);
      if (!state || stopped) return;
      let newest = lastApplied.current;
      Object.entries(state.replyAt).forEach(([id, at]) => {
        if (at <= lastApplied.current) return;
        newest = Math.max(newest, at);
        if (state.source[id] !== "phone") return;
        const member = useDeviceStore.getState().members.find((m) => m.id === id);
        if (!member) return;
        const joining = Boolean(state.joining[id]);
        const already = useDeviceStore.getState().dinnerMembers.includes(id);
        if (already !== joining) {
          lastPushedJoining.current = null; // don't echo a phone reply back as a device reply
          setDinner(id, joining);
          lastPushedJoining.current = useDeviceStore.getState().dinnerMembers.slice().sort().join(",");
        }
        if (at > sessionStart.current) toast(t("{name} 用手機回覆：{answer}", { name: member.name, answer: joining ? t("我會到") : t("今晚不會") }));
      });
      lastApplied.current = newest;
    };
    void tick();
    const handle = setInterval(() => void tick(), POLL_MS);
    return () => {
      stopped = true;
      clearInterval(handle);
    };
  }, [linked, deviceId, setDinner]);
}
