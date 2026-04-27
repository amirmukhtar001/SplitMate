import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert
} from "react-native";
import {
  addPaymentToLoan,
  getLoans,
  updateLoan
} from "../storage/loanStorage";
import { cancelLoanReminder } from "../utils/notification";
import { getRemainingAmount, getTotalPaid } from "../utils/loanMath";
import { useLanguage } from "../context/LanguageContext";

export default function AddPaymentScreen({ route, navigation }) {
  const { t } = useLanguage();
  const { loanId } = route.params;
  const [loan, setLoan] = useState(null);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");

  useEffect(() => {
    const loadLoan = async () => {
      const loans = await getLoans();
      const found = loans.find((item) => item.id === loanId) || null;
      setLoan(found);
    };
    loadLoan();
  }, [loanId]);

  const handleSavePayment = async () => {
    if (!loan) return;

    const numericAmount = Number(amount);
    if (!numericAmount || numericAmount <= 0) {
      Alert.alert(t("common.validation"), t("addPayment.validation.amount"));
      return;
    }

    const remaining = getRemainingAmount(loan);
    if (numericAmount > remaining) {
      Alert.alert(
        t("common.validation"),
        t("addPayment.validation.maxAmount", { amount: `Rs. ${remaining}` })
      );
      return;
    }

    const payment = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      amount: numericAmount,
      note: note.trim(),
      createdAt: new Date().toISOString()
    };

    const updatedLoans = await addPaymentToLoan(loan.id, payment);
    const updatedLoan = updatedLoans.find((item) => item.id === loan.id);

    if (updatedLoan && getTotalPaid(updatedLoan) >= Number(updatedLoan.amount || 0)) {
      await cancelLoanReminder(updatedLoan.notificationId);
      await updateLoan(updatedLoan.id, { isPaid: true, notificationId: null });
    }

    navigation.goBack();
  };

  if (!loan) {
    return (
      <View style={styles.container}>
        <Text style={styles.infoText}>{t("addPayment.notFound")}</Text>
      </View>
    );
  }

  const totalPaid = getTotalPaid(loan);
  const remaining = getRemainingAmount(loan);

  return (
    <View style={styles.container}>
      <View style={styles.summaryCard}>
        <Text style={styles.summaryText}>{t("addPayment.borrower", { name: loan.name })}</Text>
        <Text style={styles.summaryText}>{t("addPayment.total", { amount: `Rs. ${loan.amount}` })}</Text>
        <Text style={styles.summaryText}>{t("addPayment.paid", { amount: `Rs. ${totalPaid}` })}</Text>
        <Text style={styles.remainingText}>
          {t("addPayment.remaining", { amount: `Rs. ${remaining}` })}
        </Text>
      </View>

      <Text style={styles.label}>{t("addPayment.amount")}</Text>
      <TextInput
        value={amount}
        onChangeText={setAmount}
        placeholder={t("addPayment.placeholder.amount")}
        keyboardType="numeric"
        style={styles.input}
      />

      <Text style={styles.label}>{t("addPayment.note")}</Text>
      <TextInput
        value={note}
        onChangeText={setNote}
        placeholder={t("addPayment.placeholder.note")}
        style={styles.input}
      />

      <TouchableOpacity style={styles.saveBtn} onPress={handleSavePayment}>
        <Text style={styles.saveBtnText}>{t("addPayment.save")}</Text>
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
  summaryCard: {
    backgroundColor: "#eff6ff",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16
  },
  summaryText: {
    color: "#1f2937",
    fontWeight: "600",
    marginBottom: 4
  },
  remainingText: {
    color: "#b91c1c",
    fontWeight: "700"
  },
  label: {
    marginTop: 8,
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
  },
  infoText: {
    color: "#6b7280"
  }
});
