import { View, Button, FlatList, Text } from "react-native";
import { useBLE } from "./BLEContext";

export default function Connection() {
  const {
    devices,
    connectedDevice,
    scanForDevices,
    connectToDevice,
    readData,
    writeData,
    stateValue,
  } = useBLE();

  return (
    <View style={{ padding: 20 }}>
      <Button title="Scan for Devices" onPress={scanForDevices} />
      <FlatList
        data={devices}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Button
            title={`Connect to ${item.name}`}
            onPress={() => connectToDevice(item)}
          />
        )}
      />
      {connectedDevice && (
        <>
          <Text>Connected to {connectedDevice.name}</Text>
          <Button title="Read Data" onPress={readData} />
          <Text>State: {stateValue}</Text>
        </>
      )}
    </View>
  );
}
