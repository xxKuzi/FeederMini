import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Button,
  FlatList,
  PermissionsAndroid,
  Platform,
} from "react-native";
import { BleManager, Device } from "react-native-ble-plx";
import { encode as btoa, decode } from "base-64"; // Import Base64 encoding

const manager = new BleManager();
const MACBOOK_BLE_NAME = "kubka’s MacBook Pro"; // Change as per your MacBook
const CHARACTERISTIC_UUID = "00002A3D-0000-1000-8000-00805F9B34FB"; // Ensure this matches Rust

const BLEApp: React.FC = () => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [connectedDevice, setConnectedDevice] = useState<Device | null>(null);
  const [stateValue, setStateValue] = useState<string>("Unknown");

  useEffect((): any => {
    requestPermissions();
    return () => manager.destroy();
  }, []);

  const requestPermissions = async (): Promise<void> => {
    if (Platform.OS === "android") {
      await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
      ]);
    }
  };

  const scanForDevices = (): void => {
    setDevices([]);
    setConnectedDevice(null);
    manager.startDeviceScan(null, null, (error, device) => {
      if (error) {
        console.log("Scan error:", error);
        return;
      }
      if (device && device.name === MACBOOK_BLE_NAME) {
        setDevices((prevDevices) => {
          if (!prevDevices.some((d) => d.id === device.id)) {
            return [...prevDevices, device];
          }
          return prevDevices;
        });
      }
    });
    setTimeout(() => manager.stopDeviceScan(), 5000);
  };

  const connectToDevice = async (device: Device): Promise<void> => {
    try {
      const connected = await manager.connectToDevice(device.id);
      await connected.discoverAllServicesAndCharacteristics();
      setConnectedDevice(connected);
      console.log("Connected to", connected.name);
    } catch (error) {
      console.log("Connection error:", error);
    }
  };

  const writeData = async (value: string): Promise<void> => {
    if (!connectedDevice) return;

    try {
      console.log(`Writing to BLE: ${value}`);

      const services = await connectedDevice.services();
      for (const service of services) {
        const characteristics = await service.characteristics();
        for (const char of characteristics) {
          if (char.uuid.toLowerCase() === CHARACTERISTIC_UUID.toLowerCase()) {
            const base64Data = btoa(value); // Correct way to Base64 encode in React Native

            await char.writeWithResponse(base64Data);
            console.log(`Sent: ${value} (Encoded: ${base64Data})`);
            return;
          }
        }
      }
      console.log("Characteristic not found!");
    } catch (error) {
      console.log("Write error:", error);
    }
  };

  const readData = async (): Promise<void> => {
    if (!connectedDevice) return;

    try {
      const services = await connectedDevice.services();
      for (const service of services) {
        const characteristics = await service.characteristics();
        for (const char of characteristics) {
          if (char.uuid.toLowerCase() === CHARACTERISTIC_UUID.toLowerCase()) {
            const data = await char.read();
            if (data.value) {
              const decodedValue = decode(data.value);
              setStateValue(decodedValue); // Update state value in UI
              console.log(`Received: ${decodedValue}`);
            } else {
              console.log("Received null value");
            }
            return;
          }
        }
      }
      console.log("Characteristic not found!");
    } catch (error) {
      console.log("Read error:", error);
    }
  };

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
          <Button title="Set On" onPress={() => writeData("on")} />
          <Button title="Set Off" onPress={() => writeData("off")} />
          <Button title="Read Data" onPress={readData} />
          <Text>Current State: {stateValue}</Text>
        </>
      )}
    </View>
  );
};

export default BLEApp;
