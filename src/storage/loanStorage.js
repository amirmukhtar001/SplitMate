import { DEFAULT_LANGUAGE } from "../i18n/translations";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { isSupabaseConfigured, supabase } from "../lib/supabaseClient";

const LOANS_KEY = "loans";
const LOANS_TABLE = "loans";
const DEFAULT_LOAN_DIRECTION = "RECEIVABLE";

function formatErrorMessage(error, fallback = "Unknown error") {
  if (!error) return fallback;
  if (typeof error === "string") return error;
  if (typeof error.message === "string" && error.message.trim()) return error.message.trim();
  if (typeof error.error_description === "string" && error.error_description.trim()) {
    return error.error_description.trim();
  }
  return fallback;
}

function normalizeLoan(loan) {
  return {
    ...loan,
    payments: Array.isArray(loan.payments) ? loan.payments : [],
    reminderRepeat: loan.reminderRepeat || "NONE",
    language: loan.language || DEFAULT_LANGUAGE,
    loanDirection:
      loan.loanDirection === "PAYABLE" || loan.loanDirection === "RECEIVABLE"
        ? loan.loanDirection
        : DEFAULT_LOAN_DIRECTION
  };
}

function fromRemoteRow(row) {
  return normalizeLoan({
    id: row.id,
    name: row.name,
    amount: Number(row.amount || 0),
    note: row.note || "",
    payments: Array.isArray(row.payments) ? row.payments : [],
    date: row.loan_date || row.created_at?.split("T")[0],
    reminderDate: row.reminder_date || null,
    reminderRepeat: row.reminder_repeat || "NONE",
    isPaid: Boolean(row.is_paid),
    createdAt: row.created_at || new Date().toISOString(),
    notificationId: row.notification_id || null,
    language: row.language || DEFAULT_LANGUAGE,
    loanDirection: row.loan_direction || DEFAULT_LOAN_DIRECTION
  });
}

function toRemoteRow(loan) {
  const normalized = normalizeLoan(loan);
  return {
    id: normalized.id,
    name: normalized.name,
    amount: Number(normalized.amount || 0),
    note: normalized.note || "",
    payments: normalized.payments,
    loan_date: normalized.date,
    reminder_date: normalized.reminderDate,
    reminder_repeat: normalized.reminderRepeat || "NONE",
    is_paid: Boolean(normalized.isPaid),
    created_at: normalized.createdAt || new Date().toISOString(),
    updated_at: new Date().toISOString(),
    notification_id: normalized.notificationId || null,
    language: normalized.language || DEFAULT_LANGUAGE,
    loan_direction: normalized.loanDirection || DEFAULT_LOAN_DIRECTION
  };
}

function toRemotePatch(data) {
  const patch = { updated_at: new Date().toISOString() };

  if (Object.prototype.hasOwnProperty.call(data, "name")) patch.name = data.name;
  if (Object.prototype.hasOwnProperty.call(data, "amount")) patch.amount = Number(data.amount || 0);
  if (Object.prototype.hasOwnProperty.call(data, "note")) patch.note = data.note || "";
  if (Object.prototype.hasOwnProperty.call(data, "payments")) {
    patch.payments = Array.isArray(data.payments) ? data.payments : [];
  }
  if (Object.prototype.hasOwnProperty.call(data, "date")) patch.loan_date = data.date;
  if (Object.prototype.hasOwnProperty.call(data, "reminderDate")) patch.reminder_date = data.reminderDate;
  if (Object.prototype.hasOwnProperty.call(data, "reminderRepeat")) {
    patch.reminder_repeat = data.reminderRepeat || "NONE";
  }
  if (Object.prototype.hasOwnProperty.call(data, "isPaid")) patch.is_paid = Boolean(data.isPaid);
  if (Object.prototype.hasOwnProperty.call(data, "notificationId")) {
    patch.notification_id = data.notificationId || null;
  }
  if (Object.prototype.hasOwnProperty.call(data, "language")) {
    patch.language = data.language || DEFAULT_LANGUAGE;
  }
  if (Object.prototype.hasOwnProperty.call(data, "loanDirection")) {
    patch.loan_direction =
      data.loanDirection === "PAYABLE" || data.loanDirection === "RECEIVABLE"
        ? data.loanDirection
        : DEFAULT_LOAN_DIRECTION;
  }

  return patch;
}

async function getLocalLoans() {
  const data = await AsyncStorage.getItem(LOANS_KEY);
  const parsed = data ? JSON.parse(data) : [];
  if (!Array.isArray(parsed)) return [];
  return parsed.map(normalizeLoan);
}

async function syncLoansFromRemote() {
  if (!isSupabaseConfigured || !supabase) return getLocalLoans();

  const { data, error } = await supabase
    .from(LOANS_TABLE)
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  const mapped = Array.isArray(data) ? data.map(fromRemoteRow) : [];
  await saveLoans(mapped);
  return mapped;
}

export async function getLoans() {
  try {
    const localLoans = await getLocalLoans();

    if (!isSupabaseConfigured || !supabase) {
      return localLoans;
    }

    try {
      return await syncLoansFromRemote();
    } catch (remoteError) {
      console.warn(`Supabase sync failed, using local cache: ${formatErrorMessage(remoteError)}`);
      return localLoans;
    }
  } catch (error) {
    console.warn(`Failed to load loans: ${formatErrorMessage(error)}`);
    return [];
  }
}

export async function saveLoans(loans) {
  await AsyncStorage.setItem(LOANS_KEY, JSON.stringify(loans));
}

export async function addLoan(loan) {
  const normalized = normalizeLoan(loan);

  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase.from(LOANS_TABLE).insert(toRemoteRow(normalized));
      if (!error) {
        return await syncLoansFromRemote();
      }
      console.warn(`Supabase add loan failed, saving locally: ${formatErrorMessage(error)}`);
    } catch (remoteError) {
      console.warn(`Supabase add loan failed, saving locally: ${formatErrorMessage(remoteError)}`);
    }
  }

  const loans = await getLocalLoans();
  const updated = [normalized, ...loans];
  await saveLoans(updated);
  return updated;
}

export async function updateLoan(id, data) {
  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase
        .from(LOANS_TABLE)
        .update(toRemotePatch(data))
        .eq("id", id);

      if (!error) {
        return await syncLoansFromRemote();
      }
      console.warn(`Supabase update loan failed, using local cache: ${formatErrorMessage(error)}`);
    } catch (remoteError) {
      console.warn(`Supabase update loan failed, using local cache: ${formatErrorMessage(remoteError)}`);
    }
  }

  const loans = await getLocalLoans();
  const updated = loans.map((loan) => (loan.id === id ? normalizeLoan({ ...loan, ...data }) : loan));
  await saveLoans(updated);
  return updated;
}

export async function deleteLoan(id) {
  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase.from(LOANS_TABLE).delete().eq("id", id);
      if (!error) {
        return await syncLoansFromRemote();
      }
      console.warn(`Supabase delete loan failed, using local cache: ${formatErrorMessage(error)}`);
    } catch (remoteError) {
      console.warn(`Supabase delete loan failed, using local cache: ${formatErrorMessage(remoteError)}`);
    }
  }

  const loans = await getLocalLoans();
  const updated = loans.filter((loan) => loan.id !== id);
  await saveLoans(updated);
  return updated;
}

export async function addPaymentToLoan(loanId, payment) {
  const loans = await getLoans();
  const targetLoan = loans.find((loan) => loan.id === loanId);
  if (!targetLoan) return loans;

  const payments = [...targetLoan.payments, payment];
  const totalPaid = payments.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const amount = Number(targetLoan.amount || 0);
  const isPaid = totalPaid >= amount;

  return updateLoan(loanId, { payments, isPaid });
}
