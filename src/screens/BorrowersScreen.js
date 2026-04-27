import React, { useCallback, useState } from "react";
import { View, Text, StyleSheet, FlatList } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { getLoans } from "../storage/loanStorage";
import {
  getRemainingAmount,
  getTotalPaid,
  isLoanOverdue
} from "../utils/loanMath";
import { useLanguage } from "../context/LanguageContext";

function groupByBorrower(loans) {
  const map = new Map();

  loans.forEach((loan) => {
    const rawName = String(loan.name || "").trim();
    const key = rawName.toLowerCase();
    if (!key) return;

    if (!map.has(key)) {
      map.set(key, {
        key,
        name: rawName,
        loanCount: 0,
        totalLent: 0,
        totalPaid: 0,
        totalPending: 0,
        overdueCount: 0
      });
    }

    const bucket = map.get(key);
    bucket.loanCount += 1;
    bucket.totalLent += Number(loan.amount || 0);
    bucket.totalPaid += getTotalPaid(loan);
    bucket.totalPending += getRemainingAmount(loan);
    bucket.overdueCount += isLoanOverdue(loan) ? 1 : 0;
  });

  return Array.from(map.values()).sort((a, b) => b.totalPending - a.totalPending);
}

function BorrowerCard({ item, t }) {
  return (
    <View style={styles.card}>
      <Text style={styles.name}>{item.name}</Text>
      <Text style={styles.meta}>{t("borrowers.loans", { count: item.loanCount })}</Text>
      <Text style={styles.meta}>{t("borrowers.totalLent", { amount: `Rs. ${item.totalLent}` })}</Text>
      <Text style={styles.meta}>{t("borrowers.recovered", { amount: `Rs. ${item.totalPaid}` })}</Text>
      <Text style={styles.pending}>{t("borrowers.pending", { amount: `Rs. ${item.totalPending}` })}</Text>
      {item.overdueCount > 0 ? (
        <Text style={styles.overdue}>{t("borrowers.overdueCount", { count: item.overdueCount })}</Text>
      ) : null}
    </View>
  );
}

export default function BorrowersScreen() {
  const { t } = useLanguage();
  const [borrowers, setBorrowers] = useState([]);

  useFocusEffect(
    useCallback(() => {
      const load = async () => {
        const loans = await getLoans();
        setBorrowers(groupByBorrower(loans));
      };
      load();
    }, [])
  );

  return (
    <FlatList
      data={borrowers}
      keyExtractor={(item) => item.key}
      renderItem={({ item }) => <BorrowerCard item={item} t={t} />}
      contentContainerStyle={styles.listContent}
      ListEmptyComponent={
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>{t("borrowers.noData")}</Text>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  listContent: {
    padding: 16,
    backgroundColor: "#f3f4f6",
    flexGrow: 1
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    marginBottom: 10
  },
  name: {
    color: "#111827",
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 4
  },
  meta: {
    color: "#374151",
    marginBottom: 2
  },
  pending: {
    marginTop: 4,
    color: "#b91c1c",
    fontWeight: "700"
  },
  overdue: {
    marginTop: 2,
    color: "#dc2626",
    fontWeight: "700"
  },
  emptyBox: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1
  },
  emptyText: {
    color: "#6b7280"
  }
});
