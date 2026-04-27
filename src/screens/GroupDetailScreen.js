import React, { useCallback, useMemo, useState } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { getSplitMateData } from "../storage/splitmateStorage";
import { buildMemberMap, buildSettlementSuggestions, calculateGroupBalances } from "../utils/splitmateMath";

function formatDate(value) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString();
}

export default function GroupDetailScreen({ route, navigation }) {
  const { groupId } = route.params;
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

  const group = data.groups.find((item) => item.id === groupId);
  const members = data.members.filter((item) => item.group_id === groupId);
  const expenses = data.expenses.filter((item) => item.group_id === groupId);
  const balances = calculateGroupBalances(groupId, data.members, data.expenses, data.expenseSplits, data.settlements);
  const suggestions = buildSettlementSuggestions(balances);
  const memberMap = useMemo(() => buildMemberMap(members), [members]);

  return (
    <View style={styles.container}>
      <Text style={styles.groupTitle}>{group?.name || "Group"}</Text>

      <Text style={styles.sectionTitle}>Members</Text>
      <View style={styles.card}>
        {members.map((member) => (
          <View key={member.id} style={styles.row}>
            <Text style={styles.rowName}>{member.name}</Text>
            <Text style={[styles.balance, (balances[member.id] || 0) >= 0 ? styles.credit : styles.debit]}>
              {(balances[member.id] || 0) >= 0 ? "+" : ""}Rs. {(balances[member.id] || 0).toFixed(2)}
            </Text>
          </View>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Expenses</Text>
      <FlatList
        data={expenses}
        keyExtractor={(item) => item.id}
        style={styles.expenses}
        renderItem={({ item }) => (
          <View style={styles.expenseCard}>
            <Text style={styles.expenseTitle}>{item.title}</Text>
            <Text style={styles.expenseMeta}>Rs. {Number(item.amount || 0).toFixed(2)}</Text>
            <Text style={styles.expenseMeta}>Paid by {memberMap[item.paid_by]?.name || "-"}</Text>
            <Text style={styles.expenseMeta}>{formatDate(item.created_at)}</Text>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.emptyText}>No expenses yet.</Text>}
        contentContainerStyle={styles.expenseListContent}
      />

      <Text style={styles.sectionTitle}>Who owes whom</Text>
      <View style={styles.card}>
        {suggestions.length === 0 ? (
          <Text style={styles.emptyText}>All settled.</Text>
        ) : (
          suggestions.map((item, index) => (
            <Text key={`${item.from_member}-${item.to_member}-${index}`} style={styles.summaryText}>
              {memberMap[item.from_member]?.name || "Unknown"} -> {memberMap[item.to_member]?.name || "Unknown"}: Rs.{" "}
              {Number(item.amount || 0).toFixed(2)}
            </Text>
          ))
        )}
      </View>

      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.actionButton, styles.primaryButton]}
          onPress={() => navigation.navigate("AddExpense", { groupId })}
        >
          <Text style={styles.actionText}>Add Expense</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.secondaryButton]}
          onPress={() => navigation.navigate("SettleUp", { groupId })}
        >
          <Text style={styles.actionText}>Settle Up</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f3f4f6",
    padding: 16
  },
  groupTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 10
  },
  sectionTitle: {
    color: "#374151",
    fontWeight: "700",
    marginBottom: 6,
    marginTop: 6
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    padding: 12,
    marginBottom: 6
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6
  },
  rowName: {
    color: "#111827",
    fontWeight: "600"
  },
  balance: {
    fontWeight: "700"
  },
  credit: {
    color: "#15803d"
  },
  debit: {
    color: "#dc2626"
  },
  expenses: {
    maxHeight: 170
  },
  expenseListContent: {
    paddingBottom: 4
  },
  expenseCard: {
    backgroundColor: "#fff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    padding: 10,
    marginBottom: 8
  },
  expenseTitle: {
    color: "#111827",
    fontWeight: "700"
  },
  expenseMeta: {
    color: "#6b7280",
    marginTop: 2
  },
  emptyText: {
    color: "#6b7280"
  },
  summaryText: {
    color: "#1f2937",
    marginBottom: 4,
    fontWeight: "600"
  },
  buttonRow: {
    flexDirection: "row",
    marginTop: "auto"
  },
  actionButton: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center"
  },
  primaryButton: {
    backgroundColor: "#2563eb",
    marginRight: 6
  },
  secondaryButton: {
    backgroundColor: "#7c3aed",
    marginLeft: 6
  },
  actionText: {
    color: "#fff",
    fontWeight: "700"
  }
});
