// Root layout: Gesture root + safe area + status bar + font preloading
import React, { useEffect, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, View } from "react-native";
import * as Font from "expo-font";

export default function RootLayout() {
  // Preload Ionicons font from explicit asset path. We catch any error so
  // the app still renders even if the font fails to load (icons will be empty,
  // but UI keeps working — a known Expo Go intermittent asset issue).
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await Font.loadAsync({
          Ionicons: require("@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/Ionicons.ttf"),
        });
      } catch (e) {
        console.warn("Ionicons font failed to load — continuing without icons", e);
      }
      if (!cancelled) setReady(true);
    })();
    // Safety: never block UI longer than 1.5 s, regardless of font success.
    const id = setTimeout(() => {
      if (!cancelled) setReady(true);
    }, 1500);
    return () => {
      cancelled = true;
      clearTimeout(id);
    };
  }, []);

  if (!ready) {
    return <View style={styles.root} />;
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <Stack screenOptions={{ headerShown: false, animation: "fade" }}>
          <Stack.Screen name="index" />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#050510" },
});
