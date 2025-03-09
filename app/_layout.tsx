import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen
        options={{
          title: "BLE + React Native",
          headerStyle: {
            backgroundColor: "#000000",
          },
          headerTintColor: "#fff",
          headerTitleStyle: {
            fontWeight: "bold",
          },
        }}
        name="index"
      />
    </Stack>
  );
}
