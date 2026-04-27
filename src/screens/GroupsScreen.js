import React, { useCallback, useMemo, useState } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useAuth } from "../context/AuthContext";
import { getSplitMateData } from "../storage/splitmateStorage";
import { calculateGroupBalances, sumGroupExpenses } from "../utils/splitmateMath";

export default function GroupsScreen({ navigation }) {
  const { session } = useAuth();
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

  const currentUserName = useMemo(() => {
    const email = session?.user?.email || "";
    const prefix = email.split("@")[0] || "You";
    return prefix.trim() || "You";
  }, [session]);

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>SplitMate</Text>
        <TouchableOpacity style={styles.createButton} onPress={() => navigation.navigate("CreateGroup")}>
          <Text style={styles.createButtonText}>+ Create Group</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={data.groups}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => {
          const balances = calculateGroupBalances(
            item.id,
            data.members,
            data.expenses,
            data.expenseSplits,
            data.settlements
          );
          const totalExpenses = sumGroupExpenses(item.id, data.expenses);
          const groupMembers = data.members.filter((m) => m.group_id === item.id);
          const me =
            groupMembers.find((m) => m.user_id === session?.user?.id) ||
            groupMembers.find((m) => m.name.toLowerCase() === currentUserName.toLowerCase()) ||
            groupMembers[0];
          const myBalance = me ? balances[me.id] || 0 : 0;
          const isPositive = myBalance >= 0;

          return (
            <TouchableOpacity
              style={styles.card}
              onPress={() => navigation.navigate("GroupDetail", { groupId: item.id })}
            >
              <Text style={styles.groupName}>{item.name}</Text>
              <Text style={styles.meta}>Total expenses: Rs. {totalExpenses.toFixed(2)}</Text>
              <Text style={[styles.balance, isPositive ? styles.credit : styles.debit]}>
                {isPositive ? "You get" : "You owe"} Rs. {Math.abs(myBalance).toFixed(2)}
              </Text>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>No groups yet. Create your first group.</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f3f4f6",
    padding: 16
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827"
  },
  createButton: {
    backgroundColor: "#2563eb",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10
  },
  createButtonText: {
    color: "#fff",
    fontWeight: "700"
  },
  listContent: {
    paddingBottom: 20
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb"
  },
  groupName: {
    color: "#111827",
    fontWeight: "700",
    fontSize: 17
  },
  meta: {
    color: "#6b7280",
    marginTop: 4
  },
  balance: {
    marginTop: 8,
    fontWeight: "700"
  },
  credit: {
    color: "#15803d"
  },
  debit: {
    color: "#dc2626"
  },
  emptyBox: {
    alignItems: "center",
    marginTop: 40
  },
  emptyText: {
    color: "#6b7280"
  }
});
