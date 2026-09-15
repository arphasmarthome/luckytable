/* Cross-module summary of the Make module for the Home screen — the prototype's device-bridge
 * `snapshot` payload (tonightDetail, votes, cart, readiness, cooking) computed from useMakeStore. */
import { useMemo } from "react";
import { useI18n } from "@/i18n";
import { langOf } from "./strings";
import { allTonightReady, tonightDetail, useMakeStore, voteRows } from "./store";

export type TonightDish = { id: string; name: string; img: string; minutes: number; ready: boolean; missing: number; cooked: boolean };
export type VoteRow = { id: string; label: string; n: number };
export type MakeSummary = { tonight: TonightDish[]; votes: VoteRow[]; cartCount: number; allReady: boolean; cooking: boolean };

export function useMakeSummary(): MakeSummary {
  const { locale } = useI18n();
  const lang = langOf(locale);
  const tonight = useMakeStore((s) => s.tonight);
  const cook = useMakeStore((s) => s.cook);
  const stock = useMakeStore((s) => s.stock);
  const acquired = useMakeStore((s) => s.acquired);
  const recipes = useMakeStore((s) => s.recipes);
  const votes = useMakeStore((s) => s.votes);
  const myVotes = useMakeStore((s) => s.myVotes);
  const cartCount = useMakeStore((s) => s.cart.length);
  const history = useMakeStore((s) => s.history);
  return useMemo(() => {
    const slice = { tonight, cook, stock, acquired, recipes, history };
    return {
      tonight: tonightDetail(slice, lang),
      votes: voteRows({ votes, myVotes }, lang),
      cartCount,
      allReady: tonight.length > 0 && allTonightReady(slice),
      cooking: Boolean(cook),
    };
  }, [lang, tonight, cook, stock, acquired, recipes, history, votes, myVotes, cartCount]);
}
