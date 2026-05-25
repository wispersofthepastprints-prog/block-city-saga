// All game modals consolidated in one file (small, easy to follow)
import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Linking,
  Alert,
} from "react-native";
import { Image } from "expo-image";
import { Icon } from "./Icon";
import { LinearGradient } from "expo-linear-gradient";
import { NeonModal } from "./NeonModal";
import { haptic, playSfx } from "@/src/services/audio";

// =============================================================================
// DAILY REWARDS
// =============================================================================
const DAILY_AMOUNTS = [20, 30, 50, 75, 100, 150, 200];

export function DailyRewardsModal({
  visible,
  currentDay,
  onClaim,
  onClose,
}: {
  visible: boolean;
  currentDay: number; // 0-indexed, the day to be claimed
  onClaim: () => void;
  onClose: () => void;
}) {
  return (
    <NeonModal
      visible={visible}
      onClose={onClose}
      title="DAILY REWARDS"
      borderColor="#ffbe0b"
    >
      <Image
        source={{
          uri: "https://static.prod-images.emergentagent.com/jobs/a4951157-a4c0-42fc-b349-70a5ef615d2c/images/9948fce92629b8e60bba292eb34607ab6ad0176d5b77d99cf48cda5b6638de51.png",
        }}
        style={mStyles.hero}
        contentFit="contain"
      />
      <Text style={mStyles.subtitle}>
        Log in every day for bigger rewards!
      </Text>
      <View style={mStyles.daysGrid}>
        {DAILY_AMOUNTS.map((amt, i) => {
          const claimed = i < currentDay;
          const today = i === currentDay;
          return (
            <View
              key={i}
              style={[
                mStyles.dayCell,
                claimed && mStyles.dayCellClaimed,
                today && mStyles.dayCellToday,
              ]}
              testID={`daily-day-${i}`}
            >
              <Text style={mStyles.dayLabel}>Day {i + 1}</Text>
              <Icon
                name="cash"
                size={20}
                color={today ? "#ffbe0b" : claimed ? "#06ffa5" : "#666"}
              />
              <Text
                style={[
                  mStyles.dayAmount,
                  today && { color: "#ffbe0b" },
                  claimed && { color: "#06ffa5" },
                ]}
              >
                {amt}
              </Text>
              {claimed && (
                <Icon
                  name="checkmark-circle"
                  size={14}
                  color="#06ffa5"
                  style={{ position: "absolute", top: 4, right: 4 }}
                />
              )}
            </View>
          );
        })}
      </View>
      <TouchableOpacity
        style={[mStyles.cta, { backgroundColor: "#ffbe0b" }]}
        onPress={() => {
          haptic.success();
          playSfx("coin");
          onClaim();
        }}
        testID="daily-claim-btn"
      >
        <Text style={[mStyles.ctaText, { color: "#000" }]}>
          CLAIM {DAILY_AMOUNTS[currentDay] ?? 200} COINS
        </Text>
      </TouchableOpacity>
    </NeonModal>
  );
}

// =============================================================================
// SHOP
// =============================================================================
const SHOP_ITEMS = [
  { id: "hints", name: "Hints x3", price: 15, icon: "bulb", color: "#ffbe0b" },
  { id: "undos", name: "Undos x3", price: 25, icon: "arrow-undo", color: "#3a86ff" },
  { id: "hammer", name: "Hammer x1", price: 60, icon: "hammer", color: "#ff9500" },
  { id: "energy", name: "Energy Refill", price: 40, icon: "flash", color: "#06ffa5" },
] as const;

export function ShopModal({
  visible,
  coins,
  onPurchase,
  onClose,
  onOpenSeasonPass,
}: {
  visible: boolean;
  coins: number;
  onPurchase: (id: string, price: number) => void;
  onClose: () => void;
  onOpenSeasonPass: () => void;
}) {
  return (
    <NeonModal
      visible={visible}
      onClose={onClose}
      title="SHOP"
      borderColor="#06ffa5"
    >
      <View style={mStyles.shopHeader}>
        <Image
          source={{
            uri: "https://static.prod-images.emergentagent.com/jobs/a4951157-a4c0-42fc-b349-70a5ef615d2c/images/b54879ea330bbea5e9506e290149ea033c68058ec526d433658eeee2b4c5ef6d.png",
          }}
          style={mStyles.shopImg}
          contentFit="contain"
        />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={mStyles.coinBal} testID="shop-coin-balance">
            <Icon name="cash" size={16} color="#ffbe0b" /> {coins.toLocaleString()}
          </Text>
          <Text style={mStyles.coinLabel}>YOUR COINS</Text>
        </View>
      </View>
      {SHOP_ITEMS.map((item) => {
        const affordable = coins >= item.price;
        return (
          <TouchableOpacity
            key={item.id}
            style={[mStyles.shopItem, !affordable && { opacity: 0.5 }]}
            disabled={!affordable}
            onPress={() => {
              haptic.medium();
              playSfx("coin");
              onPurchase(item.id, item.price);
            }}
            testID={`shop-buy-${item.id}`}
          >
            <View
              style={[mStyles.shopIcon, { backgroundColor: item.color + "22" }]}
            >
              <Icon name={item.icon as any} size={22} color={item.color} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={mStyles.shopItemName}>{item.name}</Text>
              <Text style={mStyles.shopItemSub}>Tap to purchase</Text>
            </View>
            <View style={mStyles.shopPrice}>
              <Icon name="cash" size={12} color="#ffbe0b" />
              <Text style={mStyles.shopPriceText}>{item.price}</Text>
            </View>
          </TouchableOpacity>
        );
      })}
      <TouchableOpacity
        style={mStyles.passUpsell}
        onPress={() => {
          haptic.light();
          onOpenSeasonPass();
        }}
        testID="shop-open-pass"
      >
        <Icon name="star" size={16} color="#ffbe0b" />
        <Text style={mStyles.passUpsellText}>
          Skip the grind — Season Pass for unlimited energy!
        </Text>
      </TouchableOpacity>
    </NeonModal>
  );
}

// =============================================================================
// SEASON PASS
// =============================================================================
export function SeasonPassModal({
  visible,
  active,
  onSubscribe,
  onClose,
  loading,
}: {
  visible: boolean;
  active: boolean;
  onSubscribe: () => void;
  onClose: () => void;
  loading: boolean;
}) {
  return (
    <NeonModal
      visible={visible}
      onClose={onClose}
      title="TETRIS ARCHITECT PRO"
      borderColor="#ffbe0b"
    >
      <Image
        source={{
          uri: "https://static.prod-images.emergentagent.com/jobs/a4951157-a4c0-42fc-b349-70a5ef615d2c/images/4d4988106bfb4d82a336e8dc63f5cb07f8d4c1bd10501e0113305fcc27aa1c75.png",
        }}
        style={mStyles.passHero}
        contentFit="cover"
      />
      <Text style={mStyles.passTitle}>Unlock the Architect</Text>
      <View style={{ gap: 8, marginVertical: 12 }}>
        <PassPerk icon="rocket" text="2x City Progress" color="#ff006e" />
        <PassPerk icon="trophy" text="Golden Block Skins" color="#ffbe0b" />
        <PassPerk icon="flash" text="Unlimited Energy" color="#06ffa5" />
        <PassPerk icon="close-circle" text="No Ads, Ever" color="#3a86ff" />
        <PassPerk icon="diamond" text="Exclusive Daily Rewards" color="#8338ec" />
      </View>
      {active ? (
        <View style={[mStyles.cta, { backgroundColor: "#06ffa5" }]}>
          <Text style={[mStyles.ctaText, { color: "#000" }]}>
            ✓ ACTIVE — PREMIUM PERKS ENABLED
          </Text>
        </View>
      ) : (
        <TouchableOpacity
          style={[mStyles.cta, { backgroundColor: "#ffbe0b" }]}
          onPress={onSubscribe}
          disabled={loading}
          testID="pass-subscribe"
        >
          {loading ? (
            <ActivityIndicator color="#000" />
          ) : (
            <Text style={[mStyles.ctaText, { color: "#000" }]}>
              CHOOSE A PLAN
            </Text>
          )}
        </TouchableOpacity>
      )}
      <Text style={mStyles.disclaimer}>
        Available as Lifetime, Yearly, or Monthly. Auto-renewing subscriptions
        cancel anytime. Billing via Google Play.
      </Text>
    </NeonModal>
  );
}

function PassPerk({
  icon,
  text,
  color,
}: {
  icon: string;
  text: string;
  color: string;
}) {
  return (
    <View style={mStyles.perkRow}>
      <View
        style={[
          mStyles.perkIcon,
          { backgroundColor: color + "22", borderColor: color + "55" },
        ]}
      >
        <Icon name={icon as any} size={16} color={color} />
      </View>
      <Text style={mStyles.perkText}>{text}</Text>
    </View>
  );
}

// =============================================================================
// GRID LOCKED / GAME OVER
// =============================================================================
export function GameOverModal({
  visible,
  score,
  highScore,
  onWatchAd,
  onContinue,
  onRestart,
  onBuyPass,
  passActive,
  loadingAd,
}: {
  visible: boolean;
  score: number;
  highScore: number;
  onWatchAd: () => void;
  onContinue: () => void;
  onRestart: () => void;
  onBuyPass: () => void;
  passActive: boolean;
  loadingAd: boolean;
}) {
  return (
    <NeonModal
      visible={visible}
      title="GRID LOCKED"
      borderColor="#ff0033"
      dismissable={false}
    >
      <View style={mStyles.gameOverStats}>
        <View style={mStyles.statBlock}>
          <Text style={mStyles.statLabel}>SCORE</Text>
          <Text style={mStyles.statValue}>{score.toLocaleString()}</Text>
        </View>
        <View style={mStyles.statBlock}>
          <Text style={mStyles.statLabel}>BEST</Text>
          <Text style={[mStyles.statValue, { color: "#ffbe0b" }]}>
            {highScore.toLocaleString()}
          </Text>
        </View>
      </View>
      <TouchableOpacity
        style={[mStyles.cta, { backgroundColor: "#06ffa5" }]}
        onPress={onWatchAd}
        disabled={loadingAd}
        testID="gameover-watch-ad"
      >
        {loadingAd ? (
          <ActivityIndicator color="#000" />
        ) : (
          <>
            <Icon name="play-circle" size={20} color="#000" />
            <Text style={[mStyles.ctaText, { color: "#000", marginLeft: 6 }]}>
              WATCH AD — CONTINUE
            </Text>
          </>
        )}
      </TouchableOpacity>
      <TouchableOpacity
        style={[mStyles.cta, { backgroundColor: "#3a86ff" }]}
        onPress={onContinue}
        testID="gameover-continue"
      >
        <Text style={mStyles.ctaText}>CONTINUE (50 COINS)</Text>
      </TouchableOpacity>
      {!passActive && (
        <TouchableOpacity
          style={[mStyles.cta, { backgroundColor: "#ffbe0b" }]}
          onPress={onBuyPass}
          testID="gameover-buy-pass"
        >
          <Icon name="star" size={16} color="#000" />
          <Text style={[mStyles.ctaText, { color: "#000", marginLeft: 6 }]}>
            UNLOCK PRO
          </Text>
        </TouchableOpacity>
      )}
      <TouchableOpacity
        style={[mStyles.cta, mStyles.ctaSecondary]}
        onPress={onRestart}
        testID="gameover-restart"
      >
        <Text style={[mStyles.ctaText, { color: "#aaa" }]}>RESTART</Text>
      </TouchableOpacity>
    </NeonModal>
  );
}

// =============================================================================
// ENERGY MODAL
// =============================================================================
export function EnergyModal({
  visible,
  coins,
  onRefillCoins,
  onWatchAd,
  onClose,
  onBuyPass,
  passActive,
  loadingAd,
}: {
  visible: boolean;
  coins: number;
  onRefillCoins: () => void;
  onWatchAd: () => void;
  onClose: () => void;
  onBuyPass: () => void;
  passActive: boolean;
  loadingAd: boolean;
}) {
  return (
    <NeonModal
      visible={visible}
      onClose={onClose}
      title="OUT OF ENERGY"
      borderColor="#06ffa5"
    >
      <Text style={mStyles.subtitle}>
        Refill your energy to keep playing.
      </Text>
      <TouchableOpacity
        style={[mStyles.cta, { backgroundColor: "#06ffa5" }]}
        onPress={onWatchAd}
        disabled={loadingAd}
        testID="energy-watch-ad"
      >
        {loadingAd ? (
          <ActivityIndicator color="#000" />
        ) : (
          <>
            <Icon name="play-circle" size={20} color="#000" />
            <Text style={[mStyles.ctaText, { color: "#000", marginLeft: 6 }]}>
              WATCH AD — FREE REFILL
            </Text>
          </>
        )}
      </TouchableOpacity>
      <TouchableOpacity
        style={[
          mStyles.cta,
          { backgroundColor: coins >= 40 ? "#3a86ff" : "#222" },
        ]}
        disabled={coins < 40}
        onPress={onRefillCoins}
        testID="energy-refill-coins"
      >
        <Icon name="cash" size={16} color="#fff" />
        <Text style={[mStyles.ctaText, { marginLeft: 6 }]}>
          40 COINS — REFILL
        </Text>
      </TouchableOpacity>
      {!passActive && (
        <TouchableOpacity
          style={[mStyles.cta, { backgroundColor: "#ffbe0b" }]}
          onPress={onBuyPass}
          testID="energy-buy-pass"
        >
          <Icon name="star" size={16} color="#000" />
          <Text style={[mStyles.ctaText, { color: "#000", marginLeft: 6 }]}>
            UNLIMITED — UNLOCK PRO
          </Text>
        </TouchableOpacity>
      )}
    </NeonModal>
  );
}

// =============================================================================
// SETTINGS
// =============================================================================
export function SettingsModal({
  visible,
  onClose,
  sfxOn,
  musicOn,
  hapticsOn,
  toggleSfx,
  toggleMusic,
  toggleHaptics,
  onRestart,
  onResetAllData,
  onManageSubscription,
  onUpdateAdConsent,
}: {
  visible: boolean;
  onClose: () => void;
  sfxOn: boolean;
  musicOn: boolean;
  hapticsOn: boolean;
  toggleSfx: () => void;
  toggleMusic: () => void;
  toggleHaptics: () => void;
  onRestart: () => void;
  onResetAllData: () => void;
  onManageSubscription?: () => void;
  onUpdateAdConsent?: () => void;
}) {
  const confirmResetAllData = () => {
    haptic.warning?.();
    Alert.alert(
      "Reset All Data?",
      "This will permanently erase your high score, coins, energy, undos, daily streak, settings and unlock progress.\n\nThis cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Erase Everything",
          style: "destructive",
          onPress: () => {
            haptic.error();
            onResetAllData();
          },
        },
      ],
    );
  };
  return (
    <NeonModal
      visible={visible}
      onClose={onClose}
      title="SETTINGS"
      borderColor="#8338ec"
    >
      <SettingsRow
        icon="volume-high"
        label="Sound Effects"
        on={sfxOn}
        onToggle={toggleSfx}
        testID="settings-sfx"
      />
      <SettingsRow
        icon="musical-notes"
        label="Music"
        on={musicOn}
        onToggle={toggleMusic}
        testID="settings-music"
      />
      <SettingsRow
        icon="phone-portrait"
        label="Haptics"
        on={hapticsOn}
        onToggle={toggleHaptics}
        testID="settings-haptics"
      />
      <View style={mStyles.aboutBlock}>
        <Text style={mStyles.aboutTitle}>Tetris Architect v1.0.0</Text>
        <Text style={mStyles.aboutSubtitle}>by wispersofthepast</Text>
        <View style={mStyles.aboutLinks}>
          <TouchableOpacity
            onPress={() =>
              Linking.openURL(
                "https://htmlpreview.github.io/?https://github.com/wispersofthepastprints-prog/GeoffreyChapman/blob/main/privacy-policy.html"
              ).catch(() => {})
            }
            testID="settings-privacy"
          >
            <Text style={mStyles.aboutLink}>Privacy Policy</Text>
          </TouchableOpacity>
          <Text style={mStyles.aboutDot}>·</Text>
          <TouchableOpacity
            onPress={() =>
              Linking.openURL(
                "https://htmlpreview.github.io/?https://github.com/wispersofthepastprints-prog/GeoffreyChapman/blob/main/terms-of-service.html"
              ).catch(() => {})
            }
            testID="settings-terms"
          >
            <Text style={mStyles.aboutLink}>Terms of Service</Text>
          </TouchableOpacity>
        </View>
      </View>
      {onManageSubscription && (
        <TouchableOpacity
          style={[mStyles.cta, { backgroundColor: "#3a86ff", marginTop: 4 }]}
          onPress={() => {
            haptic.selection();
            onManageSubscription();
          }}
          testID="settings-manage-sub"
        >
          <Icon name="diamond" size={16} color="#fff" />
          <Text style={[mStyles.ctaText, { marginLeft: 6 }]}>
            MANAGE SUBSCRIPTION
          </Text>
        </TouchableOpacity>
      )}
      {onUpdateAdConsent && (
        <TouchableOpacity
          style={[mStyles.cta, { backgroundColor: "rgba(58,134,255,0.18)", marginTop: 4, borderWidth: 1, borderColor: "rgba(58,134,255,0.4)" }]}
          onPress={() => {
            haptic.selection();
            onUpdateAdConsent();
          }}
          testID="settings-ad-consent"
        >
          <Icon name="settings-outline" size={16} color="#3a86ff" />
          <Text style={[mStyles.ctaText, { marginLeft: 6, color: "#3a86ff" }]}>
            AD PRIVACY OPTIONS
          </Text>
        </TouchableOpacity>
      )}
      <TouchableOpacity
        style={[mStyles.cta, { backgroundColor: "#ff0033", marginTop: 8 }]}
        onPress={() => {
          haptic.error();
          onRestart();
        }}
        testID="settings-restart"
      >
        <Icon name="refresh" size={16} color="#fff" />
        <Text style={[mStyles.ctaText, { marginLeft: 6 }]}>RESTART GAME</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[mStyles.cta, mStyles.ctaDanger, { marginTop: 8 }]}
        onPress={confirmResetAllData}
        testID="settings-reset-all"
      >
        <Icon name="trash" size={16} color="#ff5577" />
        <Text style={[mStyles.ctaText, { marginLeft: 6, color: "#ff5577" }]}>
          RESET ALL DATA
        </Text>
      </TouchableOpacity>
      <Text style={mStyles.resetHint}>
        Permanently erase all progress, scores, coins &amp; settings.
      </Text>
    </NeonModal>
  );
}

function SettingsRow({
  icon,
  label,
  on,
  onToggle,
  testID,
}: {
  icon: string;
  label: string;
  on: boolean;
  onToggle: () => void;
  testID: string;
}) {
  return (
    <TouchableOpacity
      style={mStyles.settingsRow}
      onPress={() => {
        haptic.selection();
        onToggle();
      }}
      testID={testID}
    >
      <Icon name={icon as any} size={20} color="#aaa" />
      <Text style={mStyles.settingsLabel}>{label}</Text>
      <View
        style={[
          mStyles.toggleTrack,
          { backgroundColor: on ? "#06ffa5" : "#333" },
        ]}
      >
        <View
          style={[
            mStyles.toggleKnob,
            { transform: [{ translateX: on ? 18 : 0 }] },
          ]}
        />
      </View>
    </TouchableOpacity>
  );
}

const mStyles = StyleSheet.create({
  hero: {
    width: "100%",
    height: 110,
    marginBottom: 4,
  },
  subtitle: {
    color: "#aaa",
    fontSize: 13,
    textAlign: "center",
    marginBottom: 14,
  },
  daysGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    justifyContent: "center",
    marginBottom: 12,
  },
  dayCell: {
    width: 78,
    height: 70,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "#222",
    alignItems: "center",
    justifyContent: "center",
    padding: 4,
  },
  dayCellClaimed: {
    borderColor: "#06ffa5",
    backgroundColor: "rgba(6,255,165,0.08)",
  },
  dayCellToday: {
    borderColor: "#ffbe0b",
    backgroundColor: "rgba(255,190,11,0.1)",
    boxShadow: "0 0 10px rgba(255,190,11,0.55)",
  },
  dayLabel: {
    color: "#999",
    fontSize: 10,
    fontWeight: "700",
    marginBottom: 2,
  },
  dayAmount: {
    color: "#bbb",
    fontSize: 13,
    fontWeight: "900",
    marginTop: 2,
  },
  cta: {
    flexDirection: "row",
    height: 50,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
    paddingHorizontal: 14,
  },
  ctaSecondary: {
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  ctaDanger: {
    backgroundColor: "transparent",
    borderWidth: 1.5,
    borderColor: "#ff5577",
  },
  resetHint: {
    color: "#555",
    fontSize: 10,
    textAlign: "center",
    marginTop: 4,
    fontStyle: "italic",
  },
  ctaText: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 14,
    letterSpacing: 0.6,
  },
  shopHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    paddingVertical: 8,
  },
  shopImg: {
    width: 64,
    height: 64,
  },
  coinBal: {
    color: "#ffbe0b",
    fontSize: 22,
    fontWeight: "900",
  },
  coinLabel: {
    color: "#666",
    fontSize: 10,
    letterSpacing: 1.5,
    fontWeight: "700",
    marginTop: 2,
  },
  shopItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderRadius: 12,
    marginBottom: 6,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  shopIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  shopItemName: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
  shopItemSub: {
    color: "#777",
    fontSize: 11,
    marginTop: 2,
  },
  shopPrice: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255,190,11,0.12)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  shopPriceText: {
    color: "#ffbe0b",
    fontWeight: "800",
    fontSize: 13,
  },
  passUpsell: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    backgroundColor: "rgba(255,190,11,0.06)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,190,11,0.2)",
    marginTop: 8,
  },
  passUpsellText: {
    color: "#ffbe0b",
    fontSize: 12,
    fontWeight: "700",
    flex: 1,
  },
  passHero: {
    width: "100%",
    height: 140,
    borderRadius: 12,
    marginBottom: 8,
  },
  passTitle: {
    color: "#ffbe0b",
    fontSize: 22,
    fontWeight: "900",
    textAlign: "center",
    marginVertical: 4,
  },
  perkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 4,
  },
  perkIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  perkText: {
    color: "#eee",
    fontSize: 14,
    fontWeight: "600",
  },
  disclaimer: {
    color: "#555",
    fontSize: 10,
    textAlign: "center",
    marginTop: 8,
  },
  gameOverStats: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginVertical: 12,
  },
  statBlock: {
    alignItems: "center",
  },
  statLabel: {
    color: "#666",
    fontSize: 10,
    letterSpacing: 1.5,
    fontWeight: "700",
  },
  statValue: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "900",
    marginTop: 4,
  },
  settingsRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 6,
    gap: 14,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)",
  },
  settingsLabel: {
    color: "#eee",
    fontSize: 14,
    fontWeight: "600",
    flex: 1,
  },
  toggleTrack: {
    width: 40,
    height: 22,
    borderRadius: 11,
    padding: 2,
    justifyContent: "center",
  },
  toggleKnob: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#fff",
  },
  aboutBlock: {
    alignItems: "center",
    paddingVertical: 14,
    marginTop: 6,
  },
  aboutTitle: {
    color: "#aaa",
    fontSize: 12,
    fontWeight: "700",
  },
  aboutSubtitle: {
    color: "#555",
    fontSize: 10,
    marginTop: 2,
  },
  aboutLinks: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
  },
  aboutLink: {
    color: "#3a86ff",
    fontSize: 11,
    fontWeight: "700",
  },
  aboutDot: {
    color: "#444",
    fontSize: 11,
  },
});
