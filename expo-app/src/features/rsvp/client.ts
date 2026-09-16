/* Talks to /api/rsvp (see api/rsvp.js). On the Expo dev server the relay runs separately on :8787. */
import { Platform } from "react-native";

export type RsvpMember = { id: string; name: string; color: string; initials: string };
export type RsvpDish = { id: string; name: string; img: string; minutes: number };
export type RsvpSnapshot = { familyName: string; dinnerTime: string; members: RsvpMember[]; tonight: RsvpDish[] };
export type RsvpState = { device: string; snapshot: RsvpSnapshot | null; joining: Record<string, boolean>; replyAt: Record<string, number>; source: Record<string, "phone" | "device">; updatedAt: number };

export function rsvpApiUrl() {
  const override = process.env.EXPO_PUBLIC_RSVP_API;
  if (override) return override;
  if (Platform.OS === "web" && typeof location !== "undefined") {
    if (__DEV__ && location.port === "8081") return "http://localhost:8787/api/rsvp";
    return `${location.origin}/api/rsvp`;
  }
  return "";
}

/** Link a phone opens to answer for tonight — the device id keeps families apart on the relay. */
export function phoneLink(deviceId: string) {
  const origin = Platform.OS === "web" && typeof location !== "undefined" ? location.origin : "https://luckytable.vercel.app";
  return `${origin}/phone?device=${encodeURIComponent(deviceId)}`;
}

async function request(input: string, init?: RequestInit): Promise<RsvpState | null> {
  const url = rsvpApiUrl();
  if (!url) return null;
  try {
    const res = await fetch(input.startsWith("http") ? input : url + input, { ...init, headers: { "Content-Type": "application/json", ...(init?.headers || {}) } });
    if (!res.ok) return null;
    return (await res.json()) as RsvpState;
  } catch {
    return null;
  }
}

export const fetchRsvp = (device: string) => request(`?device=${encodeURIComponent(device)}`);
export const pushSnapshot = (device: string, snapshot: RsvpSnapshot, joining: Record<string, boolean>) => request("", { method: "POST", body: JSON.stringify({ device, kind: "snapshot", snapshot, joining }) });
export const sendReply = (device: string, member: string, joining: boolean, source: "phone" | "device") => request("", { method: "POST", body: JSON.stringify({ device, kind: "reply", member, joining, source }) });
