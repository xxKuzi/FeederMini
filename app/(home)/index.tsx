// app/index.tsx
import { View, Text, Button, StyleSheet } from "react-native";
import { useRouter } from "expo-router";

export default function HomePage() {
  const router = useRouter();

  const goToConnection = () => {
    router.push("/connection");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to FeederMini</Text>
      <Button title="Go to Connection Page" onPress={goToConnection} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
    fontWeight: "600",
  },
});
