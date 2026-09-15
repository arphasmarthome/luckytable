/* Summary: every finished cooking session grouped by day; each dish carries the family's own photos. */
import { View } from "react-native";
import { EmptyNote, Page } from "@/components/ui";
import { make } from "@/theme";
import { CookSummary } from "@/features/make/components/CookSummary";
import { MakeHeader } from "@/features/make/components/MakeHeader";
import { MCard, MTxt } from "@/features/make/components/ui";
import { useMakeStore, type CookRecord } from "@/features/make/store";
import { useMakeStrings } from "@/features/make/strings";

function dayLabel(key: string, lang: string) {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1).toLocaleDateString(lang === "zh" ? "zh-TW" : "en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
}

export default function SummaryScreen() {
  const { t, lang } = useMakeStrings();
  const history = useMakeStore((s) => s.history);
  const days = new Map<string, CookRecord[]>();
  history.forEach((r) => days.set(r.date, (days.get(r.date) || []).concat(r)));

  return (
    <Page background={make.background} gap={12}>
      <MakeHeader title={t.titles.summary} />
      {history.length ? (
        [...days.entries()].map(([date, records]) => {
          const dishCount = records.reduce((a, r) => a + r.dishIds.length, 0);
          return (
            <MCard key={date} gap={12}>
              <View>
                <MTxt variant="h3" weight="700">
                  {dayLabel(date, lang)}
                </MTxt>
                <MTxt variant="meta" muted>
                  {dishCount} {dishCount === 1 ? t.dishCooked : t.dishesCooked}
                </MTxt>
              </View>
              {records.map((r) => (
                <View key={r.id} style={{ paddingTop: 10, borderTopWidth: 1, borderTopColor: make.border }}>
                  <CookSummary record={r} compact />
                </View>
              ))}
            </MCard>
          );
        })
      ) : (
        <MCard>
          <EmptyNote>{t.noHistory}</EmptyNote>
        </MCard>
      )}
    </Page>
  );
}
