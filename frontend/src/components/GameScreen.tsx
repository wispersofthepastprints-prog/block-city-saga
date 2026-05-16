// Main game screen — orchestrates state, drag-drop, modals, scoring.
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  useWindowDimensions,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Icon } from "./Icon";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  withSpring,
  Easing,
} from "react-native-reanimated";
import { RainbowBorder } from "./RainbowBorder";
import { TopBar } from "./TopBar";
import { Skyline } from "./Skyline";
import { GameGrid, GRID_W, GRID_H, CELL_SIZE, CELL_GAP, GRID_PAD } from "./GameGrid";
import { Tray } from "./Tray";
import { Burst } from "./Burst";
import { FloatingText } from "./FloatingText";
import {
  DailyRewardsModal,
  ShopModal,
  SeasonPassModal,
  GameOverModal,
  EnergyModal,
  SettingsModal,
} from "./Modals";
import {
  COLS,
  ROWS,
  Cell,
  emptyGrid,
  canPlace,
  placePiece,
  clearLines,
  isGridLocked,
  fillPercent,
} from "@/src/game/logic";
import {
  Piece,
  randomTriple,
  NEON_COLORS,
} from "@/src/game/pieces";
import { storage } from "@/src/utils/storage";
import {
  haptic,
  playSfx,
  startMusic,
  stopMusic,
  setHapticsEnabled,
  setSfxEnabled,
  setMusicEnabled,
} from "@/src/services/audio";
import { showRewardedAd, purchaseProduct } from "@/src/services/monetization";

const STORAGE_KEYS = {
  HIGH_SCORE: "ba_high_score",
  COINS: "ba_coins",
  UNDOS: "ba_undos",
  ENERGY: "ba_energy",
  ENERGY_TS: "ba_energy_ts",
  PASS: "ba_pass_active",
  DAILY_DAY: "ba_daily_day",
  DAILY_DATE: "ba_daily_date",
  SFX: "ba_sfx",
  MUSIC: "ba_music",
  HAPTICS: "ba_haptics",
  LINES: "ba_lines",
};

const MAX_ENERGY = 5;

export function GameScreen() {
  const { width: winW } = useWindowDimensions();
  const SCREEN_W = winW && winW > 0 ? Math.min(Math.max(winW, 320), 430) : 380;
  const insets = useSafeAreaInsets();
  // Bottom inset: Android nav bar / iPhone home indicator must not cover the tray.
  // Use a generous floor (60 px) so even when insets.bottom reports 0 (some
  // Android edge-to-edge devices), the tray stays clear of the nav buttons.
  const bottomPad = Math.max(insets.bottom + 24, 80);

  // Game state
  const [grid, setGrid] = useState<Cell[][]>(() => emptyGrid());
  const [pieces, setPieces] = useState<(Piece | null)[]>(() => randomTriple());
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [combo, setCombo] = useState(0);
  const [linesCleared, setLinesCleared] = useState(0);
  const [hover, setHover] = useState<
    { row: number; col: number; piece: Piece; valid: boolean } | null
  >(null);
  const [draggingIdx, setDraggingIdx] = useState<number | null>(null);
  const [bursts, setBursts] = useState<
    { id: number; x: number; y: number; color: string }[]
  >([]);
  const [floats, setFloats] = useState<
    { id: number; x: number; y: number; text: string; color: string }[]
  >([]);
  const [flashRows, setFlashRows] = useState<number[]>([]);
  const [flashCols, setFlashCols] = useState<number[]>([]);
  const [clearingRows, setClearingRows] = useState<number[]>([]);
  const [clearingCols, setClearingCols] = useState<number[]>([]);
  const burstId = useRef(0);
  const floatId = useRef(0);

  // Persisted
  const [coins, setCoins] = useState(0);
  const [undos, setUndos] = useState(3);
  const [energy, setEnergy] = useState(MAX_ENERGY);
  const [highScore, setHighScore] = useState(0);
  const [passActive, setPassActive] = useState(false);
  const [dailyDay, setDailyDay] = useState(0);

  // Settings
  const [sfxOn, setSfxOn] = useState(true);
  const [musicOn, setMusicOn] = useState(true);
  const [hapticsOn, setHapticsOn] = useState(true);

  // Modals
  const [showShop, setShowShop] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [showDaily, setShowDaily] = useState(false);
  const [showGameOver, setShowGameOver] = useState(false);
  const [showEnergy, setShowEnergy] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [loadingAd, setLoadingAd] = useState(false);
  const [loadingIap, setLoadingIap] = useState(false);

  // Grid position in screen coords
  const gridScreen = useRef({ x: 0, y: 0 });
  const gridRef = useRef<View>(null);

  // Undo snapshot
  const undoSnap = useRef<{ grid: Cell[][]; pieces: (Piece | null)[]; score: number } | null>(
    null
  );

  // Shake animation
  const shakeX = useSharedValue(0);
  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeX.value }],
  }));

  // Danger pulse animation
  const dangerOpacity = useSharedValue(0);
  const dangerStyle = useAnimatedStyle(() => ({
    opacity: dangerOpacity.value,
  }));

  // Initial load
  useEffect(() => {
    (async () => {
      const [hs, c, u, e, pa, sfx, mus, hap, lines] = await Promise.all([
        storage.getItem(STORAGE_KEYS.HIGH_SCORE, 0),
        storage.getItem(STORAGE_KEYS.COINS, 100),
        storage.getItem(STORAGE_KEYS.UNDOS, 3),
        storage.getItem(STORAGE_KEYS.ENERGY, MAX_ENERGY),
        storage.getItem(STORAGE_KEYS.PASS, false),
        storage.getItem(STORAGE_KEYS.SFX, true),
        storage.getItem(STORAGE_KEYS.MUSIC, true),
        storage.getItem(STORAGE_KEYS.HAPTICS, true),
        storage.getItem(STORAGE_KEYS.LINES, 0),
      ]);
      setHighScore((hs as number) ?? 0);
      setCoins((c as number) ?? 100);
      setUndos((u as number) ?? 3);
      setEnergy((e as number) ?? MAX_ENERGY);
      setPassActive((pa as boolean) ?? false);
      setSfxOn((sfx as boolean) ?? true);
      setMusicOn((mus as boolean) ?? true);
      setHapticsOn((hap as boolean) ?? true);
      setLinesCleared((lines as number) ?? 0);

      setSfxEnabled((sfx as boolean) ?? true);
      setHapticsEnabled((hap as boolean) ?? true);
      setMusicEnabled((mus as boolean) ?? true);

      // Daily rewards check
      const lastDate = (await storage.getItem<string>(STORAGE_KEYS.DAILY_DATE, "")) ?? "";
      const day = (await storage.getItem(STORAGE_KEYS.DAILY_DAY, 0)) ?? 0;
      const today = new Date().toDateString();
      if (lastDate !== today) {
        setShowDaily(true);
        setDailyDay((day as number) % 7);
      } else {
        setDailyDay((day as number) % 7);
      }

      // start music
      setTimeout(() => {
        if ((mus as boolean) ?? true) startMusic();
      }, 500);
    })();
    return () => stopMusic();
  }, []);

  // Persist on changes
  useEffect(() => {
    storage.setItem(STORAGE_KEYS.COINS, coins);
  }, [coins]);
  useEffect(() => {
    storage.setItem(STORAGE_KEYS.UNDOS, undos);
  }, [undos]);
  useEffect(() => {
    storage.setItem(STORAGE_KEYS.ENERGY, energy);
  }, [energy]);
  useEffect(() => {
    storage.setItem(STORAGE_KEYS.PASS, passActive);
  }, [passActive]);
  useEffect(() => {
    storage.setItem(STORAGE_KEYS.LINES, linesCleared);
  }, [linesCleared]);
  useEffect(() => {
    storage.setItem(STORAGE_KEYS.HIGH_SCORE, highScore);
  }, [highScore]);

  // Danger pulse when grid > 75% full
  useEffect(() => {
    const filled = fillPercent(grid);
    if (filled > 0.75) {
      dangerOpacity.value = withRepeat(
        withTiming(0.55, { duration: 800, easing: Easing.inOut(Easing.sin) }),
        -1,
        true
      );
    } else {
      dangerOpacity.value = withTiming(0, { duration: 300 });
    }
  }, [grid, dangerOpacity]);

  // Track grid position
  const onGridMounted = useCallback((x: number, y: number) => {
    // We need absolute screen position - measure on next tick
    requestAnimationFrame(() => {
      gridRef.current?.measureInWindow((sx, sy) => {
        gridScreen.current = { x: sx, y: sy };
      });
    });
  }, []);

  // Drag callbacks
  const handleDragStart = useCallback((idx: number) => {
    setDraggingIdx(idx);
    // Re-measure grid in case layout shifted
    gridRef.current?.measureInWindow((sx, sy) => {
      gridScreen.current = { x: sx, y: sy };
    });
  }, []);

  const computeCell = useCallback((absX: number, absY: number, piece: Piece) => {
    const pw = piece.shape[0].length;
    const ph = piece.shape.length;
    const pieceWpx = pw * CELL_SIZE + (pw - 1) * CELL_GAP;
    const pieceHpx = ph * CELL_SIZE + (ph - 1) * CELL_GAP;
    // ghost center is at (absX, absY - 50) due to lift
    const gx = absX - pieceWpx / 2;
    const gy = absY - 50 - pieceHpx / 2;
    const localX = gx - gridScreen.current.x - GRID_PAD;
    const localY = gy - gridScreen.current.y - GRID_PAD;
    const col = Math.round(localX / (CELL_SIZE + CELL_GAP));
    const row = Math.round(localY / (CELL_SIZE + CELL_GAP));
    return { row, col };
  }, []);

  const handleDragMove = useCallback(
    (absX: number, absY: number) => {
      if (draggingIdx === null) return;
      const piece = pieces[draggingIdx];
      if (!piece) return;
      const { row, col } = computeCell(absX, absY, piece);
      const valid = canPlace(grid, piece, row, col);
      setHover((h) => {
        if (h && h.row === row && h.col === col && h.valid === valid) return h;
        if (valid && (!h || !h.valid)) {
          haptic.selection();
        }
        return { row, col, piece, valid };
      });
    },
    [draggingIdx, pieces, grid, computeCell]
  );

  const spawnBurstsForLines = useCallback(
    (rows: number[], cols: number[]) => {
      const newBursts: { id: number; x: number; y: number; color: string }[] = [];
      const palette = Object.values(NEON_COLORS);
      const baseX = gridScreen.current.x;
      const baseY = gridScreen.current.y;
      rows.forEach((r) => {
        for (let c = 0; c < COLS; c += 2) {
          newBursts.push({
            id: burstId.current++,
            x:
              baseX +
              GRID_PAD +
              c * (CELL_SIZE + CELL_GAP) +
              CELL_SIZE / 2,
            y:
              baseY +
              GRID_PAD +
              r * (CELL_SIZE + CELL_GAP) +
              CELL_SIZE / 2,
            color: palette[(r + c) % palette.length],
          });
        }
      });
      cols.forEach((c) => {
        for (let r = 0; r < ROWS; r += 2) {
          newBursts.push({
            id: burstId.current++,
            x:
              baseX +
              GRID_PAD +
              c * (CELL_SIZE + CELL_GAP) +
              CELL_SIZE / 2,
            y:
              baseY +
              GRID_PAD +
              r * (CELL_SIZE + CELL_GAP) +
              CELL_SIZE / 2,
            color: palette[(r + c) % palette.length],
          });
        }
      });
      setBursts((b) => [...b, ...newBursts]);
    },
    []
  );

  const addFloatingText = useCallback(
    (x: number, y: number, text: string, color: string) => {
      setFloats((f) => [
        ...f,
        { id: floatId.current++, x, y, text, color },
      ]);
    },
    []
  );

  const triggerShake = useCallback(
    (intensity: number) => {
      shakeX.value = withSequence(
        withTiming(-intensity, { duration: 40 }),
        withTiming(intensity, { duration: 40 }),
        withTiming(-intensity * 0.6, { duration: 40 }),
        withTiming(intensity * 0.6, { duration: 40 }),
        withTiming(0, { duration: 40 })
      );
    },
    [shakeX]
  );

  const handleDragEnd = useCallback(
    (idx: number, absX: number, absY: number) => {
      const piece = pieces[idx];
      setDraggingIdx(null);
      const currentHover = hover;
      setHover(null);
      if (!piece) return false;
      const { row, col } = computeCell(absX, absY, piece);
      if (!canPlace(grid, piece, row, col)) {
        haptic.error();
        playSfx("invalid");
        return false;
      }

      // SUCCESS: place
      // snapshot for undo
      undoSnap.current = { grid, pieces: [...pieces], score };
      haptic.medium();
      playSfx("drop");

      const placed = placePiece(grid, piece, row, col);
      const newPieces = [...pieces];
      newPieces[idx] = null;

      // Try clearing lines
      const { grid: clearedGrid, rowsCleared, colsCleared } = clearLines(placed);
      const totalClears = rowsCleared.length + colsCleared.length;

      // base points: cell count
      let cellCount = 0;
      for (const row of piece.shape) for (const v of row) if (v) cellCount++;
      const passMul = passActive ? 2 : 1;
      let gain = cellCount * 5 * passMul;

      if (totalClears > 0) {
        // flash rows/cols first, then clear
        setFlashRows(rowsCleared);
        setFlashCols(colsCleared);

        setTimeout(() => {
          setFlashRows([]);
          setFlashCols([]);
          setClearingRows(rowsCleared);
          setClearingCols(colsCleared);
          setGrid(clearedGrid);
          setLinesCleared((l) => l + totalClears);
          spawnBurstsForLines(rowsCleared, colsCleared);
          const newCombo = combo + 1;
          setCombo(newCombo);
          setStreak((s) => s + 1);
          const lineScore = totalClears * 100 * Math.max(1, newCombo) * passMul;
          gain += lineScore;
          setScore((s) => {
            const ns = s + gain;
            if (ns > highScore) setHighScore(ns);
            return ns;
          });
          setCoins((c) => c + totalClears * 10);

          const cx = SCREEN_W / 2;
          const cy = gridScreen.current.y + GRID_H / 2;
          addFloatingText(
            cx - 40,
            cy,
            `+${lineScore}`,
            totalClears >= 2 ? "#ff006e" : "#ffbe0b"
          );
          if (newCombo >= 2) {
            addFloatingText(
              cx - 50,
              cy + 40,
              `${newCombo}X COMBO!`,
              "#06ffa5"
            );
            playSfx("combo");
          } else {
            playSfx("clear");
          }
          haptic.heavy();
          triggerShake(6 + Math.min(totalClears, 4) * 3);

          // clearing reset
          setTimeout(() => {
            setClearingRows([]);
            setClearingCols([]);
          }, 200);
        }, 100);
      } else {
        // No lines cleared - reset combo (but maintain streak? typical block puzzle keeps combo only on consecutive clears)
        setCombo(0);
        setGrid(placed);
        setScore((s) => {
          const ns = s + gain;
          if (ns > highScore) setHighScore(ns);
          return ns;
        });
      }

      // Respawn pieces if all 3 used
      if (newPieces.every((p) => p === null)) {
        setTimeout(() => setPieces(randomTriple()), 250);
      } else {
        setPieces(newPieces);
      }

      // Check city completion (6 buildings, threshold 48 lines per cycle)
      const newTotalLines = linesCleared + totalClears;
      const inCycle = newTotalLines % 60;
      const prevCycle = linesCleared % 60;
      if (prevCycle < 48 && inCycle >= 48) {
        // City complete bonus
        setTimeout(() => {
          setScore((s) => s + 1000 * passMul);
          setCoins((c) => c + 100);
          addFloatingText(
            SCREEN_W / 2 - 80,
            120,
            `CITY COMPLETE! +${1000 * passMul}`,
            "#ffbe0b"
          );
          playSfx("bonus");
          haptic.success();
        }, 500);
      }

      return true;
    },
    [
      pieces,
      grid,
      score,
      hover,
      combo,
      computeCell,
      highScore,
      passActive,
      linesCleared,
      spawnBurstsForLines,
      addFloatingText,
      triggerShake,
    ]
  );

  // Check grid lock when pieces change
  useEffect(() => {
    if (pieces.every((p) => p === null)) return;
    if (isGridLocked(grid, pieces)) {
      setTimeout(() => setShowGameOver(true), 400);
    }
  }, [pieces, grid]);

  // Cleanup bursts/floats
  const removeBurst = useCallback((id: number) => {
    setBursts((b) => b.filter((x) => x.id !== id));
  }, []);
  const removeFloat = useCallback((id: number) => {
    setFloats((f) => f.filter((x) => x.id !== id));
  }, []);

  // Actions
  const handleUndo = useCallback(() => {
    if (undos === 0) {
      setShowShop(true);
      return;
    }
    if (!undoSnap.current) return;
    haptic.light();
    playSfx("tap");
    setGrid(undoSnap.current.grid);
    setPieces(undoSnap.current.pieces);
    setScore(undoSnap.current.score);
    setUndos((u) => u - 1);
    undoSnap.current = null;
  }, [undos]);

  const handleDailyClaim = useCallback(async () => {
    const amounts = [20, 30, 50, 75, 100, 150, 200];
    const reward = amounts[dailyDay] ?? 20;
    setCoins((c) => c + reward);
    const newDay = (dailyDay + 1) % 7;
    setDailyDay(newDay);
    await storage.setItem(STORAGE_KEYS.DAILY_DAY, newDay);
    await storage.setItem(STORAGE_KEYS.DAILY_DATE, new Date().toDateString());
    setShowDaily(false);
  }, [dailyDay]);

  const handleShopBuy = useCallback(
    (id: string, price: number) => {
      if (coins < price) return;
      setCoins((c) => c - price);
      if (id === "energy") {
        setEnergy(MAX_ENERGY);
      } else if (id === "undos") {
        setUndos((u) => u + 3);
      }
      // hints/hammer not deeply wired in MVP (would require additional gameplay mechanics)
    },
    [coins]
  );

  const handleWatchAd = useCallback(async () => {
    setLoadingAd(true);
    try {
      const { rewarded } = await showRewardedAd();
      if (rewarded) {
        if (showEnergy) {
          setEnergy(MAX_ENERGY);
          setShowEnergy(false);
        }
        if (showGameOver) {
          // Clear ~3 rows from bottom as "continue"
          const newGrid = grid.map((row) => row.map((c) => ({ ...c })));
          for (let r = ROWS - 3; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
              newGrid[r][c] = { filled: false, color: null };
            }
          }
          setGrid(newGrid);
          setPieces(randomTriple());
          setShowGameOver(false);
        }
        haptic.success();
        playSfx("bonus");
      }
    } finally {
      setLoadingAd(false);
    }
  }, [showEnergy, showGameOver, grid]);

  const handleContinueWithCoins = useCallback(() => {
    if (coins < 50) return;
    setCoins((c) => c - 50);
    const newGrid = grid.map((row) => row.map((c) => ({ ...c })));
    for (let r = ROWS - 3; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        newGrid[r][c] = { filled: false, color: null };
      }
    }
    setGrid(newGrid);
    setPieces(randomTriple());
    setShowGameOver(false);
    haptic.success();
    playSfx("coin");
  }, [coins, grid]);

  const handleRestart = useCallback(() => {
    setGrid(emptyGrid());
    setPieces(randomTriple());
    setScore(0);
    setStreak(0);
    setCombo(0);
    setShowGameOver(false);
    setShowSettings(false);
    undoSnap.current = null;
  }, []);

  const handleSubscribePass = useCallback(async () => {
    setLoadingIap(true);
    try {
      const r = await purchaseProduct("season_pass_monthly");
      if (r.success) {
        setPassActive(true);
        haptic.success();
        playSfx("bonus");
      }
    } finally {
      setLoadingIap(false);
    }
  }, []);

  const handleRefillCoins = useCallback(() => {
    if (coins < 40) return;
    setCoins((c) => c - 40);
    setEnergy(MAX_ENERGY);
    setShowEnergy(false);
    haptic.success();
    playSfx("coin");
  }, [coins]);

  // Top bar callbacks
  const onPressCoins = useCallback(() => {
    haptic.selection();
    setShowShop(true);
  }, []);
  const onPressEnergy = useCallback(() => {
    haptic.selection();
    if (!passActive && energy === 0) setShowEnergy(true);
  }, [passActive, energy]);
  const onPressSettings = useCallback(() => {
    haptic.selection();
    setShowSettings(true);
  }, []);

  // Settings toggles
  const toggleSfx = useCallback(() => {
    setSfxOn((v) => {
      const nv = !v;
      setSfxEnabled(nv);
      storage.setItem(STORAGE_KEYS.SFX, nv);
      return nv;
    });
  }, []);
  const toggleMusic = useCallback(() => {
    setMusicOn((v) => {
      const nv = !v;
      setMusicEnabled(nv);
      storage.setItem(STORAGE_KEYS.MUSIC, nv);
      if (nv) startMusic();
      else stopMusic();
      return nv;
    });
  }, []);
  const toggleHaptics = useCallback(() => {
    setHapticsOn((v) => {
      const nv = !v;
      setHapticsEnabled(nv);
      storage.setItem(STORAGE_KEYS.HAPTICS, nv);
      return nv;
    });
  }, []);

  const slotWidth = (SCREEN_W - 24 - 12) / 3;

  return (
    <SafeAreaView style={styles.root} edges={["top", "left", "right", "bottom"]}>
      <RainbowBorder />
      <Animated.View style={[styles.container, shakeStyle]}>
        <TopBar
          score={score}
          streak={streak}
          coins={coins}
          energy={passActive ? MAX_ENERGY : energy}
          maxEnergy={MAX_ENERGY}
          unlimitedEnergy={passActive}
          onPressCoins={onPressCoins}
          onPressEnergy={onPressEnergy}
          onPressSettings={onPressSettings}
        />

        <View style={styles.skylineWrap}>
          <Skyline linesCleared={linesCleared} width={SCREEN_W - 16} />
        </View>

        <View
          ref={gridRef}
          onLayout={() => {
            gridRef.current?.measureInWindow((sx, sy) => {
              gridScreen.current = { x: sx, y: sy };
            });
          }}
          style={styles.gridWrap}
        >
          <GameGrid
            grid={grid}
            hover={hover}
            clearingRows={clearingRows}
            clearingCols={clearingCols}
            flashRows={flashRows}
            flashCols={flashCols}
            goldenSkin={passActive}
            onGridLayout={onGridMounted}
          />
          {/* danger overlay */}
          <Animated.View
            pointerEvents="none"
            style={[styles.dangerOverlay, dangerStyle]}
          />
        </View>

        {/* Undo button */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.undoBtn, undos === 0 && { opacity: 0.55 }]}
            onPress={handleUndo}
            testID="undo-button"
          >
            <Icon name="arrow-undo" size={18} color="#3a86ff" />
            <Text style={styles.undoText}>UNDO</Text>
            <View style={styles.undoCount}>
              <Text style={styles.undoCountText}>{undos}</Text>
            </View>
          </TouchableOpacity>
        </View>

        <Tray
          pieces={pieces}
          slotWidth={slotWidth}
          onDragStart={handleDragStart}
          onDragMove={handleDragMove}
          onDragEnd={handleDragEnd}
          goldenSkin={passActive}
        />
        <View style={{ height: bottomPad }} />
      </Animated.View>
      {/* Burst & floating texts overlay (positioned absolutely in window coords) */}
      {bursts.map((b) => (
        <Burst
          key={b.id}
          x={b.x}
          y={b.y}
          color={b.color}
          onComplete={() => removeBurst(b.id)}
        />
      ))}
      {floats.map((f) => (
        <FloatingText
          key={f.id}
          x={f.x}
          y={f.y}
          text={f.text}
          color={f.color}
          onComplete={() => removeFloat(f.id)}
        />
      ))}

      {/* Modals */}
      <DailyRewardsModal
        visible={showDaily}
        currentDay={dailyDay}
        onClaim={handleDailyClaim}
        onClose={() => setShowDaily(false)}
      />
      <ShopModal
        visible={showShop}
        coins={coins}
        onPurchase={handleShopBuy}
        onClose={() => setShowShop(false)}
        onOpenSeasonPass={() => {
          setShowShop(false);
          setShowPass(true);
        }}
      />
      <SeasonPassModal
        visible={showPass}
        active={passActive}
        onSubscribe={handleSubscribePass}
        onClose={() => setShowPass(false)}
        loading={loadingIap}
      />
      <GameOverModal
        visible={showGameOver}
        score={score}
        highScore={highScore}
        onWatchAd={handleWatchAd}
        onContinue={handleContinueWithCoins}
        onRestart={handleRestart}
        onBuyPass={() => {
          setShowGameOver(false);
          setShowPass(true);
        }}
        passActive={passActive}
        loadingAd={loadingAd}
      />
      <EnergyModal
        visible={showEnergy}
        coins={coins}
        onRefillCoins={handleRefillCoins}
        onWatchAd={handleWatchAd}
        onClose={() => setShowEnergy(false)}
        onBuyPass={() => {
          setShowEnergy(false);
          setShowPass(true);
        }}
        passActive={passActive}
        loadingAd={loadingAd}
      />
      <SettingsModal
        visible={showSettings}
        onClose={() => setShowSettings(false)}
        sfxOn={sfxOn}
        musicOn={musicOn}
        hapticsOn={hapticsOn}
        toggleSfx={toggleSfx}
        toggleMusic={toggleMusic}
        toggleHaptics={toggleHaptics}
        onRestart={handleRestart}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#050510",
  },
  container: {
    flex: 1,
    maxWidth: 430,
    width: "100%",
    alignSelf: "center",
  },
  skylineWrap: {
    alignItems: "center",
    paddingHorizontal: 8,
    paddingTop: 4,
    paddingBottom: 4,
  },
  gridWrap: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  dangerOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    borderRadius: 12,
    borderWidth: 6,
    borderColor: "#ff0033",
    alignSelf: "center",
    width: GRID_W,
    height: GRID_H,
  },
  actionRow: {
    flexDirection: "row",
    justifyContent: "center",
    paddingTop: 8,
  },
  undoBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(58,134,255,0.08)",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(58,134,255,0.25)",
  },
  undoText: {
    color: "#3a86ff",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  undoCount: {
    backgroundColor: "#3a86ff",
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  undoCountText: {
    color: "#000",
    fontSize: 10,
    fontWeight: "900",
  },
});
