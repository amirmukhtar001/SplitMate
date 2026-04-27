import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable
} from "react-native";
import Swipeable from "react-native-gesture-handler/Swipeable";
import { useLanguage } from "../context/LanguageContext";

function ActionButton({ label, color, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.actionBtn,
        { backgroundColor: color, opacity: pressed ? 0.8 : 1 }
      ]}
    >
      <Text style={styles.actionText}>{label}</Text>
    </Pressable>
  );
}

export default function LoanItem({
  loan,
  isOverdue = false,
  overdueDays = 0,
  remainingAmount = Number(loan.amount || 0),
  directionType = "RECEIVABLE",
  directionLabel = "",
  statusText = loan.isPaid ? "Paid" : "Unpaid",
  onPress,
  onAddPayment,
  onEdit,
  onTogglePaid,
  onDelete
}) {
  const { t } = useLanguage();

  const renderRightActions = () => (
    <View style={styles.actions}>
      <ActionButton label={t("loan.action.pay")} color="#2563eb" onPress={onAddPayment} />
      <ActionButton label={t("loan.action.edit")} color="#6b7280" onPress={onEdit} />
      <ActionButton
        label={loan.isPaid ? t("loan.action.paidToggleUnpaid") : t("loan.action.paidTogglePaid")}
        color={loan.isPaid ? "#f59e0b" : "#22c55e"}
        onPress={onTogglePaid}
      />
      <ActionButton label={t("loan.action.delete")} color="#ef4444" onPress={onDelete} />
    </View>
  );

  return (
    <Swipeable renderRightActions={renderRightActions}>
      <TouchableOpacity style={styles.card} activeOpacity={0.8} onPress={onPress}>
        <View>
          <Text style={styles.name}>{loan.name}</Text>
          <Text style={styles.note}>{loan.note || t("loan.noNote")}</Text>
          <View
            style={[
              styles.directionBadge,
              directionType === "PAYABLE" ? styles.payableBadge : styles.receivableBadge
            ]}
          >
            <Text
              style={[
                styles.directionText,
                directionType === "PAYABLE" ? styles.payableText : styles.receivableText
              ]}
            >
              {directionLabel}
            </Text>
          </View>
          {isOverdue ? (
            <View style={styles.overdueBadge}>
              <Text style={styles.overdueText}>{t("loan.overdueByDays", { days: overdueDays })}</Text>
            </View>
          ) : null}
        </View>
        <View style={styles.right}>
          <Text style={styles.amount}>Rs. {loan.amount}</Text>
          <Text style={styles.remaining}>{t("loan.remaining", { amount: `Rs. ${remainingAmount}` })}</Text>
          <Text
            style={[
              styles.status,
              statusText === "Paid" ? styles.paid : statusText === "Partially Paid" ? styles.partial : styles.unpaid
            ]}
          >
            {statusText === "Paid"
              ? t("loan.status.paid")
              : statusText === "Partially Paid"
              ? t("loan.status.partial")
              : t("loan.status.unpaid")}
          </Text>
        </View>
      </TouchableOpacity>
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    elevation: 1
  },
  name: {
    fontWeight: "700",
    fontSize: 16,
    color: "#111827"
  },
  note: {
    marginTop: 4,
    color: "#6b7280"
  },
  overdueBadge: {
    marginTop: 6,
    alignSelf: "flex-start",
    backgroundColor: "#fee2e2",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3
  },
  overdueText: {
    color: "#b91c1c",
    fontWeight: "700",
    fontSize: 12
  },
  directionBadge: {
    marginTop: 6,
    alignSelf: "flex-start",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3
  },
  receivableBadge: {
    backgroundColor: "#dcfce7"
  },
  payableBadge: {
    backgroundColor: "#ffedd5"
  },
  directionText: {
    fontSize: 11,
    fontWeight: "700"
  },
  receivableText: {
    color: "#166534"
  },
  payableText: {
    color: "#c2410c"
  },
  right: {
    alignItems: "flex-end"
  },
  amount: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827"
  },
  remaining: {
    marginTop: 4,
    fontSize: 12,
    color: "#6b7280",
    fontWeight: "600"
  },
  status: {
    marginTop: 4,
    fontWeight: "700"
  },
  paid: {
    color: "#16a34a"
  },
  partial: {
    color: "#d97706"
  },
  unpaid: {
    color: "#dc2626"
  },
  actions: {
    flexDirection: "row",
    marginBottom: 12
  },
  actionBtn: {
    width: 72,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
    marginLeft: 8
  },
  actionText: {
    color: "#fff",
    fontWeight: "700"
  }
});
