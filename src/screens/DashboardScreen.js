import React, { useCallback, useState } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { getLoans } from "../storage/loanStorage";
import {
  getRemainingAmount,
  getTotalPaid,
  isLoanOverdue
} from "../utils/loanMath";
import { useLanguage } from "../context/LanguageContext";

function isInCurrentMonth(dateValue) {
  if (!dateValue) return false;
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return false;
  const now = new Date();
  return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
}

function StatCard({ label, value, tint }) {
  return (
    <View style={[styles.card, tint]}>
      <Text style={styles.cardLabel}>{label}</Text>
      <Text style={styles.cardValue}>{value}</Text>
    </View>
  );
}

function formatCurrency(value) {
  return `Rs. ${Math.round(Number(value || 0))}`;
}

function buildTopBorrowers(loans) {
  const groups = new Map();

  loans.forEach((loan) => {
    const key = String(loan.name || "").trim().toLowerCase();
    if (!key) return;

    if (!groups.has(key)) {
      groups.set(key, {
        key,
        name: String(loan.name || "").trim(),
        pending: 0,
        overdue: 0,
        totalLoans: 0
      });
    }

    const bucket = groups.get(key);
    bucket.pending += getRemainingAmount(loan);
    bucket.overdue += isLoanOverdue(loan) ? 1 : 0;
    bucket.totalLoans += 1;
  });

  return Array.from(groups.values()).sort((a, b) => b.pending - a.pending).slice(0, 5);
}

export default function DashboardScreen() {
  const { t } = useLanguage();
  const [stats, setStats] = useState({
    totalLent: 0,
    totalRecovered: 0,
    totalPending: 0,
    totalPayable: 0,
    overdueCount: 0,
    monthLent: 0,
    monthRecovered: 0,
    activeLoanCount: 0,
    partialLoanCount: 0,
    paidLoanCount: 0,
    monthlyPaymentCount: 0,
    topBorrowers: []
  });

  useFocusEffect(
    useCallback(() => {
      const load = async () => {
        const loans = await getLoans();
        const receivableLoans = loans.filter((loan) => loan.loanDirection !== "PAYABLE");
        const payableLoans = loans.filter((loan) => loan.loanDirection === "PAYABLE");

        const totalLent = receivableLoans.reduce((sum, loan) => sum + Number(loan.amount || 0), 0);
        const totalRecovered = receivableLoans.reduce((sum, loan) => sum + getTotalPaid(loan), 0);
        const totalPending = receivableLoans.reduce((sum, loan) => sum + getRemainingAmount(loan), 0);
        const totalPayable = payableLoans.reduce((sum, loan) => sum + getRemainingAmount(loan), 0);
        const overdueCount = loans.filter((loan) => isLoanOverdue(loan)).length;
        const monthLent = receivableLoans
          .filter((loan) => isInCurrentMonth(loan.date || loan.createdAt))
          .reduce((sum, loan) => sum + Number(loan.amount || 0), 0);
        const monthRecovered = loans.reduce((sum, loan) => {
          if (!Array.isArray(loan.payments)) return sum;
          const currentMonthPayments = loan.payments.filter((payment) =>
            isInCurrentMonth(payment.createdAt)
          );
          return (
            sum + currentMonthPayments.reduce((acc, payment) => acc + Number(payment.amount || 0), 0)
          );
        }, 0);
        const activeLoanCount = loans.filter((loan) => getRemainingAmount(loan) > 0).length;
        const paidLoanCount = loans.filter((loan) => getRemainingAmount(loan) <= 0).length;
        const partialLoanCount = loans.filter((loan) => {
          const paid = getTotalPaid(loan);
          const remaining = getRemainingAmount(loan);
          return paid > 0 && remaining > 0;
        }).length;
        const monthlyPaymentCount = loans.reduce((sum, loan) => {
          if (!Array.isArray(loan.payments)) return sum;
          return sum + loan.payments.filter((payment) => isInCurrentMonth(payment.createdAt)).length;
        }, 0);
        const topBorrowers = buildTopBorrowers(loans);

        setStats({
          totalLent,
          totalRecovered,
          totalPending,
          totalPayable,
          overdueCount,
          monthLent,
          monthRecovered,
          activeLoanCount,
          partialLoanCount,
          paidLoanCount,
          monthlyPaymentCount,
          topBorrowers
        });
      };

      load();
    }, [])
  );

  const recoveryRate =
    stats.totalLent > 0 ? Math.min(100, Math.round((stats.totalRecovered / stats.totalLent) * 100)) : 0;
  const monthlyNet = stats.monthRecovered - stats.monthLent;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.heroCard}>
        <Text style={styles.heroTitle}>{t("dashboard.collectionHealth")}</Text>
        <Text style={styles.heroValue}>{t("dashboard.recoveredPercent", { percent: recoveryRate })}</Text>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${recoveryRate}%` }]} />
        </View>
        <Text style={styles.heroSubtext}>
          {t("dashboard.recoveredOutOf", {
            recovered: formatCurrency(stats.totalRecovered),
            lent: formatCurrency(stats.totalLent)
          })}
        </Text>
      </View>

      <Text style={styles.sectionTitle}>{t("dashboard.section.overall")}</Text>
      <View style={styles.grid}>
        <StatCard label={t("dashboard.totalLent")} value={formatCurrency(stats.totalLent)} tint={styles.blue} />
        <StatCard
          label={t("dashboard.totalRecovered")}
          value={formatCurrency(stats.totalRecovered)}
          tint={styles.green}
        />
        <StatCard label={t("dashboard.totalPending")} value={formatCurrency(stats.totalPending)} tint={styles.red} />
        <StatCard label={t("dashboard.totalPayable")} value={formatCurrency(stats.totalPayable)} tint={styles.orange} />
      </View>

      <Text style={styles.sectionTitle}>{t("dashboard.section.portfolio")}</Text>
      <View style={styles.grid}>
        <StatCard label={t("dashboard.activeLoans")} value={String(stats.activeLoanCount)} tint={styles.sky} />
        <StatCard label={t("dashboard.partialLoans")} value={String(stats.partialLoanCount)} tint={styles.yellow} />
        <StatCard label={t("dashboard.paidLoans")} value={String(stats.paidLoanCount)} tint={styles.mint} />
      </View>

      <Text style={styles.sectionTitle}>{t("dashboard.section.month")}</Text>
      <View style={styles.grid}>
        <StatCard label={t("dashboard.monthLent")} value={formatCurrency(stats.monthLent)} tint={styles.purple} />
        <StatCard
          label={t("dashboard.monthRecovered")}
          value={formatCurrency(stats.monthRecovered)}
          tint={styles.teal}
        />
        <StatCard
          label={t("dashboard.monthNet")}
          value={`${monthlyNet >= 0 ? "+" : "-"}${formatCurrency(Math.abs(monthlyNet))}`}
          tint={monthlyNet >= 0 ? styles.mint : styles.lightRed}
        />
        <StatCard
          label={t("dashboard.monthPayments")}
          value={String(stats.monthlyPaymentCount)}
          tint={styles.peach}
        />
      </View>

      <Text style={styles.sectionTitle}>{t("dashboard.section.topBorrowers")}</Text>
      <View style={styles.listCard}>
        {stats.topBorrowers.length === 0 ? (
          <Text style={styles.emptyText}>{t("dashboard.topBorrowersEmpty")}</Text>
        ) : (
          stats.topBorrowers.map((borrower) => (
            <View key={borrower.key} style={styles.borrowerRow}>
              <View>
                <Text style={styles.borrowerName}>{borrower.name}</Text>
                <Text style={styles.borrowerMeta}>
                  {t("dashboard.borrowerMeta", {
                    loans: borrower.totalLoans,
                    overdue: borrower.overdue
                  })}
                </Text>
              </View>
              <Text style={styles.borrowerPending}>{formatCurrency(borrower.pending)}</Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: "#f3f4f6"
  },
  heroCard: {
    backgroundColor: "#111827",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10
  },
  heroTitle: {
    color: "#d1d5db",
    fontWeight: "600"
  },
  heroValue: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 24,
    marginTop: 2
  },
  heroSubtext: {
    color: "#9ca3af",
    marginTop: 8
  },
  progressTrack: {
    marginTop: 10,
    height: 10,
    borderRadius: 999,
    backgroundColor: "#374151",
    overflow: "hidden"
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#22c55e"
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 10,
    marginTop: 6
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 8
  },
  card: {
    width: "48%",
    borderRadius: 12,
    padding: 12,
    marginBottom: 10
  },
  cardLabel: {
    color: "#374151",
    fontWeight: "600",
    marginBottom: 4
  },
  cardValue: {
    color: "#111827",
    fontWeight: "700",
    fontSize: 18
  },
  listCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    marginBottom: 10
  },
  borrowerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6"
  },
  borrowerName: {
    color: "#111827",
    fontWeight: "700"
  },
  borrowerMeta: {
    color: "#6b7280",
    marginTop: 2,
    fontSize: 12
  },
  borrowerPending: {
    color: "#b91c1c",
    fontWeight: "700"
  },
  emptyText: {
    color: "#6b7280"
  },
  blue: { backgroundColor: "#dbeafe" },
  green: { backgroundColor: "#dcfce7" },
  red: { backgroundColor: "#fee2e2" },
  orange: { backgroundColor: "#ffedd5" },
  purple: { backgroundColor: "#ede9fe" },
  teal: { backgroundColor: "#ccfbf1" },
  sky: { backgroundColor: "#e0f2fe" },
  yellow: { backgroundColor: "#fef9c3" },
  mint: { backgroundColor: "#d1fae5" },
  peach: { backgroundColor: "#ffedd5" },
  lightRed: { backgroundColor: "#fee2e2" }
});
