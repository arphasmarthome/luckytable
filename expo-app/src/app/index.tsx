/* Home (prototype renderHome): 2×2 card grid on wide screens, single column on phones. */
import { View } from "react-native";
import { Page } from "@/components/ui";
import { AgendaCard } from "@/features/home/AgendaCard";
import { FamilyCard } from "@/features/home/FamilyCard";
import { TonightCard } from "@/features/home/TonightCard";
import { VotesCard } from "@/features/home/VotesCard";
import { useBreakpoint } from "@/hooks/use-breakpoint";

export default function HomeScreen() {
  const { isWide } = useBreakpoint();
  if (!isWide) {
    return (
      <Page gap={20}>
        <TonightCard />
        <FamilyCard />
        <VotesCard />
        <AgendaCard />
      </Page>
    );
  }
  return (
    <Page gap={16} scroll={false}>
      <View style={{ flex: 1, minHeight: 0, flexDirection: "row", gap: 16, alignItems: "stretch" }}>
        <View style={{ flex: 1.2, minWidth: 0 }}>
          <AgendaCard />
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <FamilyCard />
        </View>
      </View>
      <View style={{ flex: 1, minHeight: 0, flexDirection: "row", gap: 16, alignItems: "stretch" }}>
        <View style={{ flex: 1.2, minWidth: 0 }}>
          <TonightCard />
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <VotesCard />
        </View>
      </View>
    </Page>
  );
}
