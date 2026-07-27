import Feather from "react-native-vector-icons/Feather";
import { useNavigation, useRoute } from "@react-navigation/native";
import React, { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { SavedAddress, useAuth } from "@/contexts/AuthContext";
import { useColors } from "@/hooks/useColors";

const LABELS: SavedAddress["label"][] = ["Home", "Work", "Other"];
const LABEL_ICONS: Record<SavedAddress["label"], React.ComponentProps<typeof Feather>["name"]> = {
  Home: "home",
  Work: "briefcase",
  Other: "map-pin",
};

export default function AddAddressScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { addAddress, updateAddress, user } = useAuth();
  const route = useRoute();
  const { editId } = route.params as { editId?: string };

  const editingAddr = editId
    ? user?.addresses.find((a) => a.id === editId)
    : undefined;

  const [label, setLabel] = useState<SavedAddress["label"]>(editingAddr?.label ?? "Home");
  const [address, setAddress] = useState(editingAddr?.address ?? "");
  const [isDefault, setIsDefault] = useState(editingAddr?.isDefault ?? false);

  const isValid = address.trim().length >= 10;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const handleSave = async () => {
    if (!isValid) return;
    if (editingAddr) {
      await updateAddress(editingAddr.id, { label, address: address.trim(), isDefault });
    } else {
      await addAddress({ label, address: address.trim(), isDefault });
    }
    navigation.goBack();
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: bottomPad + 24 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Label Selector */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.foreground }]}>Address Type</Text>
          <View style={styles.labelRow}>
            {LABELS.map((l) => (
              <TouchableOpacity
                key={l}
                onPress={() => setLabel(l)}
                style={[
                  styles.labelBtn,
                  {
                    backgroundColor: label === l ? colors.primary : colors.muted,
                    borderColor: label === l ? colors.primary : colors.border,
                  },
                ]}
              >
                <Feather
                  name={LABEL_ICONS[l]}
                  size={14}
                  color={label === l ? "#FFFFFF" : colors.mutedForeground}
                />
                <Text
                  style={[
                    styles.labelBtnText,
                    { color: label === l ? "#FFFFFF" : colors.mutedForeground },
                  ]}
                >
                  {l}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Address Input */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.foreground }]}>Full Address</Text>
          <View style={[styles.inputCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="map-pin" size={18} color={colors.primary} style={{ marginTop: 2 }} />
            <TextInput
              value={address}
              onChangeText={setAddress}
              placeholder="House/flat number, street, area, city..."
              placeholderTextColor={colors.mutedForeground}
              multiline
              numberOfLines={4}
              style={[styles.addressInput, { color: colors.foreground }]}
            />
          </View>
          <Text style={[styles.hint, { color: colors.mutedForeground }]}>
            Include landmarks to help the delivery rider
          </Text>
        </View>

        {/* Set as Default */}
        <TouchableOpacity
          onPress={() => setIsDefault((v) => !v)}
          style={[
            styles.defaultRow,
            {
              backgroundColor: colors.card,
              borderColor: isDefault ? colors.primary : colors.border,
            },
          ]}
        >
          <View style={[styles.checkbox, { borderColor: isDefault ? colors.primary : colors.border }]}>
            {isDefault && <Feather name="check" size={12} color={colors.primary} />}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.defaultLabel, { color: colors.foreground }]}>Set as default address</Text>
            <Text style={[styles.defaultSub, { color: colors.mutedForeground }]}>
              This address will be used by default for delivery orders
            </Text>
          </View>
        </TouchableOpacity>

        {/* Save Button */}
        <TouchableOpacity
          onPress={handleSave}
          disabled={!isValid}
          style={[
            styles.saveBtn,
            { backgroundColor: isValid ? colors.accent : colors.border },
          ]}
        >
          <Feather name="check" size={18} color="#FFF" />
          <Text style={styles.saveBtnText}>
            {editingAddr ? "Update Address" : "Save Address"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 16,
    gap: 4,
  },
  section: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 10,
  },
  labelRow: {
    flexDirection: "row",
    gap: 10,
  },
  labelBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  labelBtnText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  inputCard: {
    flexDirection: "row",
    gap: 10,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  addressInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    lineHeight: 21,
    padding: 0,
    minHeight: 80,
    textAlignVertical: "top",
  },
  hint: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    marginTop: 6,
    marginLeft: 2,
  },
  defaultRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    marginBottom: 24,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 1,
  },
  defaultLabel: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 2,
  },
  defaultSub: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    lineHeight: 17,
  },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    paddingVertical: 16,
    gap: 8,
    shadowColor: "#C8102E",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  saveBtnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontFamily: "Inter_700Bold",
  },
});
