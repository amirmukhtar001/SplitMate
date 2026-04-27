import AsyncStorage from "@react-native-async-storage/async-storage";
import { isSupabaseConfigured, supabase } from "../lib/supabaseClient";

const STORAGE_KEY = "splitmate_data_v1";

const TABLES = {
  groups: "groups",
  members: "members",
  expenses: "expenses",
  expenseSplits: "expense_splits",
  settlements: "settlements"
};

const EMPTY_DATA = {
  groups: [],
  members: [],
  expenses: [],
  expenseSplits: [],
  settlements: []
};

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function normalizeData(payload) {
  return {
    groups: Array.isArray(payload?.groups) ? payload.groups : [],
    members: Array.isArray(payload?.members) ? payload.members : [],
    expenses: Array.isArray(payload?.expenses) ? payload.expenses : [],
    expenseSplits: Array.isArray(payload?.expenseSplits) ? payload.expenseSplits : [],
    settlements: Array.isArray(payload?.settlements) ? payload.settlements : []
  };
}

async function getLocalData() {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return EMPTY_DATA;
  try {
    return normalizeData(JSON.parse(raw));
  } catch (_error) {
    return EMPTY_DATA;
  }
}

async function saveLocalData(data) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(normalizeData(data)));
}

async function fetchRemoteData() {
  if (!isSupabaseConfigured || !supabase) {
    return getLocalData();
  }

  const [groupsRes, membersRes, expensesRes, splitsRes, settlementsRes] = await Promise.all([
    supabase.from(TABLES.groups).select("*").order("created_at", { ascending: false }),
    supabase.from(TABLES.members).select("*").order("created_at", { ascending: false }),
    supabase.from(TABLES.expenses).select("*").order("created_at", { ascending: false }),
    supabase.from(TABLES.expenseSplits).select("*").order("created_at", { ascending: false }),
    supabase.from(TABLES.settlements).select("*").order("created_at", { ascending: false })
  ]);

  const errors = [groupsRes.error, membersRes.error, expensesRes.error, splitsRes.error, settlementsRes.error].filter(
    Boolean
  );
  if (errors.length) {
    throw errors[0];
  }

  const payload = {
    groups: groupsRes.data || [],
    members: membersRes.data || [],
    expenses: expensesRes.data || [],
    expenseSplits: splitsRes.data || [],
    settlements: settlementsRes.data || []
  };
  await saveLocalData(payload);
  return payload;
}

export async function getSplitMateData() {
  const local = await getLocalData();
  if (!isSupabaseConfigured || !supabase) return local;
  try {
    return await fetchRemoteData();
  } catch (_error) {
    return local;
  }
}

export async function createGroup({ name, members }) {
  const now = new Date().toISOString();
  const group = {
    id: uid(),
    name: String(name || "").trim(),
    created_at: now
  };
  const memberRows = (members || [])
    .map((memberName) => String(memberName || "").trim())
    .filter(Boolean)
    .map((memberName) => ({
      id: uid(),
      group_id: group.id,
      name: memberName,
      user_id: null,
      created_at: now
    }));

  if (isSupabaseConfigured && supabase) {
    try {
      const { error: groupError } = await supabase.from(TABLES.groups).insert(group);
      if (groupError) throw groupError;
      if (memberRows.length > 0) {
        const { error: memberError } = await supabase.from(TABLES.members).insert(memberRows);
        if (memberError) throw memberError;
      }
      return await fetchRemoteData();
    } catch (_error) {}
  }

  const local = await getLocalData();
  const next = {
    ...local,
    groups: [group, ...local.groups],
    members: [...memberRows, ...local.members]
  };
  await saveLocalData(next);
  return next;
}

export async function addExpense({ groupId, title, amount, paidBy }) {
  const now = new Date().toISOString();
  const local = await getSplitMateData();
  const members = local.members.filter((member) => member.group_id === groupId);
  if (!members.length) return local;

  const totalAmount = Number(amount || 0);
  const share = totalAmount / members.length;

  const expense = {
    id: uid(),
    group_id: groupId,
    title: String(title || "").trim(),
    amount: totalAmount,
    paid_by: paidBy,
    split_type: "equal",
    created_at: now
  };

  const splits = members.map((member) => ({
    id: uid(),
    expense_id: expense.id,
    member_id: member.id,
    amount: share,
    created_at: now
  }));

  if (isSupabaseConfigured && supabase) {
    try {
      const { error: expenseError } = await supabase.from(TABLES.expenses).insert(expense);
      if (expenseError) throw expenseError;
      const { error: splitError } = await supabase.from(TABLES.expenseSplits).insert(splits);
      if (splitError) throw splitError;
      return await fetchRemoteData();
    } catch (_error) {}
  }

  const next = {
    ...local,
    expenses: [expense, ...local.expenses],
    expenseSplits: [...splits, ...local.expenseSplits]
  };
  await saveLocalData(next);
  return next;
}

export async function addSettlement({ groupId, fromMember, toMember, amount }) {
  const settlement = {
    id: uid(),
    group_id: groupId,
    from_member: fromMember,
    to_member: toMember,
    amount: Number(amount || 0),
    created_at: new Date().toISOString()
  };

  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase.from(TABLES.settlements).insert(settlement);
      if (error) throw error;
      return await fetchRemoteData();
    } catch (_error) {}
  }

  const local = await getLocalData();
  const next = {
    ...local,
    settlements: [settlement, ...local.settlements]
  };
  await saveLocalData(next);
  return next;
}
