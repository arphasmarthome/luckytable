import { Slot, usePathname } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { DeviceShell } from "@/components/shell/DeviceShell";
import { DialogHost, ToastHost } from "@/components/ui";

export default function RootLayout() {
  // the phone RSVP page is its own tiny app: no device rail, tabs or top bar
  const phone = usePathname().startsWith("/phone");
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        {phone ? (
          <Slot />
        ) : (
          <DeviceShell>
            <Slot />
          </DeviceShell>
        )}
        <DialogHost />
        <ToastHost />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
