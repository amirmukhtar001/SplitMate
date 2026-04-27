import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { useLanguage } from "../context/LanguageContext";
import { useAuth } from "../context/AuthContext";

const LANGUAGE_OPTIONS = [
  { code: "roman_urdu", label: "Roman urdu" },
  { code: "urdu", label: "Urdu" },
  { code: "english", label: "English" },
  { code: "sindhi", label: "Sindhi" },
  { code: "arabic", label: "Arabic" }
];

export default function LanguageSelectScreen({ navigation }) {
  const { language, setLanguage } = useLanguage();
  const { session } = useAuth();
  const [selectedLanguage, setSelectedLanguageCode] = useState(language);

  const handleSelectLanguage = async (languageCode) => {
    setSelectedLanguageCode(languageCode);
    await setLanguage(languageCode);
  };

  const handleContinue = async () => {
    if (session) {
      navigation.getParent()?.closeDrawer?.();
      navigation.reset({
        index: 0,
        routes: [{ name: "Home" }]
      });
      return;
    }

    const parent = navigation.getParent();
    if (navigation.getState?.()?.routeNames?.includes("PhoneAuth")) {
      navigation.navigate("PhoneAuth");
      return;
    }
    if (parent?.getState?.()?.routeNames?.includes("PhoneAuth")) {
      parent.navigate("PhoneAuth");
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Udhaar Book welcomes you!</Text>
        <Text style={styles.subtitle}>Select your language</Text>

        {LANGUAGE_OPTIONS.map((language) => {
          const isSelected = selectedLanguage === language.code;
          return (
            <TouchableOpacity
              key={language.code}
              style={[styles.languageCard, isSelected ? styles.languageCardSelected : null]}
              onPress={() => handleSelectLanguage(language.code)}
            >
              <Text style={styles.languageLabel}>{language.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <TouchableOpacity style={styles.nextButton} onPress={handleContinue}>
        <Text style={styles.nextButtonText}>NEXT</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f3f4f6",
    paddingHorizontal: 18,
    paddingTop: 24,
    paddingBottom: 18
  },
  content: {
    paddingBottom: 20
  },
  title: {
    color: "#111827",
    fontSize: 20,
    fontWeight: "700",
    marginTop: 12
  },
  subtitle: {
    color: "#374151",
    fontSize: 17,
    fontWeight: "700",
    marginTop: 4,
    marginBottom: 16
  },
  languageCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    paddingVertical: 24,
    alignItems: "center",
    marginBottom: 12
  },
  languageCardSelected: {
    borderColor: "#16a34a",
    borderWidth: 2
  },
  languageLabel: {
    color: "#111827",
    fontWeight: "700",
    fontSize: 31 / 2
  },
  nextButton: {
    backgroundColor: "#22c55e",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14
  },
  nextButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16
  }
});
