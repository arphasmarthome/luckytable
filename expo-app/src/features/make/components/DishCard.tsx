/* Dish card (photo with match badge + time badge, name, note) and the responsive dish grid. */
import { Pressable, View } from "react-native";
import { Chip, Icon } from "@/components/ui";
import { make, radius } from "@/theme";
import { CATEGORIES } from "../data";
import type { Decorated } from "../store";
import { useMakeStrings } from "../strings";
import { Grid, MTxt, Photo, useGridCols } from "./ui";

export function DishCard({ d, note, onPress, photoHeight = 200, highlight }: { d: Decorated; note: string; onPress: () => void; photoHeight?: number; highlight?: boolean }) {
  const { t } = useMakeStrings();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={d.label}
      onPress={onPress}
      style={({ pressed }) => ({ borderWidth: 1, borderColor: highlight ? make.green : make.border, borderRadius: radius.lg, backgroundColor: make.surface, overflow: "hidden", opacity: pressed ? 0.85 : 1 })}>
      <Photo uri={d.img} height={photoHeight} round={0}>
        <View style={{ position: "absolute", top: 12, right: 12, paddingHorizontal: 14, paddingVertical: 5, borderRadius: radius.pill, backgroundColor: d.full ? make.green : make.primary }}>
          <MTxt variant="meta" weight="700" color="#fff">
            {d.matchLabel}
          </MTxt>
        </View>
        <View style={{ position: "absolute", left: 12, bottom: 12, flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 5, borderRadius: radius.pill, backgroundColor: "#1f1f1dcc" }}>
          <Icon name="timer" size={15} color="#fff" />
          <MTxt variant="caption" weight="600" color="#fff">
            {d.minutes} {t.minShort}
          </MTxt>
        </View>
      </Photo>
      <View style={{ paddingHorizontal: 18, paddingTop: 14, paddingBottom: 16, gap: 4 }}>
        <MTxt variant="card" weight="600" numberOfLines={2}>
          {d.label}
        </MTxt>
        <MTxt variant="meta" muted numberOfLines={3}>
          {note}
        </MTxt>
      </View>
    </Pressable>
  );
}

export function DishGrid({ dishes, noteOf, onOpen, photoHeight, highlightIds, cols }: { dishes: Decorated[]; noteOf: (d: Decorated) => string; onOpen: (id: string) => void; photoHeight?: number; highlightIds?: string[]; cols?: number }) {
  const auto = useGridCols();
  return (
    <Grid cols={cols ?? auto} gap={12}>
      {dishes.map((d) => (
        <DishCard key={d.id} d={d} note={noteOf(d)} onPress={() => onOpen(d.id)} photoHeight={photoHeight} highlight={highlightIds?.includes(d.id)} />
      ))}
    </Grid>
  );
}

export function FilterChips({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const { t } = useMakeStrings();
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
      {CATEGORIES.map((k) => (
        <Chip key={k} label={t.filters[k] || k} active={value === k} accent={make.primary} onPress={() => onChange(k)} />
      ))}
    </View>
  );
}
