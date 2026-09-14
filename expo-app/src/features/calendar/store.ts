/* Module-local UI state: the day view's list / timeline toggle and the in-progress voice draft.
 * Neither is part of the shared device store (the prototype kept dayMode on calendar state and
 * voiceDraft in a closure); dialogs render outside the screen tree so they read it from here. */
import { create } from "zustand";
import type { DayMode } from "./helpers";

export type VoiceDraft = { memberId: string; transcript: string };

type CalendarUi = {
  dayMode: DayMode;
  voiceDraft: VoiceDraft | null;
  setDayMode: (mode: DayMode) => void;
  setVoiceDraft: (draft: VoiceDraft | null) => void;
};

export const useCalendarUi = create<CalendarUi>((set) => ({
  dayMode: "agenda",
  voiceDraft: null,
  setDayMode: (dayMode) => set({ dayMode }),
  setVoiceDraft: (voiceDraft) => set({ voiceDraft }),
}));
