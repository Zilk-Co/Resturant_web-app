import Feather from "react-native-vector-icons/Feather";
import { useNavigation } from "@react-navigation/native";
import React, { useState, useEffect, useRef } from "react";
import {
  Alert,
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

import { useAuth } from "@/contexts/AuthContext";
import { useColors } from "@/hooks/useColors";

type Mode = "login" | "signup" | "otp";

export default function LoginScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { login, signUp, verifySignup } = useAuth();

  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);
  const [signupPhone, setSignupPhone] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [devOtp, setDevOtp] = useState("");
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, []);

  function startCountdown() {
    setCountdown(60);
    countdownRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          if (countdownRef.current) clearInterval(countdownRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  const isLoginValid = username.trim().length >= 3 && password.length >= 6;
  const isSignupValid =
    name.trim().length >= 2 &&
    phone.trim().length >= 10 &&
    username.trim().length >= 3 &&
    password.length >= 6;
  const isOtpValid = otpCode.trim().length === 6;

  const handleLogin = async () => {
    if (!isLoginValid) return;
    setIsLoading(true);
    try {
      await login(username.trim(), password);
      navigation.goBack();
    } catch (err: any) {
      Alert.alert("Login Failed", err?.message || "Invalid username or password");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async () => {
    if (!isSignupValid) return;
    setIsLoading(true);
    try {
      const result = await signUp({
        phone: phone.trim(),
        username: username.trim(),
        password,
        name: name.trim(),
      });
      setSignupPhone(result.phone);
      if (result.devOtp) setDevOtp(result.devOtp);
      setMode("otp");
      startCountdown();
    } catch (err: any) {
      Alert.alert("Signup Failed", err?.message || "Could not create account");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!isOtpValid) return;
    setIsLoading(true);
    try {
      await verifySignup(signupPhone, otpCode.trim());
      navigation.goBack();
    } catch (err: any) {
      Alert.alert("Verification Failed", err?.message || "Invalid code");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (countdown > 0 || !signupPhone) return;
    setIsLoading(true);
    try {
      await signUp({
        phone: signupPhone,
        username: username.trim(),
        password,
        name: name.trim(),
      });
      startCountdown();
    } catch (err: any) {
      Alert.alert("Error", err?.message || "Failed to resend code");
    } finally {
      setIsLoading(false);
    }
  };

  const topPad = Platform.OS === "web" ? 0 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={[styles.topSection, { backgroundColor: colors.primary, paddingTop: topPad + 20 }]}>
        <View style={styles.logoArea}>
          <View style={styles.logoCircle}>
            <Text style={[styles.logoText, { color: colors.primary }]}>THB</Text>
          </View>
          <Text style={styles.brandName}>The Hunger Bite Istanbul</Text>
          <Text style={styles.brandTagline}>
            {mode === "login"
              ? "Sign in to your account"
              : mode === "signup"
              ? "Create a new account"
              : "Enter the code we sent you"}
          </Text>
        </View>
      </View>

      <ScrollView
        style={[styles.formContainer, { backgroundColor: colors.background }]}
        contentContainerStyle={[styles.formContent, { paddingBottom: bottomPad + 24 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {mode === "otp" && (
          <TouchableOpacity
            onPress={() => {
              setMode("signup");
              setOtpCode("");
              if (countdownRef.current) clearInterval(countdownRef.current);
              setCountdown(0);
            }}
            style={styles.backBtn}
          >
            <Feather name="arrow-left" size={18} color={colors.mutedForeground} />
            <Text style={[styles.backBtnText, { color: colors.mutedForeground }]}>Back to signup</Text>
          </TouchableOpacity>
        )}

        {mode !== "otp" && (
          <Text style={[styles.welcomeTitle, { color: colors.foreground }]}>
            {mode === "login" ? "Welcome Back!" : "Create Account"}
          </Text>
        )}
        {mode === "otp" && (
          <>
            <Text style={[styles.welcomeTitle, { color: colors.foreground }]}>Verify Code</Text>
            <Text style={[styles.welcomeSubtitle, { color: colors.mutedForeground }]}>
              {`We sent a 6-digit code to ${signupPhone}`}
            </Text>
            {devOtp ? (
              <View style={[styles.devOtpBanner, { backgroundColor: "#FFF3CD", borderColor: "#FFC107" }]}>
                <Feather name="info" size={16} color="#856404" />
                <Text style={styles.devOtpText}>
                  Dev mode — Your code: {devOtp}
                </Text>
              </View>
            ) : null}
          </>
        )}

        {mode === "login" && (
          <>
            <Text style={[styles.welcomeSubtitle, { color: colors.mutedForeground }]}>
              Sign in with your username and password
            </Text>

            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Username</Text>
              <View
                style={[
                  styles.inputWrapper,
                  {
                    backgroundColor: colors.card,
                    borderColor: focusedField === "username" ? colors.primary : colors.border,
                  },
                ]}
              >
                <Feather name="user" size={18} color={focusedField === "username" ? colors.primary : colors.mutedForeground} />
                <TextInput
                  value={username}
                  onChangeText={(t) => setUsername(t.replace(/[^a-zA-Z0-9_]/g, ""))}
                  onFocus={() => setFocusedField("username")}
                  onBlur={() => setFocusedField(null)}
                  placeholder="your_username"
                  placeholderTextColor={colors.mutedForeground}
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={[styles.input, { color: colors.foreground }]}
                />
                {username.length >= 3 && (
                  <Feather name="check-circle" size={16} color="#4CAF50" />
                )}
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Password</Text>
              <View
                style={[
                  styles.inputWrapper,
                  {
                    backgroundColor: colors.card,
                    borderColor: focusedField === "password" ? colors.primary : colors.border,
                  },
                ]}
              >
                <Feather name="lock" size={18} color={focusedField === "password" ? colors.primary : colors.mutedForeground} />
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  onFocus={() => setFocusedField("password")}
                  onBlur={() => setFocusedField(null)}
                  placeholder="Min. 6 characters"
                  placeholderTextColor={colors.mutedForeground}
                  secureTextEntry={!showPassword}
                  style={[styles.input, { color: colors.foreground }]}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Feather
                    name={showPassword ? "eye" : "eye-off"}
                    size={18}
                    color={colors.mutedForeground}
                  />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              onPress={handleLogin}
              disabled={!isLoginValid || isLoading}
              style={[
                styles.signInBtn,
                {
                  backgroundColor: isLoginValid ? colors.accent : colors.border,
                  opacity: isLoginValid ? 1 : 0.7,
                },
              ]}
            >
              {isLoading ? (
                <Text style={styles.signInBtnText}>Please wait...</Text>
              ) : (
                <>
                  <Text style={styles.signInBtnText}>Sign In</Text>
                  <Feather name="log-in" size={20} color="#FFF" />
                </>
              )}
            </TouchableOpacity>

            <View style={styles.dividerRow}>
              <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
              <Text style={[styles.dividerText, { color: colors.mutedForeground }]}>or</Text>
              <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
            </View>

            <TouchableOpacity
              onPress={() => setMode("signup")}
              style={[styles.switchBtn, { borderColor: colors.border }]}
            >
              <Feather name="user-plus" size={18} color={colors.primary} />
              <Text style={[styles.switchBtnText, { color: colors.primary }]}>Create New Account</Text>
            </TouchableOpacity>
          </>
        )}

        {mode === "signup" && (
          <>
            <Text style={[styles.welcomeSubtitle, { color: colors.mutedForeground }]}>
              Fill in your details to get started
            </Text>

            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Full Name</Text>
              <View
                style={[
                  styles.inputWrapper,
                  {
                    backgroundColor: colors.card,
                    borderColor: focusedField === "name" ? colors.primary : colors.border,
                  },
                ]}
              >
                <Feather name="user" size={18} color={focusedField === "name" ? colors.primary : colors.mutedForeground} />
                <TextInput
                  value={name}
                  onChangeText={setName}
                  onFocus={() => setFocusedField("name")}
                  onBlur={() => setFocusedField(null)}
                  placeholder="Muhammad Ali"
                  placeholderTextColor={colors.mutedForeground}
                  autoCapitalize="words"
                  style={[styles.input, { color: colors.foreground }]}
                />
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Phone Number</Text>
              <View
                style={[
                  styles.inputWrapper,
                  {
                    backgroundColor: colors.card,
                    borderColor: focusedField === "phone" ? colors.primary : colors.border,
                  },
                ]}
              >
                <View style={styles.phonePrefix}>
                  <Text style={[styles.phonePrefixText, { color: colors.foreground }]}>+92</Text>
                </View>
                <View style={[styles.phoneDivider, { backgroundColor: colors.border }]} />
                <TextInput
                  value={phone}
                  onChangeText={(t) => setPhone(t.replace(/\D/g, "").slice(0, 11))}
                  onFocus={() => setFocusedField("phone")}
                  onBlur={() => setFocusedField(null)}
                  placeholder="300 1234567"
                  placeholderTextColor={colors.mutedForeground}
                  keyboardType="phone-pad"
                  maxLength={11}
                  style={[styles.input, { color: colors.foreground }]}
                />
                {phone.trim().length >= 10 && (
                  <Feather name="check-circle" size={16} color="#4CAF50" />
                )}
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Username</Text>
              <View
                style={[
                  styles.inputWrapper,
                  {
                    backgroundColor: colors.card,
                    borderColor: focusedField === "signup-username" ? colors.primary : colors.border,
                  },
                ]}
              >
                <Feather name="at-sign" size={18} color={focusedField === "signup-username" ? colors.primary : colors.mutedForeground} />
                <TextInput
                  value={username}
                  onChangeText={(t) => setUsername(t.replace(/[^a-zA-Z0-9_]/g, ""))}
                  onFocus={() => setFocusedField("signup-username")}
                  onBlur={() => setFocusedField(null)}
                  placeholder="Choose a username"
                  placeholderTextColor={colors.mutedForeground}
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={[styles.input, { color: colors.foreground }]}
                />
                {username.length >= 3 && (
                  <Feather name="check-circle" size={16} color="#4CAF50" />
                )}
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Password</Text>
              <View
                style={[
                  styles.inputWrapper,
                  {
                    backgroundColor: colors.card,
                    borderColor: focusedField === "signup-password" ? colors.primary : colors.border,
                  },
                ]}
              >
                <Feather name="lock" size={18} color={focusedField === "signup-password" ? colors.primary : colors.mutedForeground} />
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  onFocus={() => setFocusedField("signup-password")}
                  onBlur={() => setFocusedField(null)}
                  placeholder="Min. 6 characters"
                  placeholderTextColor={colors.mutedForeground}
                  secureTextEntry={!showPassword}
                  style={[styles.input, { color: colors.foreground }]}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Feather
                    name={showPassword ? "eye" : "eye-off"}
                    size={18}
                    color={colors.mutedForeground}
                  />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              onPress={handleSignup}
              disabled={!isSignupValid || isLoading}
              style={[
                styles.signInBtn,
                {
                  backgroundColor: isSignupValid ? colors.accent : colors.border,
                  opacity: isSignupValid ? 1 : 0.7,
                },
              ]}
            >
              {isLoading ? (
                <Text style={styles.signInBtnText}>Please wait...</Text>
              ) : (
                <>
                  <Text style={styles.signInBtnText}>Create Account</Text>
                  <Feather name="arrow-right" size={20} color="#FFF" />
                </>
              )}
            </TouchableOpacity>

            <View style={styles.dividerRow}>
              <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
              <Text style={[styles.dividerText, { color: colors.mutedForeground }]}>or</Text>
              <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
            </View>

            <TouchableOpacity
              onPress={() => setMode("login")}
              style={[styles.switchBtn, { borderColor: colors.border }]}
            >
              <Feather name="log-in" size={18} color={colors.primary} />
              <Text style={[styles.switchBtnText, { color: colors.primary }]}>Already have an account? Sign In</Text>
            </TouchableOpacity>
          </>
        )}

        {mode === "otp" && (
          <>
            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: colors.foreground }]}>6-Digit Code</Text>
              <View
                style={[
                  styles.inputWrapper,
                  {
                    backgroundColor: colors.card,
                    borderColor: focusedField === "otp" ? colors.primary : colors.border,
                  },
                ]}
              >
                <Feather name="shield" size={18} color={focusedField === "otp" ? colors.primary : colors.mutedForeground} />
                <TextInput
                  value={otpCode}
                  onChangeText={(t) => setOtpCode(t.replace(/\D/g, "").slice(0, 6))}
                  onFocus={() => setFocusedField("otp")}
                  onBlur={() => setFocusedField(null)}
                  placeholder="000000"
                  placeholderTextColor={colors.mutedForeground}
                  keyboardType="number-pad"
                  maxLength={6}
                  style={[styles.input, styles.otpInput, { color: colors.foreground }]}
                />
                {isOtpValid && (
                  <Feather name="check-circle" size={16} color="#4CAF50" />
                )}
              </View>
            </View>

            <TouchableOpacity
              onPress={handleResendOtp}
              disabled={countdown > 0 || isLoading}
              style={styles.resendBtn}
            >
              <Text style={[styles.resendText, { color: countdown > 0 ? colors.mutedForeground : colors.primary }]}>
                {countdown > 0 ? `Resend code in ${countdown}s` : "Resend Code"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleVerifyOtp}
              disabled={!isOtpValid || isLoading}
              style={[
                styles.signInBtn,
                {
                  backgroundColor: isOtpValid ? colors.accent : colors.border,
                  opacity: isOtpValid ? 1 : 0.7,
                },
              ]}
            >
              {isLoading ? (
                <Text style={styles.signInBtnText}>Verifying...</Text>
              ) : (
                <>
                  <Text style={styles.signInBtnText}>Verify & Create Account</Text>
                  <Feather name="check-circle" size={20} color="#FFF" />
                </>
              )}
            </TouchableOpacity>
          </>
        )}

        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.skipBtn}>
          <Text style={[styles.skipText, { color: colors.mutedForeground }]}>
            Continue as guest (browse only)
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  topSection: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  logoArea: {
    alignItems: "center",
    paddingTop: 20,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  logoText: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
    letterSpacing: 2,
  },
  brandName: {
    color: "#FFFFFF",
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  brandTagline: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  formContainer: {
    flex: 1,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -28,
  },
  formContent: {
    paddingHorizontal: 24,
    paddingTop: 32,
  },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 16,
  },
  backBtnText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  welcomeTitle: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
    marginBottom: 6,
  },
  welcomeSubtitle: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    lineHeight: 20,
    marginBottom: 28,
  },
  fieldGroup: {
    marginBottom: 18,
  },
  fieldLabel: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    paddingVertical: 13,
    gap: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    padding: 0,
  },
  otpInput: {
    fontSize: 20,
    letterSpacing: 8,
    fontFamily: "Inter_600SemiBold",
  },
  phonePrefix: {
    flexDirection: "row",
    alignItems: "center",
  },
  phonePrefixText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  phoneDivider: {
    width: 1,
    height: 20,
    marginHorizontal: 2,
  },
  signInBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    paddingVertical: 16,
    gap: 10,
    marginBottom: 16,
    shadowColor: "#1A3525",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  signInBtnText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontFamily: "Inter_700Bold",
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: 12,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  switchBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    borderWidth: 1.5,
    paddingVertical: 14,
    gap: 8,
    marginBottom: 16,
  },
  switchBtnText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  resendBtn: {
    alignItems: "center",
    paddingVertical: 8,
    marginBottom: 16,
  },
  resendText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  skipBtn: {
    alignItems: "center",
    paddingVertical: 8,
  },
  skipText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    textDecorationLine: "underline",
  },
  devOtpBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 20,
  },
  devOtpText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: "#856404",
    flex: 1,
  },
});
