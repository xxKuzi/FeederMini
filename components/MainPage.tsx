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

const manager = new BleManager();

const BLEApp: React.FC = () => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [connectedDevice, setConnectedDevice] = useState<Device | null>(null);
  const MACBOOK_BLE_NAME = "kubka’s MacBook Pro"; // Change as per your MacBook setup

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
    setTimeout(() => manager.stopDeviceScan(), 5000); // Stop scan after 5 sec
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

  const readData = async (): Promise<void> => {
    if (!connectedDevice) return;
    try {
      const services = await connectedDevice.services();
      for (const service of services) {
        const characteristics = await service.characteristics();
        for (const char of characteristics) {
          if (char.isReadable) {
            const data = await char.read();
            console.log("Received data:", data.value);
          }
        }
      }
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
          <Button title="Read Data" onPress={readData} />
        </>
      )}
    </View>
  );
};

export default BLEApp;
