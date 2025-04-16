import React, { createContext, useContext, useEffect, useState } from "react";
import { Platform, PermissionsAndroid, Permission } from "react-native";
import { BleManager, Device } from "react-native-ble-plx";
import { encode as btoa, decode } from "base-64";

const BleManagerInstance = new BleManager();

interface BLEContextType {
  devices: Device[];
  connectedDevice: Device | null;
  stateValue: string;
  scanForDevices: () => void;
  connectToDevice: (device: Device) => Promise<void>;
  writeData: (value: string) => Promise<void>;
  readData: () => Promise<void>;
}

const BLEContext = createContext<BLEContextType | null>(null);

export const useBLE = () => useContext(BLEContext)!;

export const BLEProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [connectedDevice, setConnectedDevice] = useState<Device | null>(null);
  const [stateValue, setStateValue] = useState("Unknown");

  useEffect((): any => {
    requestPermissions();
    return () => BleManagerInstance.destroy();
  }, []);

  const isDefined = (value: unknown): value is string =>
    typeof value === "string" && value.length > 0;

  const requestPermissions = async () => {
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

  const scanForDevices = () => {
    setDevices([]);
    setConnectedDevice(null);

    BleManagerInstance.startDeviceScan(null, null, (error, device) => {
      if (error) return console.log("Scan error:", error);
      if (device && isDefined(device.name)) {
        setDevices((prev) => {
          const exists = prev.some((d) => d.id === device.id);
          return exists ? prev : [...prev, device];
        });
      }
    });

    setTimeout(() => {
      BleManagerInstance.stopDeviceScan();
      console.log("Scan stopped.");
    }, 5000);
  };

  const connectToDevice = async (device: Device) => {
    try {
      const connected = await BleManagerInstance.connectToDevice(device.id);
      await connected.discoverAllServicesAndCharacteristics();
      setConnectedDevice(connected);
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
          if (
            char.uuid.toLowerCase() ===
            "00002A3D-0000-1000-8000-00805F9B34FB".toLowerCase()
          ) {
            char.monitor((error, characteristic) => {
              if (error) return console.log("Monitor error:", error);
              if (characteristic?.value) {
                const decodedValue = decode(characteristic.value);
                setStateValue(decodedValue);
              }
            });
            return;
          }
        }
      }
    } catch (error) {
      console.log("Monitor error:", error);
    }
  };

  const writeData = async (value: string) => {
    if (!connectedDevice) return;

    const services = await connectedDevice.services();
    for (const service of services) {
      const characteristics = await service.characteristics();
      for (const char of characteristics) {
        if (
          char.uuid.toLowerCase() ===
          "00002A3D-0000-1000-8000-00805F9B34FB".toLowerCase()
        ) {
          await char.writeWithResponse(btoa(value));
          return;
        }
      }
    }
  };

  const readData = async () => {
    if (!connectedDevice) return;

    const services = await connectedDevice.services();
    for (const service of services) {
      const characteristics = await service.characteristics();
      for (const char of characteristics) {
        if (
          char.uuid.toLowerCase() ===
          "00002A3D-0000-1000-8000-00805F9B34FB".toLowerCase()
        ) {
          const data = await char.read();
          if (data.value) {
            const decoded = decode(data.value);
            setStateValue(decoded);
          }
          return;
        }
      }
    }
  };

  return (
    <BLEContext.Provider
      value={{
        devices,
        connectedDevice,
        stateValue,
        scanForDevices,
        connectToDevice,
        writeData,
        readData,
      }}
    >
      {children}
    </BLEContext.Provider>
  );
};
