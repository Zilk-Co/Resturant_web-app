import Feather from "react-native-vector-icons/Feather";
import React from "react";
import {
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
    title: "1. Acceptance of Terms",
    body:
      "By accessing and using the THB (The Hunger Bite Istanbul) mobile application, you accept and agree to be bound by these Terms and Conditions. If you do not agree to these terms, please do not use our application.",
  },
  {
    title: "2. Use of the App",
    body:
      "The THB app is intended for customers aged 13 years and above. You agree to use this application solely for the purpose of browsing our menu, placing food orders, and managing your loyalty rewards. Any misuse, including attempting to reverse-engineer the app or exploit promotions fraudulently, will result in account termination.",
  },
  {
    title: "3. Ordering & Payment",
    body:
      "All orders placed through the THB app are subject to availability and branch operating hours. Prices are displayed in Pakistani Rupees (Rs.) and include all applicable taxes. THB reserves the right to cancel or modify any order in case of item unavailability, payment failure, or suspected fraud. Cash on Delivery and digital payment options (Easypaisa, JazzCash) are accepted. Card payments are processed securely through our payment partner.",
  },
  {
    title: "4. Loyalty Programme",
    body:
      "The THB Loyalty Programme allows eligible customers to earn points with every completed order. Points are awarded at a rate of 1 point per Rs. 100 spent. Points can be redeemed for discounts: 50 points = 10% off your next order, 75 points = 15% off, and 100 points = 25% off. Points have no cash value, cannot be transferred, and expire after 12 months of account inactivity. THB reserves the right to modify or terminate the loyalty programme at any time.",
  },
  {
    title: "5. Delivery",
    body:
      "Delivery availability, radius, and timings vary by branch. Estimated delivery times are approximate and may be affected by demand, traffic, and weather conditions. THB is not liable for delays caused by circumstances beyond our control. Delivery charges are clearly displayed at checkout before order confirmation.",
  },
  {
    title: "6. Refunds & Cancellations",
    body:
      "Orders may be cancelled within 2 minutes of placement at no charge. Once an order is being prepared, cancellations may not be possible. In the event of a quality issue or incorrect order, please contact our customer service within 30 minutes of receipt. Refunds, where applicable, will be processed within 5–7 business days.",
  },
  {
    title: "7. User Account",
    body:
      "You are responsible for maintaining the confidentiality of your account information. THB is not responsible for any loss arising from unauthorised use of your account. You may update your profile information at any time through the app.",
  },
  {
    title: "8. Intellectual Property",
    body:
      "All content within the THB application — including logos, images, menu descriptions, and design elements — is the property of THB Pakistan and is protected by applicable intellectual property laws. Unauthorised reproduction or distribution is strictly prohibited.",
  },
  {
    title: "9. Limitation of Liability",
    body:
      "THB's liability is limited to the value of the specific order in dispute. We are not responsible for indirect, incidental, or consequential damages arising from use of the app. The app is provided 'as is' without warranties of any kind.",
  },
  {
    title: "10. Amendments",
    body:
      "THB reserves the right to modify these Terms and Conditions at any time. Continued use of the app following any changes constitutes acceptance of the updated terms. We recommend reviewing these terms periodically.",
  },
  {
    title: "11. Governing Law",
    body:
      "These terms are governed by and construed in accordance with the laws of Pakistan. Any disputes shall be subject to the exclusive jurisdiction of the courts of Karachi, Pakistan.",
  },
  {
    title: "12. Contact",
    body:
      "If you have any questions about these Terms and Conditions, please contact us at:\nPhone: 0312-2787385\nEmail: info@thehungerbite.com\nAddress: THB Pakistan Head Office, Karachi.",
  },
];

export default function TermsScreen() {
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
      <View style={[styles.headerBlock, { backgroundColor: colors.lightGreen, borderColor: colors.secondary }]}>
        <View style={[styles.headerIcon, { backgroundColor: colors.primary }]}>
          <Feather name="file-text" size={20} color="#FFFFFF" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, { color: colors.primary }]}>Terms & Conditions</Text>
          <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>
            Last updated: May 2025 • THB Pakistan
          </Text>
        </View>
      </View>

      <Text style={[styles.intro, { color: colors.mutedForeground }]}>
        Please read these terms carefully before using the THB app. These terms govern your use of our service and food ordering platform.
      </Text>

      {sections.map((section) => (
        <View key={section.title} style={[styles.section, { borderLeftColor: colors.primary }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{section.title}</Text>
          <Text style={[styles.sectionBody, { color: colors.mutedForeground }]}>{section.body.replace('0312-2787385', settings.storePhone)}</Text>
        </View>
      ))}

      <View style={[styles.footer, { borderTopColor: colors.border }]}>
        <Feather name="shield" size={14} color={colors.mutedForeground} />
        <Text style={[styles.footerText, { color: colors.mutedForeground }]}>
          © 2025 THB Pakistan. All rights reserved.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    padding: 16,
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
    marginBottom: 20,
  },
  section: {
    marginBottom: 18,
    paddingLeft: 12,
    borderLeftWidth: 3,
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
    marginBottom: 6,
  },
  sectionBody: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    lineHeight: 20,
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
