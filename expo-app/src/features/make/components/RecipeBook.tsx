/* The dish's recipe as a book page: photo, ingredients with amounts, numbered steps. */
import { Linking, View } from "react-native";
import { Icon } from "@/components/ui";
import { useBreakpoint } from "@/hooks/use-breakpoint";
import { make, radius } from "@/theme";
import { cookMinutes, dishById, dishImg, fmtMin } from "../data";
import { planFor, planSeconds, useMakeStore, type IngredientRow } from "../store";
import { useMakeStrings } from "../strings";
import { FullSheet } from "./FullSheet";
import { Kicker, MTxt, Photo } from "./ui";

export function RecipeBook({ id, ings, visible, onClose }: { id: string; ings: IngredientRow[]; visible: boolean; onClose: () => void }) {
  const { t, lang, dishName } = useMakeStrings();
  const { isWide } = useBreakpoint();
  const recipes = useMakeStore((s) => s.recipes);
  const d = dishById(id);
  const steps = planFor({ recipes }, id, lang);
  const source = recipes[id]?.source;
  const ingredientsBlock = (
    <View style={{ flex: isWide ? 0.9 : undefined, gap: 8 }}>
      <Kicker>{t.ingredientsTitle}</Kicker>
      {ings.map((i, ix) => (
        <View key={`${i.name}-${ix}`} style={{ flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: make.border }}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: make.primary }} />
          <MTxt style={{ flex: 1 }}>{i.label}</MTxt>
          <MTxt variant="meta" muted>
            {i.amount}
          </MTxt>
        </View>
      ))}
    </View>
  );
  const stepsBlock = (
    <View style={{ flex: isWide ? 1.4 : undefined, gap: 10 }}>
      <Kicker>{t.stepsTitle}</Kicker>
      {steps.length ? (
        steps.map((s, i) => (
          <View key={i} style={{ flexDirection: "row", gap: 12, alignItems: "flex-start" }}>
            <View style={{ width: 30, height: 30, borderRadius: 15, alignItems: "center", justifyContent: "center", backgroundColor: make.primarySoft }}>
              <MTxt variant="meta" weight="700" color={make.primaryPressed}>
                {String(i + 1)}
              </MTxt>
            </View>
            <MTxt variant="body" style={{ flex: 1, lineHeight: 26 }}>
              {s.text}
            </MTxt>
          </View>
        ))
      ) : (
        <MTxt muted>{t.loadingSteps}</MTxt>
      )}
    </View>
  );
  return (
    <FullSheet visible={visible} title={`${t.recipeBook} · ${dishName(d)}`} onClose={onClose} closeLabel={t.close}>
      <Photo uri={dishImg(id)} height={isWide ? 300 : 200} round={radius.xl}>
        <View style={{ position: "absolute", left: 16, bottom: 14, flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.pill, backgroundColor: "#1f1f1dcc" }}>
          <Icon name="timer" size={16} color="#fff" />
          <MTxt variant="meta" weight="600" color="#fff">
            {cookMinutes(d)} {t.minShort} · {t.filters[d.cat] || d.cat} · {steps.length} {t.steps} · {t.est} {fmtMin(planSeconds({ recipes }, id))}
          </MTxt>
        </View>
      </Photo>
      <MTxt variant="h1" weight="700">
        {dishName(d)}
      </MTxt>
      <View style={{ flexDirection: isWide ? "row" : "column", gap: isWide ? 32 : 20, alignItems: "flex-start" }}>
        {ingredientsBlock}
        {stepsBlock}
      </View>
      {source ? (
        <MTxt variant="caption" color={make.primaryPressed} accessibilityRole="link" onPress={() => { void Linking.openURL(source); }}>
          TheMealDB
        </MTxt>
      ) : null}
    </FullSheet>
  );
}
