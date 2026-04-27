import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import LoanItem from "../components/LoanItem";
import { getLoans, deleteLoan, updateLoan } from "../storage/loanStorage";
import {
  cancelLoanReminder,
  scheduleLoanReminder
} from "../utils/notification";
import {
  getLoanStatus,
  getRemainingAmount,
  getTotalPaid,
  isLoanOverdue
} from "../utils/loanMath";
import { useLanguage } from "../context/LanguageContext";

export default function HomeScreen({ navigation }) {
  const { t } = useLanguage();
  const [loans, setLoans] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("ALL");

  const loadLoans = useCallback(async () => {
    const data = await getLoans();
    setLoans(data);
  }, []);

  useFocusEffect(
    useCallback(() => {
      navigation.getParent()?.closeDrawer?.();
      loadLoans();
    }, [loadLoans, navigation])
  );

  const receivableLoans = loans.filter((loan) => loan.loanDirection !== "PAYABLE");
  const payableLoans = loans.filter((loan) => loan.loanDirection === "PAYABLE");
  const totalToReceive = receivableLoans.reduce((sum, loan) => sum + getRemainingAmount(loan), 0);
  const totalToPay = payableLoans.reduce((sum, loan) => sum + getRemainingAmount(loan), 0);
  const netPosition = totalToReceive - totalToPay;

  const normalizedQuery = searchQuery.trim().toLowerCase();

  const filteredLoans = loans.filter((loan) => {
    const name = String(loan.name || "").toLowerCase();
    const note = String(loan.note || "").toLowerCase();
    const amount = String(loan.amount || "").toLowerCase();
    const matchesSearch =
      !normalizedQuery ||
      name.includes(normalizedQuery) ||
      note.includes(normalizedQuery) ||
      amount.includes(normalizedQuery);

    if (!matchesSearch) return false;

    if (activeFilter === "UNPAID") return !loan.isPaid;
    if (activeFilter === "PAID") return loan.isPaid;
    if (activeFilter === "OVERDUE") return isLoanOverdue(loan);

    return true;
  });

  const sortedLoans = [...filteredLoans].sort((a, b) => {
    const createdA = new Date(a.createdAt || a.date || 0).getTime();
    const createdB = new Date(b.createdAt || b.date || 0).getTime();
    return createdB - createdA;
  });

  const getOverdueDays = useCallback((loan) => {
    if (!isLoanOverdue(loan)) return 0;
    const due = new Date(loan.reminderDate);
    const diffMs = Date.now() - due.getTime();
    return Math.max(1, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
  }, []);

  const handleTogglePaid = async (loan) => {
    const nextPaid = !loan.isPaid;
    let notificationId = loan.notificationId || null;

    if (nextPaid) {
      await cancelLoanReminder(notificationId);
      notificationId = null;
    } else if (loan.reminderDate) {
      notificationId = await scheduleLoanReminder(loan);
    }

    const updated = await updateLoan(loan.id, { isPaid: nextPaid, notificationId });
    setLoans(updated);
  };

  const handleDelete = async (loan) => {
    Alert.alert(t("home.deleteTitle"), t("home.deleteMessage", { name: loan.name }), [
      { text: t("home.cancel"), style: "cancel" },
      {
        text: t("home.delete"),
        style: "destructive",
        onPress: async () => {
          await cancelLoanReminder(loan.notificationId);
          const updated = await deleteLoan(loan.id);
          setLoans(updated);
        }
      }
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.summaryRow}>
        <View style={[styles.statCard, styles.givenCard]}>
          <Text style={styles.statLabel}>{t("home.totalReceive")}</Text>
          <Text style={styles.statValue}>Rs. {totalToReceive}</Text>
        </View>
        <View style={[styles.statCard, styles.pendingCard]}>
          <Text style={styles.statLabel}>{t("home.totalPay")}</Text>
          <Text style={styles.statValue}>Rs. {totalToPay}</Text>
        </View>
      </View>
      <View style={styles.recoveredBox}>
        <Text style={styles.recoveredText}>
          {t("home.netPosition", { amount: `${netPosition >= 0 ? "+" : "-"}Rs. ${Math.abs(netPosition)}` })}
        </Text>
      </View>

      <TextInput
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder={t("home.searchPlaceholder")}
        style={styles.searchInput}
      />

      <View style={styles.filtersRow}>
        {[
          { key: "ALL", label: t("home.filter.all") },
          { key: "UNPAID", label: t("home.filter.unpaid") },
          { key: "PAID", label: t("home.filter.paid") },
          { key: "OVERDUE", label: t("home.filter.overdue") }
        ].map((filter) => {
          const isActive = activeFilter === filter.key;
          return (
            <TouchableOpacity
              key={filter.key}
              style={[styles.filterChip, isActive ? styles.filterChipActive : null]}
              onPress={() => setActiveFilter(filter.key)}
            >
              <Text style={[styles.filterChipText, isActive ? styles.filterChipTextActive : null]}>
                {filter.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <FlatList
        data={sortedLoans}
        style={styles.list}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <LoanItem
            loan={item}
            isOverdue={isLoanOverdue(item)}
            overdueDays={getOverdueDays(item)}
            remainingAmount={getRemainingAmount(item)}
            statusText={getLoanStatus(item)}
            directionType={item.loanDirection}
            directionLabel={t(
              item.loanDirection === "PAYABLE" ? "loan.direction.payableShort" : "loan.direction.receivableShort"
            )}
            onPress={() => navigation.navigate("Detail", { loanId: item.id })}
            onAddPayment={() => navigation.navigate("AddPayment", { loanId: item.id })}
            onEdit={() => navigation.navigate("EditLoan", { loanId: item.id })}
            onTogglePaid={() => handleTogglePaid(item)}
            onDelete={() => handleDelete(item)}
          />
        )}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>
              {loans.length === 0
                ? t("home.empty.noLoans")
                : t("home.empty.noMatch")}
            </Text>
          </View>
        }
      />

      <View style={styles.bottomNavWrapper}>
        <View style={styles.bottomNav}>
          <TouchableOpacity
            style={styles.bottomNavItem}
            onPress={() => navigation.navigate("Dashboard")}
          >
            <Text style={styles.bottomNavIcon}>📊</Text>
            <Text style={styles.bottomNavLabel}>{t("home.dashboard")}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.bottomNavItem}
            onPress={() => navigation.navigate("Borrowers")}
          >
            <Text style={styles.bottomNavIcon}>👥</Text>
            <Text style={styles.bottomNavLabel}>{t("home.borrowers")}</Text>
          </TouchableOpacity>

          <View style={styles.bottomNavCenterGap} />

          <TouchableOpacity
            style={styles.bottomNavItem}
            onPress={() => navigation.getParent()?.navigate("Legal")}
          >
            <Text style={styles.bottomNavIcon}>⚖️</Text>
            <Text style={styles.bottomNavLabel}>{t("home.legal")}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.bottomNavItem}
            onPress={() => navigation.navigate("LanguageSelect")}
          >
            <Text style={styles.bottomNavIcon}>🌐</Text>
            <Text style={styles.bottomNavLabel}>{t("lang.select")}</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.floatingAddButton}
          onPress={() => navigation.navigate("AddLoan")}
        >
          <Text style={styles.floatingAddIcon}>＋</Text>
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
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12
  },
  statCard: {
    width: "48.5%",
    borderRadius: 12,
    padding: 14
  },
  givenCard: {
    backgroundColor: "#dbeafe"
  },
  pendingCard: {
    backgroundColor: "#fee2e2"
  },
  recoveredBox: {
    backgroundColor: "#dcfce7",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 10
  },
  recoveredText: {
    color: "#166534",
    fontWeight: "700"
  },
  statLabel: {
    fontSize: 13,
    color: "#374151",
    marginBottom: 6
  },
  statValue: {
    fontSize: 18,
    color: "#111827",
    fontWeight: "600",
    letterSpacing: 0.2
  },
  searchInput: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10
  },
  filtersRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 10
  },
  filterChip: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: "#fff",
    marginRight: 8,
    marginBottom: 8
  },
  filterChipActive: {
    backgroundColor: "#2563eb",
    borderColor: "#2563eb"
  },
  filterChipText: {
    color: "#374151",
    fontWeight: "600"
  },
  filterChipTextActive: {
    color: "#fff"
  },
  list: {
    flex: 1
  },
  listContent: {
    paddingBottom: 120
  },
  emptyBox: {
    alignItems: "center",
    marginTop: 40
  },
  emptyText: {
    color: "#6b7280"
  },
  bottomNavWrapper: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 12
  },
  bottomNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 18,
    paddingVertical: 8,
    paddingHorizontal: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3
  },
  bottomNavItem: {
    flex: 1,
    minHeight: 46,
    justifyContent: "center",
    alignItems: "center"
  },
  bottomNavCenterGap: {
    width: 62
  },
  bottomNavIcon: {
    fontSize: 16
  },
  bottomNavLabel: {
    color: "#374151",
    fontSize: 11,
    marginTop: 2,
    fontWeight: "600"
  },
  floatingAddButton: {
    position: "absolute",
    alignSelf: "center",
    top: -22,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#7e22ce",
    borderWidth: 4,
    borderColor: "#f3f4f6",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6
  },
  floatingAddIcon: {
    color: "#fff",
    fontSize: 28,
    lineHeight: 30,
    fontWeight: "700"
  }
});
