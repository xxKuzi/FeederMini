// app/_layout.tsx
import { Tabs } from "expo-router";
import { BLEProvider } from "../../assets/BLEContext";
import { Ionicons } from "@expo/vector-icons";
import {
  TabNavigationState,
  ParamListBase,
  RouteProp,
} from "@react-navigation/native";
import { BottomTabNavigationOptions } from "@react-navigation/bottom-tabs";

export default function Layout() {
  return (
    <BLEProvider>
      <Tabs
        screenOptions={({
          route,
        }: {
          route: RouteProp<ParamListBase, string>;
          navigation: any;
        }): BottomTabNavigationOptions => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName: keyof typeof Ionicons.glyphMap;

            switch (route.name) {
              case "connection":
                iconName = focused ? "bluetooth" : "bluetooth-outline";
                break;
              case "control":
                iconName = focused
                  ? "game-controller"
                  : "game-controller-outline";
                break;
              case "menu":
                iconName = focused ? "menu" : "menu-outline";
                break;
              default:
                iconName = "ellipse-outline";
            }

            return <Ionicons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: "#007AFF",
          tabBarInactiveTintColor: "gray",
        })}
      >
        <Tabs.Screen name="connection" options={{ title: "Connection" }} />
        <Tabs.Screen name="control" options={{ title: "Control" }} />
        <Tabs.Screen name="menu" options={{ title: "Menu" }} />
      </Tabs>
    </BLEProvider>
  );
}
