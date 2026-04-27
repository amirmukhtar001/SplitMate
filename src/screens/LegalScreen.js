import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Linking, Alert, ScrollView } from "react-native";
import { useLanguage } from "../context/LanguageContext";
import { APP_META } from "../config/appMeta";

export default function LegalScreen() {
  const { t } = useLanguage();

  const openUrl = async (url) => {
    try {
      if (!url) throw new Error("URL is missing");
      const supported = await Linking.canOpenURL(url);
      if (!supported) throw new Error("URL is not supported");
      await Linking.openURL(url);
    } catch (_error) {
      Alert.alert(t("common.error"), t("legal.openUrlError"));
    }
  };

  const openEmail = async () => {
    const subject = encodeURIComponent("Smart Udhaar Support");
    const body = encodeURIComponent("Hello, I need help with Smart Udhaar.");
    const mailto = `mailto:${APP_META.supportEmail}?subject=${subject}&body=${body}`;
    await openUrl(mailto);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.heading}>{t("legal.title")}</Text>
      <Text style={styles.subheading}>{t("legal.lastUpdated")}</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t("legal.section.accountTitle")}</Text>
        <Text style={styles.bodyText}>{t("legal.accountNotice")}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t("legal.section.collectionTitle")}</Text>
        <Text style={styles.bodyText}>{t("legal.dataCollectionNotice")}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t("legal.section.processingTitle")}</Text>
        <Text style={styles.bodyText}>{t("legal.dataNotice")}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t("legal.section.storageTitle")}</Text>
        <Text style={styles.bodyText}>{t("legal.storageNotice")}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t("legal.section.notificationsTitle")}</Text>
        <Text style={styles.bodyText}>{t("legal.notificationNotice")}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t("legal.section.rightsTitle")}</Text>
        <Text style={styles.bodyText}>{t("legal.rightsNotice")}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t("legal.section.deletionTitle")}</Text>
        <Text style={styles.bodyText}>{t("legal.deletionNotice")}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t("legal.section.policyUpdatesTitle")}</Text>
        <Text style={styles.bodyText}>{t("legal.policyUpdatesNotice")}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>{t("legal.supportEmailLabel")}</Text>
        <Text style={styles.value}>{APP_META.supportEmail}</Text>
      </View>

      <TouchableOpacity style={styles.primaryButton} onPress={() => openUrl(APP_META.privacyPolicyUrl)}>
        <Text style={styles.primaryButtonText}>{t("legal.privacyPolicyButton")}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.secondaryButton} onPress={openEmail}>
        <Text style={styles.secondaryButtonText}>{t("legal.contactSupportButton")}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.dangerButton} onPress={() => openUrl(APP_META.accountDeletionUrl)}>
        <Text style={styles.dangerButtonText}>{t("legal.deleteAccountButton")}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f3f4f6",
    padding: 16
  },
  contentContainer: {
    paddingBottom: 28
  },
  heading: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 2
  },
  subheading: {
    color: "#6b7280",
    marginBottom: 12
  },
  section: {
    marginBottom: 10
  },
  sectionTitle: {
    color: "#111827",
    fontWeight: "700",
    marginBottom: 4
  },
  bodyText: {
    color: "#374151",
    lineHeight: 20
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#d1d5db",
    padding: 12,
    marginTop: 8,
    marginBottom: 14
  },
  label: {
    color: "#6b7280",
    fontSize: 12
  },
  value: {
    color: "#111827",
    fontWeight: "600",
    marginTop: 4
  },
  primaryButton: {
    backgroundColor: "#2563eb",
    borderRadius: 10,
    alignItems: "center",
    paddingVertical: 12
  },
  primaryButtonText: {
    color: "#fff",
    fontWeight: "700"
  },
  secondaryButton: {
    marginTop: 10,
    backgroundColor: "#fff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#d1d5db",
    alignItems: "center",
    paddingVertical: 12
  },
  secondaryButtonText: {
    color: "#1f2937",
    fontWeight: "700"
  },
  dangerButton: {
    marginTop: 10,
    backgroundColor: "#fee2e2",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#fecaca",
    alignItems: "center",
    paddingVertical: 12
  },
  dangerButtonText: {
    color: "#b91c1c",
    fontWeight: "700"
  }
});
