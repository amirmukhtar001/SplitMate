function roundCurrency(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}

export function buildMemberMap(members) {
  return Object.fromEntries((members || []).map((member) => [member.id, member]));
}

export function calculateGroupBalances(groupId, members, expenses, expenseSplits, settlements) {
  const balances = {};
  const memberIds = (members || []).filter((m) => m.group_id === groupId).map((m) => m.id);

  memberIds.forEach((memberId) => {
    balances[memberId] = 0;
  });

  (expenses || [])
    .filter((expense) => expense.group_id === groupId)
    .forEach((expense) => {
      const amount = Number(expense.amount || 0);
      if (balances[expense.paid_by] !== undefined) {
        balances[expense.paid_by] = roundCurrency(balances[expense.paid_by] + amount);
      }
    });

  const expenseIds = new Set(
    (expenses || []).filter((expense) => expense.group_id === groupId).map((expense) => expense.id)
  );

  (expenseSplits || [])
    .filter((split) => expenseIds.has(split.expense_id))
    .forEach((split) => {
      if (balances[split.member_id] !== undefined) {
        balances[split.member_id] = roundCurrency(balances[split.member_id] - Number(split.amount || 0));
      }
    });

  (settlements || [])
    .filter((settlement) => settlement.group_id === groupId)
    .forEach((settlement) => {
      const amount = Number(settlement.amount || 0);
      if (balances[settlement.from_member] !== undefined) {
        balances[settlement.from_member] = roundCurrency(balances[settlement.from_member] + amount);
      }
      if (balances[settlement.to_member] !== undefined) {
        balances[settlement.to_member] = roundCurrency(balances[settlement.to_member] - amount);
      }
    });

  return balances;
}

export function buildSettlementSuggestions(balances) {
  const debtors = [];
  const creditors = [];

  Object.entries(balances || {}).forEach(([memberId, balance]) => {
    const amount = roundCurrency(balance);
    if (amount < -0.009) debtors.push({ memberId, amount: Math.abs(amount) });
    if (amount > 0.009) creditors.push({ memberId, amount });
  });

  debtors.sort((a, b) => b.amount - a.amount);
  creditors.sort((a, b) => b.amount - a.amount);

  const transfers = [];
  let i = 0;
  let j = 0;

  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];
    const transferAmount = roundCurrency(Math.min(debtor.amount, creditor.amount));

    if (transferAmount > 0) {
      transfers.push({
        from_member: debtor.memberId,
        to_member: creditor.memberId,
        amount: transferAmount
      });
    }

    debtor.amount = roundCurrency(debtor.amount - transferAmount);
    creditor.amount = roundCurrency(creditor.amount - transferAmount);

    if (debtor.amount <= 0.009) i += 1;
    if (creditor.amount <= 0.009) j += 1;
  }

  return transfers;
}

export function sumGroupExpenses(groupId, expenses) {
  return roundCurrency(
    (expenses || [])
      .filter((expense) => expense.group_id === groupId)
      .reduce((sum, expense) => sum + Number(expense.amount || 0), 0)
  );
}
