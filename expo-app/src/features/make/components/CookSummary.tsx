/* One finished cooking session: each dish with its picture, the family's own photos of it (plus an
 * upload tile), and the start / pause / resume timeline. */
import { Image } from "expo-image";
import { Pressable, View } from "react-native";
import { Icon } from "@/components/ui";
import { useBreakpoint } from "@/hooks/use-breakpoint";
import { toast } from "@/store/toast";
import { make, radius } from "@/theme";
import { dishById, dishImg } from "../data";
import { pickImage } from "../photos";
import { timelineSegments, useMakeStore, type CookRecord } from "../store";
import { useMakeStrings, type Lang } from "../strings";
import { Kicker, MTxt } from "./ui";

export const timeOfDay = (ms: number, lang: Lang) => new Date(ms).toLocaleTimeString(lang === "zh" ? "zh-TW" : "en-US", { hour: "numeric", minute: "2-digit" });

export function CookSummary({ record, compact }: { record: CookRecord; compact?: boolean }) {
  const { t, lang, dishName } = useMakeStrings();
  const { isPhone } = useBreakpoint();
  const addHistoryPhoto = useMakeStore((s) => s.addHistoryPhoto);
  const segments = timelineSegments(record.timeline, record.finishedAt);
  const size = compact ? 88 : isPhone ? 104 : 128;
  const rows: string[] = [];
  segments.forEach((seg, i) => {
    if (i > 0) rows.push(t.pausedLabel);
    rows.push(`${i === 0 ? t.startedAt : t.resumedLabel} ${timeOfDay(seg.from, lang)} – ${timeOfDay(seg.to, lang)}`);
  });
  const upload = async (dishId: string) => {
    const uri = await pickImage();
    if (!uri) return toast(t.uploadFail);
    addHistoryPhoto(record.id, dishId, uri);
  };
  const tile = { width: size, height: size, borderRadius: radius.lg, overflow: "hidden" as const, backgroundColor: make.surface2 };
  return (
    <View style={{ gap: compact ? 10 : 16 }}>
      {record.dishIds.map((id) => (
        <View key={id} style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "flex-start", gap: compact ? 8 : 12 }}>
          <View style={{ width: size, gap: 6 }}>
            <View style={tile}>
              <Image source={{ uri: dishImg(id) }} contentFit="cover" style={{ width: "100%", height: "100%" }} accessibilityLabel="" />
              <View style={{ position: "absolute", right: 6, top: 6, width: 24, height: 24, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: make.green }}>
                <Icon name="check" size={14} color="#fff" strokeWidth={3} />
              </View>
            </View>
            <MTxt variant={compact ? "caption" : "meta"} weight="600" numberOfLines={2}>
              {dishName(dishById(id))}
            </MTxt>
          </View>
          {(record.photos[id] || []).map((uri, i) => (
            <Image key={i} source={{ uri }} contentFit="cover" style={tile} accessibilityLabel="" />
          ))}
          <Pressable accessibilityRole="button" accessibilityLabel={`${t.addPhotos} · ${dishName(dishById(id))}`} onPress={() => void upload(id)} style={({ pressed }) => [tile, { alignItems: "center", justifyContent: "center", gap: 4, borderWidth: 2, borderStyle: "dashed", borderColor: pressed ? make.primary : make.borderStrong, backgroundColor: pressed ? make.primarySoft : make.surface }]}>
            <Icon name="plus" size={compact ? 22 : 26} color={make.primary} strokeWidth={2.4} />
            <MTxt variant="caption" weight="600" color={make.primaryPressed} align="center">
              {t.addPhotos}
            </MTxt>
          </Pressable>
        </View>
      ))}
      <View style={{ gap: 6 }}>
        <Kicker>{t.totalTime}</Kicker>
        <MTxt variant={compact ? "section" : "h1"} weight="700" color={make.green} style={{ fontVariant: ["tabular-nums"] }}>
          {Math.max(1, Math.round(record.totalSeconds / 60))} {t.minShort}
        </MTxt>
        {rows.length ? (
          rows.map((row, i) => (
            <MTxt key={i} variant={compact ? "caption" : "meta"} muted={row === t.pausedLabel} weight={row === t.pausedLabel ? "400" : "500"}>
              {row === t.pausedLabel ? `· ${row}` : row}
            </MTxt>
          ))
        ) : (
          <MTxt variant="caption" muted>
            {`${t.startedAt} ${timeOfDay(record.startedAt, lang)} – ${timeOfDay(record.finishedAt, lang)}`}
          </MTxt>
        )}
      </View>
    </View>
  );
}
