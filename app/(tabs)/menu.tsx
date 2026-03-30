import { View, Text } from "react-native";

export default function Menu() {
  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 28, fontWeight: "bold" }}>
        ✨ Feeder Mini ✨
      </Text>
      <Text style={{ fontSize: 18, fontWeight: "normal" }}>
        Powered by React Native and BLE
      </Text>
    </View>
  );
}
