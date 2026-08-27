// Root layout: Gesture root + safe area + status bar + monetization init.
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { StyleSheet } from "react-native";
import { initializeMonetization } from "@/src/services/monetization";

import * as NavigationBar from 'expo-navigation-bar';

export default function RootLayout() {
  useEffect(() => {
    initializeMonetization().catch((e) =>
      console.warn("Monetization init error", e)
    );

    // Android: draw nav bar on top of app (edge-to-edge)
    NavigationBar.setPositionAsync('absolute').catch(() => {});
    NavigationBar.setBackgroundColorAsync('#050510').catch(() => {});
  }, []);

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
