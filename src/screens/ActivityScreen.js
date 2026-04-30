import React, { useCallback, useMemo, useState } from "react";
import { View, Text, StyleSheet, FlatList } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { getSplitMateData } from "../storage/splitmateStorage";

function formatCurrency(value) {
  return `PKR ${Number(value || 0).toFixed(2)}`;
}

function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString();
}

export default function ActivityScreen() {
  const [data, setData] = useState({
    groups: [],
    members: [],
    expenses: [],
    expenseSplits: [],
    settlements: []
  });

  const load = useCallback(async () => {
    const payload = await getSplitMateData();
    setData(payload);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const groupMap = useMemo(() => {
    const map = {};
    data.groups.forEach((group) => {
      map[group.id] = group;
    });
    return map;
  }, [data.groups]);

  const memberMap = useMemo(() => {
    const map = {};
    data.members.forEach((member) => {
      map[member.id] = member;
    });
    return map;
  }, [data.members]);

  const activities = useMemo(() => {
    const expenseItems = data.expenses.map((expense) => ({
      id: `expense-${expense.id}`,
      createdAt: expense.created_at,
      type: "expense",
      title: expense.title || "Expense",
      amount: expense.amount,
      groupName: groupMap[expense.group_id]?.name || "Group",
      subtitle: `Paid by ${memberMap[expense.paid_by]?.name || "Unknown"}`
    }));

    const settlementItems = data.settlements.map((settlement) => ({
      id: `settlement-${settlement.id}`,
      createdAt: settlement.created_at,
      type: "settlement",
      title: "Settlement",
      amount: settlement.amount,
      groupName: groupMap[settlement.group_id]?.name || "Group",
      subtitle: `${memberMap[settlement.from_member]?.name || "Unknown"} paid ${
        memberMap[settlement.to_member]?.name || "Unknown"
      }`
    }));

    return [...expenseItems, ...settlementItems].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [data.expenses, data.settlements, groupMap, memberMap]);

  return (
    <View style={styles.container}>
      <Text style={styles.screenTitle}>Activity</Text>
      <Text style={styles.screenSubtitle}>Recent expenses and settlements across all groups.</Text>

      <FlatList
        data={activities}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => {
          const isExpense = item.type === "expense";
          return (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={[styles.typeChip, isExpense ? styles.expenseChip : styles.settlementChip]}>
                  {isExpense ? "Expense" : "Settlement"}
                </Text>
                <Text style={styles.dateText}>{formatDate(item.createdAt)}</Text>
              </View>
              <Text style={styles.titleText}>{item.title}</Text>
              <Text style={styles.metaText}>{item.groupName}</Text>
              <Text style={styles.metaText}>{item.subtitle}</Text>
              <Text style={[styles.amountText, isExpense ? styles.expenseAmount : styles.settlementAmount]}>
                {formatCurrency(item.amount)}
              </Text>
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text style={styles.emptyTitle}>No activity yet</Text>
            <Text style={styles.emptyText}>Add an expense or settle up to see history here.</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
    padding: 16
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#0f172a"
  },
  screenSubtitle: {
    marginTop: 4,
    marginBottom: 14,
    color: "#64748b"
  },
  listContent: {
    paddingBottom: 20
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 13,
    marginBottom: 10
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8
  },
  typeChip: {
    fontSize: 12,
    fontWeight: "700",
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999
  },
  expenseChip: {
    color: "#0f766e",
    backgroundColor: "#ccfbf1"
  },
  settlementChip: {
    color: "#1d4ed8",
    backgroundColor: "#dbeafe"
  },
  dateText: {
    fontSize: 12,
    color: "#94a3b8"
  },
  titleText: {
    color: "#0f172a",
    fontWeight: "700",
    fontSize: 16
  },
  metaText: {
    marginTop: 3,
    color: "#64748b"
  },
  amountText: {
    marginTop: 10,
    fontSize: 18,
    fontWeight: "700"
  },
  expenseAmount: {
    color: "#d97706"
  },
  settlementAmount: {
    color: "#2563eb"
  },
  emptyBox: {
    marginTop: 70,
    alignItems: "center",
    paddingHorizontal: 20
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#334155"
  },
  emptyText: {
    marginTop: 6,
    color: "#64748b",
    textAlign: "center"
  }
});
