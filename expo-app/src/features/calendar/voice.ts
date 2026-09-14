/* Local transcript parser for the voice demo (port of parseVoice in prototype/device/calendar.js).
 * Only a date, a clock time and relative-day words are recognised; the person always stays the one
 * chosen in step 1 — names inside the transcript never change the owner. */
import { addDays, dateKey, fromKey, today } from "@/lib/date";
import type { EventDraft } from "./helpers";

const dayAfterWords = /后天|後天|day after tomorrow|übermorgen|pasado mañana/i;
const tomorrowWords = /明天|tomorrow|morgen|mañana/i;
const relativeWords = /後天|后天|今天|明天|day after tomorrow|tomorrow|today|übermorgen|morgen|heute|pasado mañana|mañana|hoy/gi;
const clockRe = /(?:^|\s)(?:(?:a las?|um|at|alle)\s+)?([01]?\d|2[0-3]):([0-5]\d)(?=\s|$)/i;

export type VoiceDraftEvent = EventDraft & { title: string; date: string; time: string; needsTime: boolean; memberId: string; note: string; source: "voice" };

export function parseVoice(transcript: string, member: { id: string; name: string }): VoiceDraftEvent {
  const dateMatch = transcript.match(/\b(\d{4}-\d{2}-\d{2})\b/);
  let date = dateMatch ? (fromKey(dateMatch[1]) ? dateMatch[1] : "") : dateKey(today);
  if (!dateMatch && dayAfterWords.test(transcript)) date = dateKey(addDays(today, 2));
  else if (!dateMatch && tomorrowWords.test(transcript)) date = dateKey(addDays(today, 1));
  const clock = transcript.match(clockRe);
  const time = clock ? `${clock[1].padStart(2, "0")}:${clock[2]}` : "";
  let title = transcript
    .replace(dateMatch?.[0] || /$^/, "")
    .replace(clock?.[0] || /$^/, "")
    .replace(relativeWords, "")
    .replace(/\s{2,}/g, " ")
    .trim();
  if (title.startsWith(member.name)) title = title.slice(member.name.length).trim();
  return { title: title || transcript, date, time, needsTime: !time, memberId: member.id, note: "", source: "voice" };
}
