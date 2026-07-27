import Feather from "react-native-vector-icons/Feather";
import React from "react";
import {
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";
import { useSettings } from "@/contexts/SettingsContext";

const sections = [
  {
    icon: "database" as const,
    title: "Information We Collect",
    body:
      "THB collects information you provide directly, including your name, phone number, and delivery addresses. When you place orders, we collect order details, payment method (not full card numbers), selected branch, and order preferences. We also collect device identifiers and app usage analytics to improve your experience.",
  },
  {
    icon: "cpu" as const,
    title: "How We Use Your Information",
    body:
      "Your information is used to:\n• Process and fulfil your food orders\n• Manage your loyalty points balance\n• Send order status notifications\n• Improve our menu, app, and services\n• Respond to customer support requests\n• Comply with legal obligations\n\nWe do not sell, rent, or trade your personal information to third parties for marketing purposes.",
  },
  {
    icon: "share-2" as const,
    title: "Information Sharing",
    body:
      "We share your information only in limited circumstances:\n• With THB branch staff to fulfil your order\n• With delivery riders (name, phone, address) for delivery orders\n• With payment processors for transaction completion\n• With legal authorities when required by law\n\nAll third-party partners are bound by confidentiality agreements.",
  },
  {
    icon: "smartphone" as const,
    title: "Data Storage & Security",
    body:
      "Your data is stored locally on your device using secure encrypted storage. Order and account data transmitted to our servers is protected using industry-standard TLS/SSL encryption. We retain your order history for 24 months. Loyalty points and account data are retained for the duration of your account.",
  },
  {
    icon: "bell" as const,
    title: "Push Notifications",
    body:
      "With your permission, THB sends push notifications for order status updates, exclusive deals, and loyalty point milestones. You can control notification preferences at any time from the app settings or your device's notification settings.",
  },
  {
    icon: "map-pin" as const,
    title: "Location Data",
    body:
      "THB does not automatically collect GPS location data. Delivery addresses you manually enter are stored only for order processing. You can add, edit, or remove saved addresses at any time from your profile.",
  },
  {
    icon: "user" as const,
    title: "Your Rights",
    body:
      "You have the right to:\n• Access the personal information we hold about you\n• Correct inaccurate or incomplete information\n• Request deletion of your account and data\n• Opt out of marketing communications\n• Request a copy of your data\n\nTo exercise any of these rights, contact us at privacy@thehungerbite.com or call 0312-2787385.",
  },
  {
    icon: "users" as const,
    title: "Children's Privacy",
    body:
      "THB does not knowingly collect personal information from children under 13 years of age. If you believe your child has provided us with personal data, please contact us immediately and we will delete the information.",
  },
  {
    icon: "refresh-cw" as const,
    title: "Changes to this Policy",
    body:
      "THB may update this Privacy Policy periodically. Significant changes will be notified through the app. Continued use of the THB app after changes are posted constitutes your acceptance of the updated policy.",
  },
  {
    icon: "phone" as const,
    title: "Contact Us",
    body:
      "For privacy-related questions, requests, or concerns:\n\nTHB Privacy Officer\nPhone: 0312-2787385\nEmail: privacy@thehungerbite.com\nTHB Pakistan Head Office, Karachi\n\nWe will respond to all requests within 14 business days.",
  },
];

export default function PrivacyScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { settings } = useSettings();

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[
        styles.content,
        { paddingBottom: (Platform.OS === "web" ? 34 : insets.bottom) + 24 },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header Block */}
      <View style={[styles.headerBlock, { backgroundColor: '#F0FFF4', borderColor: colors.primary }]}>
        <View style={[styles.headerIcon, { backgroundColor: colors.primary, borderRadius: 50 }]}>
          <Feather name="shopping-bag" size={20} color="#FFD700" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, { color: "#E53E3E" }]}>THB Pakistan</Text>
          <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>
            Official Privacy Policy • The Hunger Bite Istanbul
          </Text>
        </View>
      </View>

      <Text style={[styles.intro, { color: colors.mutedForeground }]}>
        THB (The Hunger Bite Istanbul) is committed to protecting your privacy. This policy explains how we collect, use, and safeguard your personal information when you use our app.
      </Text>

      {sections.map((section) => (
        <View
          key={section.title}
          style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIconBox, { backgroundColor: colors.lightGreen }]}>
              <Feather name={section.icon} size={15} color={colors.primary} />
            </View>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{section.title}</Text>
          </View>
          <Text style={[styles.sectionBody, { color: colors.mutedForeground }]}>{section.body.replace('0312-2787385', settings.storePhone)}</Text>
        </View>
      ))}

      <View style={styles.signatureContainer}>
        <Text style={[styles.signatureText, { color: colors.foreground }]}>Enjoy our signature</Text>
        <Text style={[styles.zingerTitle, { color: colors.primary }]}>ZINGER BURGER</Text>
        <Image 
          source={{ uri: 'https://placeholder-url-to-your-zinger-burger-img.png' }} 
          style={styles.signatureImage}
          resizeMode="contain"
        />
        <View style={[styles.footer, { borderTopColor: colors.border, width: '100%' }]}>
          <Feather name="lock" size={14} color={colors.mutedForeground} />
          <Text style={[styles.footerText, { color: colors.mutedForeground }]}>
            Your data is protected. THB Pakistan © 2025.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    padding: 16,
    gap: 2,
  },
  headerBlock: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 16,
  },
  headerIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    marginBottom: 2,
  },
  headerSub: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
  intro: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    lineHeight: 20,
    marginBottom: 14,
  },
  section: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },
  sectionIconBox: {
    width: 32,
    height: 32,
    borderRadius: 9,
    justifyContent: "center",
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
    flex: 1,
  },
  sectionBody: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    lineHeight: 20,
  },
  signatureContainer: {
    alignItems: 'center',
    marginTop: 20,
    paddingTop: 20,
    gap: 8,
  },
  signatureText: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
  },
  zingerTitle: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
    letterSpacing: 1,
  },
  signatureImage: {
    width: 200,
    height: 120,
    marginBottom: 10,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingTop: 20,
    borderTopWidth: 1,
    marginTop: 8,
  },
  footerText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
});
