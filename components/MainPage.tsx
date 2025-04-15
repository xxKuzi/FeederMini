import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Button,
  FlatList,
  PermissionsAndroid,
  Platform,
  Permission,
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

  const isDefined = (value: unknown): value is string =>
    typeof value === "string" && value.length > 0;

  const requestPermissions = async (): Promise<void> => {
    if (Platform.OS !== "android" || Platform.Version < 23) return;

    let permissions: (string | undefined)[] = [];

    if (Platform.Version >= 31) {
      permissions = [
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      ];
    } else {
      permissions = [
        PermissionsAndroid.PERMISSIONS.BLUETOOTH,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_ADMIN,
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      ];
    }

    // Filter out any undefined or null permissions to avoid "permission is null" crash
    const safePermissions: Permission[] = permissions.filter(
      (p): p is Permission => typeof p === "string"
    );

    try {
      const result = await PermissionsAndroid.requestMultiple(safePermissions);

      const allGranted = Object.values(result).every(
        (status) => status === PermissionsAndroid.RESULTS.GRANTED
      );

      if (!allGranted) {
        console.warn("Some permissions were denied.");
      }
    } catch (err) {
      console.error("Permission request error:", err);
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

      // Subscribe to notifications for automatic updates
      monitorCharacteristic(connected);
    } catch (error) {
      console.log("Connection error:", error);
    }
  };
  const monitorCharacteristic = async (device: Device) => {
    try {
      const services = await device.services();
      for (const service of services) {
        const characteristics = await service.characteristics();
        for (const char of characteristics) {
          if (char.uuid.toLowerCase() === CHARACTERISTIC_UUID.toLowerCase()) {
            console.log("Subscribing to notifications...");

            char.monitor((error, characteristic) => {
              if (error) {
                console.log("Monitor error:", error);
                return;
              }

              if (characteristic?.value) {
                const decodedValue = decode(characteristic.value);
                setStateValue(decodedValue); // Auto-update UI
                console.log(`✅ Confirmation Received: ${decodedValue}`);
              }
            });
            return;
          }
        }
      }
      console.log("Characteristic not found!");
    } catch (error) {
      console.log("Monitoring error:", error);
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
            const base64Data = btoa(value);

            await char.writeWithResponse(base64Data);
            console.log(`Sent: ${value} (Encoded: ${base64Data})`);

            // ✅ No need to manually read back, monitor will auto-update
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
