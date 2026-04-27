import React, { useCallback, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { getLoans, deleteLoan, updateLoan } from "../storage/loanStorage";
import {
  cancelLoanReminder,
  scheduleLoanReminder
} from "../utils/notification";
import { getLoanStatus, getRemainingAmount, getTotalPaid } from "../utils/loanMath";
import { useLanguage } from "../context/LanguageContext";

function row(label, value) {
  return (
    <View style={styles.row} key={label}>
      <Text style={styles.key}>{label}</Text>
      <Text style={styles.value}>{value || "-"}</Text>
    </View>
  );
}

function formatShortDate(dateInput) {
  if (!dateInput) return "-";
  const date = new Date(dateInput);
  if (Number.isNaN(date.getTime())) return "-";
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yyyy = String(date.getFullYear());
  return `${dd}-${mm}-${yyyy}`;
}

function formatShortTime(dateInput) {
  if (!dateInput) return "-";
  const date = new Date(dateInput);
  if (Number.isNaN(date.getTime())) return "-";
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

function translateRepeatValue(value, t) {
  if (value === "DAILY") return t("common.daily");
  if (value === "WEEKLY") return t("common.weekly");
  return t("common.oneTime");
}

export default function DetailScreen({ route, navigation }) {
  const { t } = useLanguage();
  const { loanId } = route.params;
  const [loan, setLoan] = useState(null);

  useFocusEffect(
    useCallback(() => {
      const load = async () => {
        const loans = await getLoans();
        const found = loans.find((item) => item.id === loanId);
        setLoan(found || null);
      };
      load();
    }, [loanId])
  );

  const toggleStatus = async () => {
    if (!loan) return;
    const nextPaid = !loan.isPaid;
    let notificationId = loan.notificationId || null;

    if (nextPaid) {
      await cancelLoanReminder(notificationId);
      notificationId = null;
    } else if (loan.reminderDate) {
      notificationId = await scheduleLoanReminder(loan);
    }

    await updateLoan(loan.id, { isPaid: nextPaid, notificationId });
    setLoan((prev) => ({ ...prev, isPaid: nextPaid, notificationId }));
  };

  const onDelete = () => {
    if (!loan) return;

    Alert.alert(t("detail.deleteTitle"), t("detail.deleteMessage", { name: loan.name }), [
      { text: t("detail.cancel"), style: "cancel" },
      {
        text: t("detail.delete"),
        style: "destructive",
        onPress: async () => {
          await cancelLoanReminder(loan.notificationId);
          await deleteLoan(loan.id);
          navigation.goBack();
        }
      }
    ]);
  };

  if (!loan) {
    return (
      <View style={styles.container}>
        <Text style={styles.notFound}>{t("detail.notFound")}</Text>
      </View>
    );
  }

  const totalPaid = getTotalPaid(loan);
  const remainingAmount = getRemainingAmount(loan);
  const statusText = getLoanStatus(loan);
  const payments = Array.isArray(loan.payments) ? [...loan.payments].reverse() : [];

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.card}>
        {row(t("detail.row.name"), loan.name)}
        {row(t("detail.row.amount"), `Rs. ${loan.amount}`)}
        {row(t("detail.row.paid"), `Rs. ${totalPaid}`)}
        {row(t("detail.row.remaining"), `Rs. ${remainingAmount}`)}
        {row(t("detail.row.note"), loan.note || "-")}
        {row(
          t("detail.row.direction"),
          loan.loanDirection === "PAYABLE"
            ? t("loan.direction.payableShort")
            : t("loan.direction.receivableShort")
        )}
        {row(t("detail.row.date"), formatShortDate(loan.date))}
        {row(t("detail.row.reminderDate"), formatShortDate(loan.reminderDate))}
        {row(t("detail.row.reminderTime"), formatShortTime(loan.reminderDate))}
        {row(t("detail.row.reminderRepeat"), translateRepeatValue(loan.reminderRepeat, t))}
        {row(
          t("detail.row.status"),
          statusText === "Paid"
            ? t("loan.status.paid")
            : statusText === "Partially Paid"
            ? t("loan.status.partial")
            : t("loan.status.unpaid")
        )}
      </View>

      <TouchableOpacity style={styles.toggleBtn} onPress={toggleStatus}>
        <Text style={styles.btnText}>
          {t("detail.markAs", {
            status: loan.isPaid ? t("loan.status.unpaid") : t("loan.status.paid")
          })}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.payBtn}
        onPress={() => navigation.navigate("AddPayment", { loanId: loan.id })}
      >
        <Text style={styles.btnText}>{t("detail.addPayment")}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.editBtn}
        onPress={() => navigation.navigate("EditLoan", { loanId: loan.id })}
      >
        <Text style={styles.btnText}>{t("detail.editLoan")}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.deleteBtn} onPress={onDelete}>
        <Text style={styles.btnText}>{t("detail.deleteLoan")}</Text>
      </TouchableOpacity>

      <View style={styles.historyCard}>
        <Text style={styles.historyTitle}>{t("detail.paymentHistory")}</Text>
        {payments.length === 0 ? (
          <Text style={styles.historyEmpty}>{t("detail.noPayments")}</Text>
        ) : (
          payments.map((payment) => (
            <View key={payment.id} style={styles.paymentRow}>
              <View>
                <Text style={styles.paymentAmount}>Rs. {payment.amount}</Text>
                <Text style={styles.paymentDate}>
                  {formatShortDate(payment.createdAt)}
                </Text>
              </View>
              <Text style={styles.paymentNote}>{payment.note || "-"}</Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#f3f4f6",
    padding: 16,
    paddingBottom: 30
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14
  },
  row: {
    marginBottom: 10
  },
  key: {
    color: "#6b7280",
    marginBottom: 2
  },
  value: {
    color: "#111827",
    fontWeight: "600"
  },
  toggleBtn: {
    marginTop: 18,
    backgroundColor: "#2563eb",
    borderRadius: 10,
    alignItems: "center",
    paddingVertical: 12
  },
  payBtn: {
    marginTop: 10,
    backgroundColor: "#0ea5e9",
    borderRadius: 10,
    alignItems: "center",
    paddingVertical: 12
  },
  deleteBtn: {
    marginTop: 10,
    backgroundColor: "#ef4444",
    borderRadius: 10,
    alignItems: "center",
    paddingVertical: 12
  },
  editBtn: {
    marginTop: 10,
    backgroundColor: "#6b7280",
    borderRadius: 10,
    alignItems: "center",
    paddingVertical: 12
  },
  btnText: {
    color: "#fff",
    fontWeight: "700"
  },
  notFound: {
    color: "#6b7280"
  },
  historyCard: {
    marginTop: 14,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14
  },
  historyTitle: {
    color: "#111827",
    fontWeight: "700",
    fontSize: 16,
    marginBottom: 10
  },
  historyEmpty: {
    color: "#6b7280"
  },
  paymentRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6"
  },
  paymentAmount: {
    color: "#111827",
    fontWeight: "700"
  },
  paymentDate: {
    color: "#6b7280",
    marginTop: 2,
    fontSize: 12
  },
  paymentNote: {
    color: "#374151",
    maxWidth: "55%",
    textAlign: "right"
  }
});
