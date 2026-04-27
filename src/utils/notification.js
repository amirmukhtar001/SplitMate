import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import { DEFAULT_LANGUAGE, translations } from "../i18n/translations";
import { getSelectedLanguage } from "../storage/languageStorage";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false
  })
});

export async function setupNotifications() {
  const { status } = await Notifications.getPermissionsAsync();
  if (status !== "granted") {
    await Notifications.requestPermissionsAsync();
  }

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("loan-reminders", {
      name: "Loan Reminders",
      importance: Notifications.AndroidImportance.HIGH
    });
  }
}

export async function scheduleLoanReminder(loan) {
  if (!loan?.reminderDate) return null;

  const triggerDate = new Date(loan.reminderDate);
  if (Number.isNaN(triggerDate.getTime())) {
    return null;
  }

  const reminderRepeat = loan.reminderRepeat || "NONE";
  let trigger = triggerDate;

  if (reminderRepeat === "NONE") {
    if (triggerDate <= new Date()) {
      return null;
    }
  } else if (reminderRepeat === "DAILY") {
    trigger = {
      hour: triggerDate.getHours(),
      minute: triggerDate.getMinutes(),
      repeats: true
    };
  } else if (reminderRepeat === "WEEKLY") {
    trigger = {
      weekday: triggerDate.getDay() + 1,
      hour: triggerDate.getHours(),
      minute: triggerDate.getMinutes(),
      repeats: true
    };
  }

  const selectedLanguage = await getSelectedLanguage();
  const language = selectedLanguage || loan?.language || DEFAULT_LANGUAGE;
  const languagePack = translations[language] || translations[DEFAULT_LANGUAGE];
  const title = languagePack["notification.title"] || "Udhaar Reminder";
  const bodyTemplate = languagePack["notification.body"] || "{name} owes you {amount}";
  const body = bodyTemplate
    .replace("{name}", String(loan.name || ""))
    .replace("{amount}", `Rs. ${loan.amount}`);

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body
    },
    trigger
  });

  return id;
}

export async function cancelLoanReminder(notificationId) {
  if (!notificationId) return;
  await Notifications.cancelScheduledNotificationAsync(notificationId);
}
