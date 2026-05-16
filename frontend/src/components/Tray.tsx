// Bottom tray + drag-drop slots + floating ghost piece
import React, { useEffect } from "react";
import { View, StyleSheet } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  SharedValue,
} from "react-native-reanimated";
import { PieceView } from "./PieceView";
import type { Piece } from "@/src/game/pieces";
import { haptic } from "@/src/services/audio";

const TRAY_CELL = 26; // tray preview cell size
const TRAY_GAP = 2;
const GHOST_CELL = 36; // matches grid cell

type Props = {
  pieces: (Piece | null)[];
  slotWidth: number;
  onDragStart: (idx: number) => void;
  onDragMove: (x: number, y: number) => void;
  onDragEnd: (idx: number, x: number, y: number) => boolean; // returns true if placed
  goldenSkin: boolean;
};

export function Tray({
  pieces,
  slotWidth,
  onDragStart,
  onDragMove,
  onDragEnd,
  goldenSkin,
}: Props) {
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
}: {
  piece: Piece;
  idx: number;
  onDragStart: (idx: number) => void;
  onDragMove: (x: number, y: number) => void;
  onDragEnd: (idx: number, x: number, y: number) => boolean;
  goldenSkin: boolean;
}) {
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const scale = useSharedValue(1);
  const isDragging = useSharedValue(0);

  const pieceW = piece.shape[0].length;
  const pieceH = piece.shape.length;

  const onMoveJS = (x: number, y: number) => {
    onDragMove(x, y);
  };
  const onStartJS = () => {
    haptic.light();
    onDragStart(idx);
  };
  const onEndJS = (x: number, y: number) => {
    const placed = onDragEnd(idx, x, y);
    if (!placed) {
      // snap back animation handled below
    }
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
      // snap back regardless; parent will hide the piece if it was placed.
      tx.value = withSpring(0, { damping: 14, stiffness: 180 });
      ty.value = withSpring(0, { damping: 14, stiffness: 180 });
      scale.value = withTiming(1, { duration: 150 });
      isDragging.value = 0;
    });

  const animatedStyle = useAnimatedStyle(() => {
    // Ghost piece is rendered larger when dragging (closer to grid cell size)
    const draggingScale =
      isDragging.value === 1
        ? GHOST_CELL / TRAY_CELL
        : 1;
    // Translate up by ~50 when dragging to lift above finger
    const liftY = isDragging.value === 1 ? -50 - (pieceH * (GHOST_CELL - TRAY_CELL)) / 2 : 0;
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
          cellSize={TRAY_CELL}
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
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 4,
    minHeight: 130,
    alignItems: "center",
  },
  slotWrap: {
    height: 110,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: 12,
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
