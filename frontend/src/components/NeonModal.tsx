// Glassmorphic modal shell with neon border.
import React, { ReactNode } from "react";
import { Modal, View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";

type Props = {
  visible: boolean;
  onClose?: () => void;
  title?: string;
  children: ReactNode;
  borderColor?: string;
  dismissable?: boolean;
};

export function NeonModal({
  visible,
  onClose,
  title,
  children,
  borderColor = "#3a86ff",
  dismissable = true,
}: Props) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <BlurView intensity={50} tint="dark" style={StyleSheet.absoluteFillObject}>
        <View style={styles.backdrop}>
          <View
            style={[
              styles.panel,
              {
                borderColor,
                shadowColor: borderColor,
              },
            ]}
          >
            {(title || onClose) && (
              <View style={styles.header}>
                {title ? (
                  <Text style={styles.title} testID={`modal-title-${title}`}>
                    {title}
                  </Text>
                ) : (
                  <View />
                )}
                {dismissable && onClose && (
                  <TouchableOpacity
                    onPress={onClose}
                    style={styles.closeBtn}
                    testID="modal-close"
                  >
                    <Ionicons name="close" size={22} color="#aaa" />
                  </TouchableOpacity>
                )}
              </View>
            )}
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.body}
            >
              {children}
            </ScrollView>
          </View>
        </View>
      </BlurView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    alignItems: "center",
    padding: 18,
  },
  panel: {
    width: "100%",
    maxWidth: 380,
    maxHeight: "85%",
    backgroundColor: "rgba(10,10,20,0.95)",
    borderRadius: 22,
    borderWidth: 1.5,
    shadowOpacity: 0.6,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 0 },
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 6,
  },
  title: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: -0.4,
    flex: 1,
  },
  closeBtn: {
    padding: 6,
  },
  body: {
    padding: 18,
    paddingTop: 8,
  },
});
