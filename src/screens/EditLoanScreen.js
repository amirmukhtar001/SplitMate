import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  Platform
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { getLoans, updateLoan } from "../storage/loanStorage";
import {
  cancelLoanReminder,
  scheduleLoanReminder
} from "../utils/notification";
import { getTotalPaid } from "../utils/loanMath";
import { useLanguage } from "../context/LanguageContext";

const REPEAT_OPTIONS = [
  { key: "NONE", labelKey: "common.oneTime" },
  { key: "DAILY", labelKey: "common.daily" },
  { key: "WEEKLY", labelKey: "common.weekly" }
];
const DIRECTION_OPTIONS = [
  { key: "RECEIVABLE", labelKey: "loan.direction.receivable" },
  { key: "PAYABLE", labelKey: "loan.direction.payable" }
];

function formatDatePart(date) {
  if (!date) return null;
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yyyy = String(date.getFullYear());
  return `${dd}-${mm}-${yyyy}`;
}

function formatTimePart(date) {
  if (!date) return null;
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

function parseDate(input) {
  if (!input) return null;
  const parsed = new Date(input);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export default function EditLoanScreen({ route, navigation }) {
  const { language, t } = useLanguage();
  const { loanId } = route.params;
  const [loan, setLoan] = useState(null);
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [loanDirection, setLoanDirection] = useState("RECEIVABLE");
  const [loanDate, setLoanDate] = useState(new Date());
  const [showLoanDatePicker, setShowLoanDatePicker] = useState(false);
  const [reminderDate, setReminderDate] = useState(null);
  const [reminderRepeat, setReminderRepeat] = useState("NONE");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  useEffect(() => {
    const loadLoan = async () => {
      const loans = await getLoans();
      const found = loans.find((item) => item.id === loanId) || null;

      setLoan(found);
      if (found) {
        setName(found.name || "");
        setAmount(String(found.amount || ""));
        setNote(found.note || "");
        setLoanDirection(found.loanDirection || "RECEIVABLE");
        setLoanDate(parseDate(found.date) || new Date());
        setReminderDate(parseDate(found.reminderDate));
        setReminderRepeat(found.reminderRepeat || "NONE");
      }
      setLoading(false);
    };

    loadLoan();
  }, [loanId]);

  const onDateChange = (_, selectedDate) => {
    if (Platform.OS === "android") {
      setShowDatePicker(false);
    }
    if (selectedDate) {
      const current = reminderDate || new Date();
      const merged = new Date(selectedDate);
      merged.setHours(current.getHours(), current.getMinutes(), 0, 0);
      setReminderDate(merged);
    }
  };

  const onLoanDateChange = (_, selectedDate) => {
    if (Platform.OS === "android") {
      setShowLoanDatePicker(false);
    }
    if (selectedDate) {
      const normalized = new Date(selectedDate);
      normalized.setHours(0, 0, 0, 0);
      setLoanDate(normalized);
    }
  };

  const onTimeChange = (_, selectedDate) => {
    if (Platform.OS === "android") {
      setShowTimePicker(false);
    }
    if (selectedDate) {
      const current = reminderDate || new Date();
      const merged = new Date(current);
      merged.setHours(selectedDate.getHours(), selectedDate.getMinutes(), 0, 0);
      setReminderDate(merged);
    }
  };

  const clearReminder = () => {
    setReminderDate(null);
    setReminderRepeat("NONE");
    setShowDatePicker(false);
    setShowTimePicker(false);
  };

  const handleSave = async () => {
    if (!loan) return;

    const cleanName = name.trim();
    const numericAmount = Number(amount);

    if (!cleanName) {
      Alert.alert(t("common.validation"), t("addLoan.validation.name"));
      return;
    }
    if (!numericAmount || numericAmount <= 0) {
      Alert.alert(t("common.validation"), t("addLoan.validation.amount"));
      return;
    }
    if (reminderDate && reminderRepeat === "NONE" && reminderDate <= new Date()) {
      Alert.alert(t("common.validation"), t("addLoan.validation.reminderFuture"));
      return;
    }

    try {
      const nextReminderDate = reminderDate ? reminderDate.toISOString() : null;
      const nextReminderRepeat = nextReminderDate ? reminderRepeat : "NONE";
      let notificationId = loan.notificationId || null;
      const reminderChanged = (loan.reminderDate || null) !== nextReminderDate;
      const repeatChanged = (loan.reminderRepeat || "NONE") !== nextReminderRepeat;

      if (notificationId && (reminderChanged || repeatChanged || !nextReminderDate || loan.isPaid)) {
        await cancelLoanReminder(notificationId);
        notificationId = null;
      }

      if (!loan.isPaid && nextReminderDate) {
        notificationId = await scheduleLoanReminder({
          ...loan,
          name: cleanName,
          amount: numericAmount,
          reminderDate: nextReminderDate,
          reminderRepeat: nextReminderRepeat
        });
      }

      await updateLoan(loan.id, {
        name: cleanName,
        amount: numericAmount,
        note: note.trim(),
        loanDirection,
        date: loanDate.toISOString().split("T")[0],
        reminderDate: nextReminderDate,
        reminderRepeat: nextReminderRepeat,
        language,
        notificationId,
        isPaid: getTotalPaid(loan) >= numericAmount
      });

      navigation.goBack();
    } catch (error) {
      Alert.alert(t("common.error"), t("editLoan.error"));
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.infoText}>{t("common.loading")}</Text>
      </View>
    );
  }

  if (!loan) {
    return (
      <View style={styles.container}>
        <Text style={styles.infoText}>{t("editLoan.notFound")}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{t("addLoan.name")}</Text>
      <TextInput
        value={name}
        onChangeText={setName}
        placeholder={t("addLoan.placeholder.name")}
        style={styles.input}
      />

      <Text style={styles.label}>{t("addLoan.amount")}</Text>
      <TextInput
        value={amount}
        onChangeText={setAmount}
        placeholder={t("addLoan.placeholder.amount")}
        keyboardType="numeric"
        style={styles.input}
      />

      <Text style={styles.label}>{t("addLoan.note")}</Text>
      <TextInput
        value={note}
        onChangeText={setNote}
        placeholder={t("addLoan.placeholder.note")}
        style={styles.input}
      />

      <Text style={styles.label}>{t("addLoan.direction")}</Text>
      <View style={styles.repeatRow}>
        {DIRECTION_OPTIONS.map((option) => {
          const isActive = loanDirection === option.key;
          return (
            <TouchableOpacity
              key={option.key}
              style={[styles.repeatChip, isActive ? styles.repeatChipActive : null]}
              onPress={() => setLoanDirection(option.key)}
            >
              <Text style={[styles.repeatChipText, isActive ? styles.repeatChipTextActive : null]}>
                {t(option.labelKey)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={styles.label}>{t("addLoan.loanDate")}</Text>
      <TouchableOpacity style={styles.dateBtn} onPress={() => setShowLoanDatePicker(true)}>
        <Text style={styles.dateBtnText}>{formatDatePart(loanDate)}</Text>
      </TouchableOpacity>

      <Text style={styles.label}>{t("addLoan.reminderDateTime")}</Text>
      <TouchableOpacity style={styles.dateBtn} onPress={() => setShowDatePicker(true)}>
        <Text style={styles.dateBtnText}>
          {t("common.date")}: {formatDatePart(reminderDate) || t("common.notSet")}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.dateBtn} onPress={() => setShowTimePicker(true)}>
        <Text style={styles.dateBtnText}>
          {t("common.time")}: {formatTimePart(reminderDate) || t("common.notSet")}
        </Text>
      </TouchableOpacity>

      <Text style={styles.label}>{t("common.repeat")}</Text>
      <View style={styles.repeatRow}>
        {REPEAT_OPTIONS.map((option) => {
          const isActive = reminderRepeat === option.key;
          return (
            <TouchableOpacity
              key={option.key}
              style={[styles.repeatChip, isActive ? styles.repeatChipActive : null]}
              onPress={() => setReminderRepeat(option.key)}
            >
              <Text style={[styles.repeatChipText, isActive ? styles.repeatChipTextActive : null]}>
                {t(option.labelKey)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {reminderDate ? (
        <TouchableOpacity style={styles.clearBtn} onPress={clearReminder}>
          <Text style={styles.clearBtnText}>{t("common.clearReminder")}</Text>
        </TouchableOpacity>
      ) : null}

      {showDatePicker && (
        <DateTimePicker
          value={reminderDate || new Date()}
          mode="date"
          display="default"
          onChange={onDateChange}
          minimumDate={new Date()}
        />
      )}

      {showLoanDatePicker && (
        <DateTimePicker
          value={loanDate}
          mode="date"
          display="default"
          onChange={onLoanDateChange}
          maximumDate={new Date()}
        />
      )}

      {showTimePicker && (
        <DateTimePicker
          value={reminderDate || new Date()}
          mode="time"
          display="default"
          onChange={onTimeChange}
        />
      )}

      <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
        <Text style={styles.saveBtnText}>{t("editLoan.save")}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 16
  },
  infoText: {
    color: "#6b7280"
  },
  label: {
    marginTop: 10,
    marginBottom: 6,
    color: "#374151",
    fontWeight: "600"
  },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10
  },
  dateBtn: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 10,
    padding: 12,
    marginBottom: 8
  },
  dateBtnText: {
    color: "#111827"
  },
  repeatRow: {
    flexDirection: "row",
    flexWrap: "wrap"
  },
  repeatChip: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    marginRight: 8,
    marginBottom: 8
  },
  repeatChipActive: {
    backgroundColor: "#111827",
    borderColor: "#111827"
  },
  repeatChipText: {
    color: "#374151",
    fontWeight: "600"
  },
  repeatChipTextActive: {
    color: "#fff"
  },
  clearBtn: {
    marginTop: 10,
    alignSelf: "flex-start"
  },
  clearBtnText: {
    color: "#dc2626",
    fontWeight: "600"
  },
  saveBtn: {
    marginTop: 24,
    backgroundColor: "#2563eb",
    borderRadius: 10,
    alignItems: "center",
    paddingVertical: 13
  },
  saveBtnText: {
    color: "#fff",
    fontWeight: "700"
  }
});
