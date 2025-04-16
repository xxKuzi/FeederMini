import { Tabs } from "expo-router";
import { BLEProvider } from "./BLEContext";

export default function Layout() {
  return (
    <BLEProvider>
      <Tabs>
        <Tabs.Screen name="connection" options={{ title: "Connection" }} />
        <Tabs.Screen name="control" options={{ title: "Control" }} />
        <Tabs.Screen name="menu" options={{ title: "Menu" }} />
      </Tabs>
    </BLEProvider>
  );
}
