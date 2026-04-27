import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Linking
} from "react-native";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim());
}

function extractTokenHash(input) {
  const raw = String(input || "").trim();
  if (!raw.includes("://") && !raw.includes("/auth/v1/verify")) return null;

  try {
    const parsed = new URL(raw);
    const tokenHash = parsed.searchParams.get("token_hash");
    const type = parsed.searchParams.get("type") || "email";
    if (!tokenHash) return null;
    return { tokenHash, type };
  } catch (_error) {
    return null;
  }
}

export default function PhoneAuthScreen({ navigation }) {
  const { session, sendOtp, verifyOtp, verifyOtpTokenHash, isSupabaseEnabled } = useAuth();
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (session) {
      navigation.reset({
        index: 0,
        routes: [{ name: "Home" }]
      });
    }
  }, [session, navigation]);

  const handleSendOtp = async () => {
    const normalizedEmail = String(email || "").trim().toLowerCase();
    if (!isValidEmail(normalizedEmail)) {
      Alert.alert(t("common.validation"), t("auth.validation.emailRequired"));
      return;
    }

    setLoading(true);
    const { error } = await sendOtp(normalizedEmail);
    setLoading(false);

    if (error) {
      Alert.alert(t("common.error"), error.message || t("auth.error.sendOtp"));
      return;
    }

    setEmail(normalizedEmail);
    setOtpSent(true);
    Alert.alert(t("auth.otpSentTitle"), t("auth.otpSentMessage"));
  };

  const handleVerifyOtp = async () => {
    const input = otp.trim();
    if (!input) {
      Alert.alert(t("common.validation"), t("auth.validation.otpRequired"));
      return;
    }

    setLoading(true);
    const extracted = extractTokenHash(input);
    const { error } = extracted
      ? await verifyOtpTokenHash(extracted.tokenHash, extracted.type)
      : await verifyOtp(email, input);
    setLoading(false);

    if (error) {
      Alert.alert(t("common.error"), error.message || t("auth.error.verifyOtp"));
      return;
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 70 : 18}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>{t("auth.title")}</Text>
        <Text style={styles.subtitle}>
          {isSupabaseEnabled ? t("auth.subtitle") : t("auth.supabaseDisabled")}
        </Text>

        {!otpSent ? (
          <View style={styles.phoneRow}>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder={t("auth.emailPlaceholder")}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              style={styles.phoneInput}
              editable={!otpSent}
            />
          </View>
        ) : null}

        {otpSent ? (
          <>
            <Text style={styles.label}>{t("auth.otpLabel")}</Text>
            <TextInput
              value={otp}
              onChangeText={setOtp}
              placeholder={t("auth.otpPlaceholder")}
              keyboardType="number-pad"
              autoCapitalize="none"
              style={styles.input}
            />
            <Text style={styles.helpText}>{email}</Text>
            <Text style={styles.helpText}>{t("auth.otpHelp")}</Text>
            <TouchableOpacity
              onPress={async () => {
                const inboxUrl = "https://mail.google.com";
                await Linking.openURL(inboxUrl);
              }}
            >
              <Text style={styles.linkText}>{t("auth.openInbox")}</Text>
            </TouchableOpacity>
          </>
        ) : (
          <View style={styles.bigSpacer} />
        )}

        <View style={styles.bottomArea}>
          {otpSent ? (
            <>
              <TouchableOpacity
                style={[styles.primaryButton, loading ? styles.disabled : null]}
                onPress={handleVerifyOtp}
                disabled={loading}
              >
                <Text style={styles.primaryButtonText}>
                  {loading ? t("common.loading") : t("auth.verifyButton")}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => {
                  setOtpSent(false);
                  setOtp("");
                }}
                disabled={loading}
              >
                <Text style={styles.secondaryButtonText}>{t("auth.changeNumber")}</Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity
              style={[styles.primaryButton, loading ? styles.disabled : null]}
              onPress={handleSendOtp}
              disabled={loading || !isSupabaseEnabled || !isValidEmail(email)}
            >
              <Text style={styles.primaryButtonText}>
                {loading ? t("common.loading") : t("auth.sendOtpButton")}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff"
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 36,
    paddingBottom: 18
  },
  title: {
    color: "#1f2937",
    fontSize: 44 / 2,
    fontWeight: "700",
    marginTop: 6
  },
  subtitle: {
    color: "#6b7280",
    marginTop: 6
  },
  phoneRow: {
    marginTop: 34,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    paddingBottom: 8
  },
  phoneInput: {
    color: "#111827",
    fontSize: 17,
    paddingVertical: 0
  },
  label: {
    color: "#374151",
    fontWeight: "600",
    marginTop: 30,
    marginBottom: 6
  },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
    marginBottom: 12
  },
  helpText: {
    color: "#6b7280",
    fontSize: 12,
    marginBottom: 4
  },
  linkText: {
    color: "#2563eb",
    fontWeight: "600",
    marginTop: 2
  },
  bigSpacer: {
    flex: 1
  },
  bottomArea: {
    marginTop: "auto",
    paddingTop: 16
  },
  primaryButton: {
    backgroundColor: "#2563eb",
    borderRadius: 10,
    alignItems: "center",
    paddingVertical: 14
  },
  primaryButtonText: {
    color: "#fff",
    fontWeight: "700"
  },
  secondaryButton: {
    marginTop: 10,
    alignItems: "center"
  },
  secondaryButtonText: {
    color: "#2563eb",
    fontWeight: "600"
  },
  disabled: {
    opacity: 0.55
  }
});
