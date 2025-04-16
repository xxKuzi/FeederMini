import { Button } from "react-native";
import MainPage from "../components/MainPage";
import { requestPermissions } from "../hooks/useBLE";
import { useState } from "react";
import { View, Text } from "react-native";
import styles from "./styles/styles";

// Request BLE permissions on the first time it opens
requestPermissions();

export default function Index() {
  // Choose mode

  return (
    <View style={styles.containerScreen}>
      <MainPage />
    </View>
  );
}
