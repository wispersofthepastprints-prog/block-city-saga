// Bottom tray + drag-drop slots + floating ghost piece
import React from "react";
import { View, StyleSheet } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from "react-native-reanimated";
import { PieceView } from "./PieceView";
import type { Piece } from "@/src/game/pieces";
import { haptic } from "@/src/services/audio";

const TRAY_CELL_BASE = 16;
const TRAY_GAP = 2;
const GHOST_CELL_BASE = 36;

type Props = {
  pieces: (Piece | null)[];
  slotWidth: number;
  onDragStart: (idx: number) => void;
  onDragMove: (x: number, y: number) => void;
  onDragEnd: (idx: number, x: number, y: number) => boolean;
  goldenSkin: boolean;
  scale?: number;
};

export function Tray({
  pieces,
  slotWidth,
  onDragStart,
  onDragMove,
  onDragEnd,
  goldenSkin,
  scale = 1,
}: Props) {
  const trayCell = Math.max(10, Math.floor(TRAY_CELL_BASE * scale));
  const ghostCell = Math.max(20, Math.floor(GHOST_CELL_BASE * scale));

  return (
    <View style={[styles.tray, { gap: 6 }]} testID="game-tray">
      {pieces.map((piece, i) => (
        <View key={i} style={[styles.slotWrap, { width: slotWidth }]}>
          {piece ? (
            <DraggableSlot
              piece={piece}
              idx={i}
              onDragStart={onDragStart}
              onDragMove={onDragMove}
              onDragEnd={onDragEnd}
              goldenSkin={goldenSkin}
              trayCell={trayCell}
              ghostCell={ghostCell}
            />
          ) : (
            <View style={styles.emptySlot} />
          )}
        </View>
      ))}
    </View>
  );
}

function DraggableSlot({
  piece,
  idx,
  onDragStart,
  onDragMove,
  onDragEnd,
  goldenSkin,
  trayCell,
  ghostCell,
}: {
  piece: Piece;
  idx: number;
  onDragStart: (idx: number) => void;
  onDragMove: (x: number, y: number) => void;
  onDragEnd: (idx: number, x: number, y: number) => boolean;
  goldenSkin: boolean;
  trayCell: number;
  ghostCell: number;
}) {
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const scale = useSharedValue(1);
  const isDragging = useSharedValue(0);

  const onMoveJS = (x: number, y: number) => {
    onDragMove(x, y);
  };
  const onStartJS = () => {
    haptic.light();
    onDragStart(idx);
  };
  const onEndJS = (x: number, y: number) => {
    onDragEnd(idx, x, y);
  };

  const pan = Gesture.Pan()
    .minDistance(0)
    .onStart(() => {
      isDragging.value = 1;
      scale.value = withTiming(1.0, { duration: 100 });
      runOnJS(onStartJS)();
    })
    .onUpdate((e) => {
      tx.value = e.translationX;
      ty.value = e.translationY;
      runOnJS(onMoveJS)(e.absoluteX, e.absoluteY);
    })
    .onEnd((e) => {
      runOnJS(onEndJS)(e.absoluteX, e.absoluteY);
      tx.value = withSpring(0, { damping: 14, stiffness: 180 });
      ty.value = withSpring(0, { damping: 14, stiffness: 180 });
      scale.value = withTiming(1, { duration: 150 });
      isDragging.value = 0;
    });

  const animatedStyle = useAnimatedStyle(() => {
    const draggingScale = isDragging.value === 1 ? ghostCell / trayCell : 1;
    const liftY = isDragging.value === 1 ? -ghostCell * 2 : 0;
    return {
      transform: [
        { translateX: tx.value },
        { translateY: ty.value + liftY },
        { scale: draggingScale },
      ],
      zIndex: isDragging.value === 1 ? 999 : 1,
    };
  });

  return (
    <GestureDetector gesture={pan}>
      <Animated.View
        style={[styles.draggable, animatedStyle]}
        testID={`tray-piece-${idx}`}
      >
        <PieceView
          piece={piece}
          cellSize={trayCell}
          gap={TRAY_GAP}
          golden={goldenSkin}
        />
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  tray: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 10,
    paddingTop: 6,
    paddingBottom: 2,
    height: 90,
    flexShrink: 0,
    alignItems: "center",
    backgroundColor: "#050510",
  },
  slotWrap: {
    height: 74,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  emptySlot: {
    width: "100%",
    height: "100%",
  },
  draggable: {
    alignItems: "center",
    justifyContent: "center",
  },
});