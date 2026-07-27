import Feather from "react-native-vector-icons/Feather";
import LinearGradient from "react-native-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import React, { useEffect, useRef, useState } from "react";
import { launchImageLibrary, MediaType } from "react-native-image-picker";
import {
  Alert,
  Animated,
  Image,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  LOYALTY_TIERS,
  MAX_LOYALTY_POINTS,
  SavedAddress,
  useAuth,
} from "@/contexts/AuthContext";

import { useLanguage } from "@/contexts/LanguageContext";
import { useOrders } from "@/contexts/OrderContext";
import { useSettings } from "@/contexts/SettingsContext";
import { useColors } from "@/hooks/useColors";

const LABEL_ICONS: Record<
  SavedAddress["label"],
  React.ComponentProps<typeof Feather>["name"]
> = {
  Home: "home",
  Work: "briefcase",
  Other: "map-pin",
};

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const {
    user,
    signOut,
    removeAddress,
    setDefaultAddress,
    uploadProfilePic,
    availableTier,
  } = useAuth();
  const { orders } = useOrders();
  const { language, setLanguage, t } = useLanguage();
  const { settings } = useSettings();
  const [notifications, setNotifications] = useState(true);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        damping: 18,
        stiffness: 120,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;
  const totalSpend = orders.reduce((s, o) => s + o.total, 0);
  const points = user?.loyaltyPoints ?? 0;
  const pointsPct = Math.min((points / MAX_LOYALTY_POINTS) * 100, 100);

  const handleSignOut = () => {
    Alert.alert(
      t("signOut"),
      language === "ur"
        ? "کیا آپ واقعی سائن آؤٹ کرنا چاہتے ہیں؟"
        : "Are you sure you want to sign out?",
      [
        { text: language === "ur" ? "رد کریں" : "Cancel", style: "cancel" },
        { text: t("signOut"), style: "destructive", onPress: () => signOut() },
      ],
    );
  };

  const handleContact = () => {
    Alert.alert(
      language === "ur" ? "THB کو کال کریں" : "Call THB",
      `${language === "ur" ? "کیا آپ THB کو کال کرنا چاہتے ہیں؟" : "Would you like to call THB?"}\n\n📞 ${settings.storePhone}`,
      [
        { text: language === "ur" ? "رد کریں" : "Cancel", style: "cancel" },
        {
          text: language === "ur" ? "کال کریں" : "Call Now",
          onPress: () => Linking.openURL(`tel:${settings.storePhone}`),
        },
      ],
    );
  };

  const handlePickProfilePic = async () => {
    const result = await launchImageLibrary({ mediaType: "photo", selectionLimit: 1 });
    if (result.assets?.length) {
      const uri = result.assets[0].uri;
      if (uri) await uploadProfilePic(uri);
    }
  };

  const handleRemoveAddress = (id: string) => {
    Alert.alert(
      language === "ur" ? "پتہ ہٹائیں" : "Remove Address",
      language === "ur"
        ? "کیا اس پتے کو ہٹانا ہے؟"
        : "Remove this saved address?",
      [
        { text: language === "ur" ? "رد کریں" : "Cancel", style: "cancel" },
        {
          text: language === "ur" ? "ہٹائیں" : "Remove",
          style: "destructive",
          onPress: () => removeAddress(id),
        },
      ],
    );
  };

  const handleLanguageToggle = () => {
    Alert.alert(
      t("language"),
      language === "ur" ? "زبان منتخب کریں" : "Select Language",
      [
        { text: "English", onPress: () => setLanguage("en") },
        { text: "اردو", onPress: () => setLanguage("ur") },
        { text: language === "ur" ? "رد کریں" : "Cancel", style: "cancel" },
      ],
    );
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: bottomPad + 90 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <LinearGradient
        colors={["#1B0000", "#8B0000", "#C8102E"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerGlow} />
        <View style={styles.headerGlow2} />
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
            alignItems: "center",
          }}
        >
          <TouchableOpacity
            onPress={user ? handlePickProfilePic : undefined}
            style={styles.avatarCircle}
            activeOpacity={0.8}
          >
            {user ? (
              user.profilePicUrl ? (
                <Image
                  source={{ uri: user.profilePicUrl }}
                  style={styles.avatarImage}
                />
              ) : (
                <Text style={[styles.avatarInitial, { color: colors.primary }]}>
                  {user.name.charAt(0).toUpperCase()}
                </Text>
              )
            ) : (
              <Feather name="user" size={34} color={colors.primary} />
            )}
            {user && (
              <View style={styles.cameraOverlay}>
                <Feather name="camera" size={12} color="#FFFFFF" />
              </View>
            )}
          </TouchableOpacity>
          {user ? (
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{user.name}</Text>
              <Text style={styles.userPhone}>{user.phone}</Text>

              <TouchableOpacity
                onPress={handleSignOut}
                style={styles.signOutChip}
              >
                <Feather
                  name="log-out"
                  size={12}
                  color="rgba(255,255,255,0.8)"
                />
                <Text style={styles.signOutText}>{t("signOut")}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.guestInfo}>
              <Text style={styles.guestName}>{t("guest")}</Text>
              <Text style={styles.guestSubtitle}>
                {language === "ur"
                  ? "آرڈر کرنے کے لیے سائن ان کریں"
                  : "Sign in to save your orders"}
              </Text>
              <TouchableOpacity
                style={styles.signInBtn}
                onPress={() => (navigation as any).navigate("Login")}
              >
                <Feather name="log-in" size={14} color="#C8102E" />
                <Text style={styles.signInText}>{t("signIn")}</Text>
              </TouchableOpacity>
            </View>
          )}
        </Animated.View>
      </LinearGradient>

      {/* Stats */}
      <View
        style={[
          styles.statsRow,
          { backgroundColor: colors.card, borderBottomColor: colors.border },
        ]}
      >
        {[
          { value: String(orders.length), label: t("orders") },
          {
            value: totalSpend > 0 ? `${Math.round(totalSpend / 1000)}k` : "0",
            label: language === "ur" ? "خرچ (Rs.)" : "Spent (Rs.)",
          },
          { value: String(points), label: t("loyaltyPoints") },
        ].map((stat, idx, arr) => (
          <React.Fragment key={stat.label}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.primary }]}>
                {stat.value}
              </Text>
              <Text
                style={[styles.statLabel, { color: colors.mutedForeground }]}
              >
                {stat.label}
              </Text>
            </View>
            {idx < arr.length - 1 && (
              <View
                style={[styles.statDivider, { backgroundColor: colors.border }]}
              />
            )}
          </React.Fragment>
        ))}
      </View>

      {/* Loyalty Points Card */}
      {user && (
        <Animated.View style={[styles.section, { opacity: fadeAnim }]}>
          <Text
            style={[styles.sectionTitle, { color: colors.mutedForeground }]}
          >
            {language === "ur" ? "لائلٹی پروگرام" : "LOYALTY PROGRAMME"}
          </Text>
          <View
            style={[styles.loyaltyCard, { borderColor: colors.primary + "40" }]}
          >
            <LinearGradient
              colors={[colors.darkGreen, colors.primary]}
              style={styles.loyaltyGradient}
            >
              <View style={styles.loyaltyTop}>
                <View>
                  <Text style={styles.loyaltyTitle}>{t("yourPoints")}</Text>
                  <View style={styles.loyaltyPointsRow}>
                    <Text style={styles.loyaltyPoints}>{points}</Text>
                    <Text style={styles.loyaltyMax}>/{MAX_LOYALTY_POINTS}</Text>
                  </View>
                </View>
                <View style={styles.loyaltyStarBox}>
                  <Feather name="star" size={28} color="#FFD700" />
                </View>
              </View>

              {/* Progress bar */}
              <View style={styles.progressTrack}>
                <Animated.View
                  style={[
                    styles.progressFill,
                    { width: `${pointsPct}%` as any },
                  ]}
                />
              </View>

              {/* Tier markers */}
              <View style={styles.tierRow}>
                {LOYALTY_TIERS.map((tier) => {
                  const unlocked = points >= tier.points;
                  return (
                    <View key={tier.points} style={styles.tierItem}>
                      <View
                        style={[
                          styles.tierDot,
                          {
                            backgroundColor: unlocked
                              ? "#FFD700"
                              : "rgba(255,255,255,0.3)",
                          },
                        ]}
                      >
                        {unlocked && (
                          <Feather
                            name="check"
                            size={9}
                            color={colors.primary}
                          />
                        )}
                      </View>
                      <Text
                        style={[
                          styles.tierLabel,
                          {
                            color: unlocked
                              ? "#FFD700"
                              : "rgba(255,255,255,0.55)",
                          },
                        ]}
                      >
                        {tier.points}pts
                      </Text>
                      <Text
                        style={[
                          styles.tierDiscount,
                          {
                            color: unlocked
                              ? "#FFFFFF"
                              : "rgba(255,255,255,0.4)",
                          },
                        ]}
                      >
                        {tier.label}
                      </Text>
                    </View>
                  );
                })}
              </View>

              {availableTier ? (
                <View style={styles.redeemBanner}>
                  <Feather name="gift" size={14} color="#FFD700" />
                  <Text style={styles.redeemText}>
                    {language === "ur"
                      ? `${availableTier.label} کی چھوٹ دستیاب ہے!`
                      : `${availableTier.label} discount available at checkout!`}
                  </Text>
                </View>
              ) : (
                <Text style={styles.earnMoreText}>
                  {language === "ur"
                    ? `${50 - points > 0 ? 50 - points : 0} مزید پوائنٹس ${LOYALTY_TIERS[0].label} کی چھوٹ کے لیے`
                    : `${Math.max(0, 50 - points)} more points for ${LOYALTY_TIERS[0].label} off`}
                </Text>
              )}
            </LinearGradient>

            {/* Earn info */}
            <View style={[styles.earnInfo, { backgroundColor: colors.card }]}>
              <Feather name="info" size={13} color={colors.mutedForeground} />
              <Text
                style={[styles.earnInfoText, { color: colors.mutedForeground }]}
              >
                {language === "ur"
                  ? "ہر Rs. 100 خرچ کرنے پر 1 پوائنٹ ملتا ہے"
                  : "Earn 1 point per Rs. 100 spent • Max 100 points • Redeem at checkout"}
              </Text>
            </View>
          </View>
        </Animated.View>
      )}

      {/* Delivery Addresses */}
      <View style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <Text
            style={[styles.sectionTitle, { color: colors.mutedForeground }]}
          >
            {language === "ur" ? "ڈیلیوری پتے" : "DELIVERY ADDRESSES"}
          </Text>
          {user && (
            <TouchableOpacity
              onPress={() => (navigation as any).navigate("Add-Address")}
              style={[styles.addBtn, { backgroundColor: colors.lightGreen }]}
            >
              <Feather name="plus" size={12} color={colors.primary} />
              <Text style={[styles.addBtnText, { color: colors.primary }]}>
                {language === "ur" ? "شامل کریں" : "Add"}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {!user ? (
          <TouchableOpacity
            onPress={() => (navigation as any).navigate("Login")}
            style={[
              styles.emptyCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Feather name="lock" size={18} color={colors.mutedForeground} />
            <Text
              style={[styles.emptyCardText, { color: colors.mutedForeground }]}
            >
              {language === "ur"
                ? "پتے محفوظ کرنے کے لیے سائن ان کریں"
                : "Sign in to save delivery addresses"}
            </Text>
            <Feather
              name="chevron-right"
              size={15}
              color={colors.mutedForeground}
            />
          </TouchableOpacity>
        ) : user.addresses.length === 0 ? (
          <TouchableOpacity
            onPress={() => (navigation as any).navigate("Add-Address")}
            style={[
              styles.emptyCard,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                borderStyle: "dashed",
              },
            ]}
          >
            <Feather name="plus-circle" size={18} color={colors.primary} />
            <Text
              style={[styles.emptyCardText, { color: colors.mutedForeground }]}
            >
              {language === "ur"
                ? "ڈیلیوری کے لیے پتہ شامل کریں"
                : "Add an address for quick delivery"}
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={[styles.addrList, { borderColor: colors.border }]}>
            {user.addresses.map((addr, idx) => (
              <View
                key={addr.id}
                style={[
                  styles.addrCard,
                  {
                    backgroundColor: addr.isDefault
                      ? colors.lightGreen
                      : colors.card,
                    borderBottomColor: colors.border,
                    borderBottomWidth: idx < user.addresses.length - 1 ? 1 : 0,
                  },
                ]}
              >
                <View
                  style={[
                    styles.addrIcon,
                    {
                      backgroundColor: addr.isDefault
                        ? colors.primary
                        : colors.muted,
                    },
                  ]}
                >
                  <Feather
                    name={LABEL_ICONS[addr.label]}
                    size={15}
                    color={addr.isDefault ? "#FFF" : colors.mutedForeground}
                  />
                </View>
                <View style={styles.addrContent}>
                  <View style={styles.addrTopRow}>
                    <Text
                      style={[styles.addrLabel, { color: colors.foreground }]}
                    >
                      {addr.label}
                    </Text>
                    {addr.isDefault && (
                      <View
                        style={[
                          styles.defaultBadge,
                          { backgroundColor: colors.primary },
                        ]}
                      >
                        <Text style={styles.defaultBadgeText}>
                          {language === "ur" ? "ڈیفالٹ" : "Default"}
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text
                    style={[styles.addrText, { color: colors.mutedForeground }]}
                    numberOfLines={2}
                  >
                    {addr.address}
                  </Text>
                </View>
                <View style={styles.addrActions}>
                  {!addr.isDefault && (
                    <TouchableOpacity
                      onPress={() => setDefaultAddress(addr.id)}
                      style={[styles.addrBtn, { borderColor: colors.border }]}
                    >
                      <Feather
                        name="star"
                        size={12}
                        color={colors.mutedForeground}
                      />
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    onPress={() =>
                      (navigation as any).navigate("Add-Address", { editId: addr.id })
                    }
                    style={[styles.addrBtn, { borderColor: colors.border }]}
                  >
                    <Feather
                      name="edit-2"
                      size={12}
                      color={colors.mutedForeground}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleRemoveAddress(addr.id)}
                    style={[styles.addrBtn, { borderColor: "#FECACA" }]}
                  >
                    <Feather name="trash-2" size={12} color="#DC2626" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Settings */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>
          {language === "ur" ? "ترتیبات" : "SETTINGS"}
        </Text>
        <View style={[styles.menuCard, { borderColor: colors.border }]}>
          <SettingRow
            icon="bell"
            label={t("notifications")}
            colors={colors}
            rightElement={
              <Switch
                value={notifications}
                onValueChange={setNotifications}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="#FFF"
              />
            }
          />
          <SettingRow
            icon="globe"
            label={t("language")}
            value={language === "en" ? "English" : "اردو"}
            colors={colors}
            onPress={handleLanguageToggle}
            rightBadge={language === "ur" ? "اردو" : undefined}
          />
        </View>
      </View>

      {/* About */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>
          {t("about")}
        </Text>
        <View style={[styles.menuCard, { borderColor: colors.border }]}>
          <SettingRow
            icon="phone"
            label={t("contactUs")}
            value={settings.storePhone}
            colors={colors}
            onPress={handleContact}
          />
          <SettingRow
            icon="file-text"
            label={t("terms")}
            colors={colors}
            onPress={() => (navigation as any).navigate("Terms")}
          />
          <SettingRow
            icon="shield"
            label={t("privacy")}
            colors={colors}
            onPress={() => (navigation as any).navigate("Privacy")}
          />
          <SettingRow
            icon="star"
            label={language === "ur" ? "جائزے" : "Reviews"}
            colors={colors}
            onPress={() => (navigation as any).navigate("Reviews")}
          />
          <SettingRow
            icon="info"
            label={t("appVersion")}
            value="v1.0.0"
            colors={colors}
          />
        </View>
      </View>

      {/* Brand footer */}
      <Animated.View style={[styles.brandFooter, { opacity: fadeAnim }]}>
        <View style={[styles.brandCircleRed, { backgroundColor: "#C8102E" }]}>
          <Text style={styles.brandText}>THB</Text>
        </View>
        <Text style={[styles.brandName, { color: colors.foreground }]}>
          The Hunger Bite Istanbul
        </Text>
        <Text style={[styles.brandTagline, { color: colors.mutedForeground }]}>
          {language === "ur"
            ? "تازہ۔ کرارا۔ لذیذ۔"
            : "Fresh. Crispy. Delicious."}
        </Text>
      </Animated.View>
    </ScrollView>
  );
}

function SettingRow({
  icon,
  label,
  value,
  onPress,
  rightElement,
  rightBadge,
  colors,
}: {
  icon: React.ComponentProps<typeof Feather>["name"];
  label: string;
  value?: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
  rightBadge?: string;
  colors: ReturnType<typeof import("@/hooks/useColors").useColors>;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={onPress ? 0.65 : 1}
      style={[styles.settingRow, { borderBottomColor: colors.border }]}
    >
      <View
        style={[styles.settingIcon, { backgroundColor: colors.lightGreen }]}
      >
        <Feather name={icon} size={15} color={colors.primary} />
      </View>
      <View style={styles.settingInfo}>
        <Text style={[styles.settingLabel, { color: colors.foreground }]}>
          {label}
        </Text>
        {value ? (
          <Text
            style={[styles.settingValue, { color: colors.mutedForeground }]}
          >
            {value}
          </Text>
        ) : null}
      </View>
      {rightElement ?? (
        <View style={styles.settingRight}>
          {rightBadge && (
            <View
              style={[styles.langBadge, { backgroundColor: colors.lightGreen }]}
            >
              <Text style={[styles.langBadgeText, { color: colors.primary }]}>
                {rightBadge}
              </Text>
            </View>
          )}
          {onPress && (
            <Feather
              name="chevron-right"
              size={15}
              color={colors.mutedForeground}
            />
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    position: "relative",
    overflow: "hidden",
    padding: 24,
    paddingTop: 28,
    paddingBottom: 32,
    alignItems: "center",
  },
  headerGlow2: {
    position: "absolute",
    width: 150,
    height: 100,
    borderRadius: 100,
    backgroundColor: "rgba(200,16,46,0.08)",
    bottom: -20,
    right: -20,
    zIndex: 0,
  },
  headerGlow: {
    position: "absolute",
    width: 220,
    height: 160,
    borderRadius: 140,
    backgroundColor: "rgba(255,255,255,0.06)",
    top: -30,
    left: -40,
    transform: [{ rotate: "-8deg" }],
    zIndex: 0,
  },
  avatarCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.25)",
    boxShadow: "0 6px 12px rgba(0, 0, 0, 0.3)",
    elevation: 8,
    zIndex: 1,
  },
  avatarImage: { width: 94, height: 94, borderRadius: 47 },
  avatarInitial: { fontSize: 38, fontFamily: "Inter_700Bold" },
  cameraOverlay: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#C8102E",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  userInfo: { alignItems: "center" },
  uploadBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginVertical: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 999,
  },
  uploadBtnText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
  userName: {
    color: "#FFFFFF",
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    marginBottom: 3,
  },
  userPhone: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    marginBottom: 12,
  },
  signOutChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
  },
  signOutText: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
  guestInfo: { alignItems: "center" },
  guestName: {
    color: "#FFFFFF",
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    marginBottom: 4,
  },
  guestSubtitle: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    marginBottom: 14,
  },
  signInBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  signInText: { color: "#C8102E", fontSize: 14, fontFamily: "Inter_700Bold" },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  statItem: { flex: 1, alignItems: "center" },
  statValue: { fontSize: 22, fontFamily: "Inter_700Bold", marginBottom: 2 },
  statLabel: {
    fontSize: 10,
    fontFamily: "Inter_500Medium",
    textAlign: "center",
  },
  statDivider: { width: 1, height: 30 },
  section: { marginTop: 22, paddingHorizontal: 16 },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1.1,
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  addBtnText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  loyaltyCard: { borderRadius: 18, overflow: "hidden", borderWidth: 1.5 },
  loyaltyGradient: { padding: 18 },
  loyaltyTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 14,
  },
  loyaltyTitle: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    marginBottom: 4,
  },
  loyaltyPointsRow: { flexDirection: "row", alignItems: "baseline", gap: 4 },
  loyaltyPoints: {
    color: "#FFFFFF",
    fontSize: 36,
    fontFamily: "Inter_700Bold",
  },
  loyaltyMax: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 16,
    fontFamily: "Inter_400Regular",
  },
  loyaltyStarBox: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(255,255,255,0.12)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "rgba(255,215,0,0.3)",
  },
  progressTrack: {
    height: 6,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 3,
    marginBottom: 12,
    overflow: "hidden",
  },
  progressFill: { height: "100%", backgroundColor: "#FFD700", borderRadius: 3 },
  tierRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  tierItem: { alignItems: "center", gap: 3 },
  tierDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  tierLabel: { fontSize: 10, fontFamily: "Inter_700Bold" },
  tierDiscount: { fontSize: 9, fontFamily: "Inter_500Medium" },
  redeemBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    backgroundColor: "rgba(255,215,0,0.15)",
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: "rgba(255,215,0,0.3)",
  },
  redeemText: {
    color: "#FFD700",
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    flex: 1,
  },
  earnMoreText: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
  earnInfo: { flexDirection: "row", alignItems: "center", gap: 8, padding: 12 },
  earnInfoText: {
    flex: 1,
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    lineHeight: 16,
  },
  emptyCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
  },
  emptyCardText: {
    flex: 1,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    lineHeight: 18,
  },
  addrList: { borderRadius: 14, borderWidth: 1, overflow: "hidden" },
  addrCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 14,
    gap: 10,
  },
  addrIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 1,
  },
  addrContent: { flex: 1 },
  addrTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginBottom: 3,
  },
  addrLabel: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  defaultBadge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
  defaultBadgeText: {
    color: "#FFF",
    fontSize: 9,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.5,
  },
  addrText: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 17 },
  addrActions: {
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
    marginTop: 2,
  },
  addrBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  menuCard: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
    backgroundColor: "#FFFFFF",
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    gap: 12,
    borderBottomWidth: 1,
  },
  settingIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  settingInfo: { flex: 1 },
  settingLabel: { fontSize: 14, fontFamily: "Inter_500Medium" },
  settingValue: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 1 },
  settingRight: { flexDirection: "row", alignItems: "center", gap: 6 },
  langBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  langBadgeText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  brandFooter: { alignItems: "center", paddingVertical: 30, gap: 7 },
  brandCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  brandCircleRed: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  brandText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    letterSpacing: 2,
  },
  brandName: { fontSize: 15, fontFamily: "Inter_700Bold" },
  brandTagline: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    fontStyle: "italic",
  },
});
