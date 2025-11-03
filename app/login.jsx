import { Link, Stack } from "expo-router";
import { Platform, StyleSheet } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import GoogleSignInButton from "../components/GoogleSignInButton";

export default function LoginScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Login" }} />
      <ThemedView style={styles.container}>
        <ThemedText type="title">Login</ThemedText>
        <Link href="/(tabs)/explore" style={styles.link}>
          <ThemedText type="link">Try to navigate to home screen!</ThemedText>
        </Link>

        <ThemedView style={styles.socialAuthButtonsContainer}>
          {Platform.OS === "ios" && (
            <>
              <ThemedText type="default">Invertase Apple Sign In</ThemedText>
              {/* <AppleSignInButton /> */}
              <ThemedText type="default">Expo Apple Sign In</ThemedText>
            </>
          )}
          {Platform.OS !== "ios" && <AppleSignInButton />}
          <GoogleSignInButton />
        </ThemedView>
      </ThemedView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  link: {
    marginTop: 15,
    paddingVertical: 15,
  },
});
