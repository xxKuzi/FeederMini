import { View, Button, Text } from "react-native";
import { useBLE } from "../assets/BLEContext";

export default function Control() {
  const { writeData, connectedDevice, stateValue } = useBLE();

  if (!connectedDevice) return null;

  return (
    <View style={{ padding: 20 }}>
      <Button title="Play (on)" onPress={() => writeData("on")} />
      <Button title="Stop (off)" onPress={() => writeData("off")} />
      <Text>State: {stateValue}</Text>
    </View>
  );
}
