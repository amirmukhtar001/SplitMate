import React, { useCallback, useMemo, useState } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Pressable } from "react-native";
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

  const groupCards = useMemo(() => {
    return data.groups.map((group) => {
      const balances = calculateGroupBalances(
        group.id,
        data.members,
        data.expenses,
        data.expenseSplits,
        data.settlements
      );
      const totalExpenses = sumGroupExpenses(group.id, data.expenses);
      const groupMembers = data.members.filter((m) => m.group_id === group.id);
      const me =
        groupMembers.find((m) => m.user_id === session?.user?.id) ||
        groupMembers.find((m) => m.name.toLowerCase() === currentUserName.toLowerCase()) ||
        groupMembers[0];
      const myBalance = me ? balances[me.id] || 0 : 0;
      const settledCount = Object.values(balances).filter((value) => Math.abs(value) < 0.01).length;

      return {
        ...group,
        totalExpenses,
        memberCount: groupMembers.length,
        myBalance,
        settledCount
      };
    });
  }, [currentUserName, data.expenseSplits, data.expenses, data.groups, data.members, data.settlements, session?.user?.id]);

  const totals = useMemo(() => {
    let youOwe = 0;
    let youAreOwed = 0;

    groupCards.forEach((group) => {
      if (group.myBalance >= 0) {
        youAreOwed += group.myBalance;
      } else {
        youOwe += Math.abs(group.myBalance);
      }
    });

    return { youOwe, youAreOwed };
  }, [groupCards]);

  const formatCurrency = useCallback((value) => `PKR ${value.toFixed(2)}`, []);

  const getInitials = useCallback((name) => {
    if (!name) return "SM";
    return name
      .split(" ")
      .map((part) => part.trim()[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase();
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.headerEyebrow}>Overview</Text>
          <Text style={styles.headerTitle}>SplitMate</Text>
        </View>
        <Pressable style={styles.headerIconButton} onPress={() => navigation.navigate("Activity")}>
          <Text style={styles.headerIconText}>Act</Text>
        </Pressable>
      </View>

      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>You owe</Text>
          <Text style={[styles.summaryAmount, styles.debit]}>{formatCurrency(totals.youOwe)}</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>You are owed</Text>
          <Text style={[styles.summaryAmount, styles.credit]}>{formatCurrency(totals.youAreOwed)}</Text>
        </View>
      </View>

      <FlatList
        data={groupCards}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => {
          const isPositive = item.myBalance >= 0;
          const balanceText = isPositive ? "you are owed" : "you owe";

          return (
            <TouchableOpacity
              style={styles.card}
              onPress={() => navigation.navigate("GroupDetail", { groupId: item.id })}
            >
              <View style={styles.cardTopRow}>
                <View style={styles.groupAvatar}>
                  <Text style={styles.groupAvatarText}>{getInitials(item.name)}</Text>
                </View>
                <View style={styles.cardTitleWrap}>
                  <Text style={styles.groupName}>{item.name}</Text>
                  <Text style={styles.meta}>
                    {item.memberCount} members • total {formatCurrency(item.totalExpenses)}
                  </Text>
                </View>
              </View>

              <Text style={[styles.balance, isPositive ? styles.credit : styles.debit]}>
                {balanceText} {formatCurrency(Math.abs(item.myBalance))}
              </Text>
              <Text style={styles.subMeta}>{item.settledCount} settled balances in this group</Text>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text style={styles.emptyTitle}>No groups yet</Text>
            <Text style={styles.emptyText}>Create your first group to start splitting expenses.</Text>
          </View>
        }
      />

      <View style={styles.footerActions}>
        <TouchableOpacity style={styles.secondaryButton} onPress={() => navigation.navigate("CreateGroup")}>
          <Text style={styles.secondaryButtonText}>Create Group</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.primaryButton} onPress={() => navigation.navigate("AddExpense")}>
          <Text style={styles.primaryButtonText}>Add expense</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
    padding: 16
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginBottom: 14
  },
  headerEyebrow: {
    color: "#64748b",
    fontSize: 13,
    marginBottom: 2,
    fontWeight: "600"
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#0f172a"
  },
  headerIconButton: {
    height: 36,
    width: 36,
    borderRadius: 18,
    backgroundColor: "#e2e8f0",
    alignItems: "center",
    justifyContent: "center"
  },
  headerIconText: {
    color: "#334155",
    fontSize: 16,
    fontWeight: "700"
  },
  summaryRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 14
  },
  summaryCard: {
    flex: 1,
    backgroundColor: "#ffffff",
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0"
  },
  summaryLabel: {
    color: "#64748b",
    fontSize: 12,
    marginBottom: 5,
    fontWeight: "600"
  },
  summaryAmount: {
    fontSize: 18,
    fontWeight: "700"
  },
  listContent: {
    paddingBottom: 96
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0"
  },
  cardTopRow: {
    flexDirection: "row",
    alignItems: "center"
  },
  groupAvatar: {
    height: 44,
    width: 44,
    borderRadius: 12,
    backgroundColor: "#0ea5a4",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12
  },
  groupAvatarText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 14
  },
  cardTitleWrap: {
    flex: 1
  },
  groupName: {
    color: "#0f172a",
    fontWeight: "700",
    fontSize: 17
  },
  meta: {
    color: "#64748b",
    marginTop: 3
  },
  balance: {
    marginTop: 10,
    fontWeight: "700",
    fontSize: 20
  },
  subMeta: {
    marginTop: 4,
    color: "#94a3b8",
    fontSize: 13
  },
  credit: {
    color: "#059669"
  },
  debit: {
    color: "#d97706"
  },
  emptyBox: {
    alignItems: "center",
    marginTop: 60,
    paddingHorizontal: 22
  },
  emptyTitle: {
    color: "#334155",
    fontWeight: "700",
    fontSize: 18,
    marginBottom: 6
  },
  emptyText: {
    color: "#64748b",
    textAlign: "center"
  },
  footerActions: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 18,
    flexDirection: "row",
    gap: 10
  },
  secondaryButton: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#0ea5a4",
    backgroundColor: "#f0fdfa",
    paddingVertical: 14,
    alignItems: "center"
  },
  secondaryButtonText: {
    color: "#0f766e",
    fontWeight: "700"
  },
  primaryButton: {
    flex: 1.2,
    borderRadius: 14,
    backgroundColor: "#0ea5a4",
    paddingVertical: 14,
    alignItems: "center"
  },
  primaryButtonText: {
    color: "#ffffff",
    fontWeight: "700"
  }
});
