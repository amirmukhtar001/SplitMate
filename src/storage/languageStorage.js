import AsyncStorage from "@react-native-async-storage/async-storage";

const LANGUAGE_KEY = "selected_language";

export async function getSelectedLanguage() {
  try {
    return await AsyncStorage.getItem(LANGUAGE_KEY);
  } catch (error) {
    console.warn("Failed to load selected language", error);
    return null;
  }
}

export async function setSelectedLanguage(languageCode) {
  try {
    await AsyncStorage.setItem(LANGUAGE_KEY, languageCode);
  } catch (error) {
    console.warn("Failed to save selected language", error);
  }
}
