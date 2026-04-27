export function getTotalPaid(loan) {
  if (!Array.isArray(loan?.payments)) return 0;
  return loan.payments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
}

export function getRemainingAmount(loan) {
  const amount = Number(loan?.amount || 0);
  const remaining = amount - getTotalPaid(loan);
  return remaining > 0 ? remaining : 0;
}

export function getLoanStatus(loan) {
  if (loan?.isPaid || getRemainingAmount(loan) <= 0) return "Paid";
  if (getTotalPaid(loan) > 0) return "Partially Paid";
  return "Unpaid";
}

export function isLoanOverdue(loan) {
  if (loan?.isPaid || !loan?.reminderDate) return false;
  const due = new Date(loan.reminderDate);
  if (Number.isNaN(due.getTime())) return false;
  return due < new Date();
}
