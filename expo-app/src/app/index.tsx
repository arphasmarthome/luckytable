/* Home (prototype renderHome): 2×2 card grid on wide screens, single column on phones. */
import { View } from "react-native";
import { Page } from "@/components/ui";
import { AgendaCard } from "@/features/home/AgendaCard";
import { FamilyCard } from "@/features/home/FamilyCard";
import { PhotosCard } from "@/features/home/PhotosCard";
import { TonightCard } from "@/features/home/TonightCard";
import { VotesCard } from "@/features/home/VotesCard";
import { useBreakpoint } from "@/hooks/use-breakpoint";

export default function HomeScreen() {
  const { isWide } = useBreakpoint();
  if (!isWide) {
    return (
      <Page gap={12}>
        <TonightCard />
        <AgendaCard />
        <PhotosCard />
        <FamilyCard />
        <VotesCard />
      </Page>
    );
  }
  return (
    <Page gap={10} scroll={false} inset={12}>
      <View style={{ flex: 1, minHeight: 0, flexDirection: "row", gap: 10, alignItems: "stretch" }}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <AgendaCard />
        </View>
        <View style={{ flex: 1.1, minWidth: 0, gap: 10 }}>
          <TonightCard />
          <PhotosCard />
        </View>
        <View style={{ flex: 0.9, minWidth: 0, gap: 10 }}>
          <FamilyCard />
          <VotesCard />
        </View>
      </View>
    </Page>
  );
}
