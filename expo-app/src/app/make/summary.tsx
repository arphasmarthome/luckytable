/* Summary: every finished cooking session grouped by day, with the family's own photos per day. */
import { Image } from "expo-image";
import { Platform, View } from "react-native";
import { Button, EmptyNote, Page } from "@/components/ui";
import { useBreakpoint } from "@/hooks/use-breakpoint";
import { toast } from "@/store/toast";
import { make, radius } from "@/theme";
import { CookSummary } from "@/features/make/components/CookSummary";
import { MakeHeader } from "@/features/make/components/MakeHeader";
import { MCard, MTxt } from "@/features/make/components/ui";
import { useMakeStore, type CookRecord } from "@/features/make/store";
import { useMakeStrings } from "@/features/make/strings";

const MAX_EDGE = 1024;

/** Web only: pick one image and return it as a downscaled JPEG data URI (localStorage-sized). */
function pickImage(): Promise<string | null> {
  if (Platform.OS !== "web" || typeof document === "undefined") return Promise.resolve(null);
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return resolve(null);
      const url = URL.createObjectURL(file);
      const img = new window.Image();
      img.onload = () => {
        const scale = Math.min(1, MAX_EDGE / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext("2d")?.drawImage(img, 0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(url);
        resolve(canvas.toDataURL("image/jpeg", 0.8));
      };
      img.onerror = () => resolve(null);
      img.src = url;
    };
    input.click();
  });
}

function dayLabel(key: string, lang: string) {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1).toLocaleDateString(lang === "zh" ? "zh-TW" : "en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
}

export default function SummaryScreen() {
  const { t, lang } = useMakeStrings();
  const { isPhone } = useBreakpoint();
  const history = useMakeStore((s) => s.history);
  const addHistoryPhoto = useMakeStore((s) => s.addHistoryPhoto);
  const days = new Map<string, CookRecord[]>();
  history.forEach((r) => days.set(r.date, (days.get(r.date) || []).concat(r)));

  const upload = async (record: CookRecord) => {
    const uri = await pickImage();
    if (!uri) return toast(t.uploadFail);
    addHistoryPhoto(record.id, uri);
  };

  return (
    <Page background={make.background} gap={12}>
      <MakeHeader title={t.titles.summary} />
      {history.length ? (
        [...days.entries()].map(([date, records]) => {
          const dishCount = records.reduce((a, r) => a + r.dishIds.length, 0);
          const photos = records.flatMap((r) => r.photos);
          return (
            <MCard key={date} gap={12}>
              <View style={{ flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
                <View style={{ flex: 1, minWidth: 180 }}>
                  <MTxt variant="h3" weight="700">
                    {dayLabel(date, lang)}
                  </MTxt>
                  <MTxt variant="meta" muted>
                    {dishCount} {dishCount === 1 ? t.dishCooked : t.dishesCooked}
                  </MTxt>
                </View>
                <Button icon="upload" label={t.addPhotos} variant="primary" accent={make.primary} onPress={() => void upload(records[0])} />
              </View>
              {records.map((r) => (
                <View key={r.id} style={{ paddingTop: 10, borderTopWidth: 1, borderTopColor: make.border }}>
                  <CookSummary record={r} compact />
                </View>
              ))}
              {photos.length ? (
                <View style={{ gap: 8 }}>
                  <MTxt variant="caption" weight="600" muted style={{ textTransform: "uppercase", letterSpacing: 1 }}>
                    {t.photosLabel}
                  </MTxt>
                  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                    {photos.map((uri, i) => (
                      <Image key={i} source={{ uri }} contentFit="cover" style={{ width: isPhone ? 96 : 140, height: isPhone ? 96 : 140, borderRadius: radius.md, backgroundColor: make.surface2 }} accessibilityLabel="" />
                    ))}
                  </View>
                </View>
              ) : null}
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
