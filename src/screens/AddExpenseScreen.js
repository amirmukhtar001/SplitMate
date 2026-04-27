import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert } from "react-native";
import { addExpense, getSplitMateData } from "../storage/splitmateStorage";

export default function AddExpenseScreen({ route, navigation }) {
  const { groupId } = route.params;
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [members, setMembers] = useState([]);
  const [paidBy, setPaidBy] = useState(null);

  useEffect(() => {
    const load = async () => {
      const payload = await getSplitMateData();
      const groupMembers = payload.members.filter((member) => member.group_id === groupId);
      setMembers(groupMembers);
      setPaidBy(groupMembers[0]?.id || null);
    };
    load();
  }, [groupId]);

  const handleSave = async () => {
    const cleanTitle = title.trim();
    const numericAmount = Number(amount);

    if (!cleanTitle) {
      Alert.alert("Validation", "Expense title is required.");
      return;
    }
    if (!numericAmount || numericAmount <= 0) {
      Alert.alert("Validation", "Enter a valid amount.");
      return;
    }
    if (!paidBy) {
      Alert.alert("Validation", "Select who paid.");
      return;
    }

    await addExpense({
      groupId,
      title: cleanTitle,
      amount: numericAmount,
      paidBy
    });
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Title</Text>
      <TextInput
        value={title}
        onChangeText={setTitle}
        placeholder="Dinner"
        style={styles.input}
      />

      <Text style={styles.label}>Amount</Text>
      <TextInput
        value={amount}
        onChangeText={setAmount}
        placeholder="3000"
        keyboardType="numeric"
        style={styles.input}
      />

      <Text style={styles.label}>Paid by</Text>
      <View style={styles.payerRow}>
        {members.map((member) => {
          const isSelected = member.id === paidBy;
          return (
            <TouchableOpacity
              key={member.id}
              style={[styles.payerChip, isSelected ? styles.payerChipActive : null]}
              onPress={() => setPaidBy(member.id)}
            >
              <Text style={[styles.payerText, isSelected ? styles.payerTextActive : null]}>{member.name}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={styles.splitText}>Split type: Equal (V1)</Text>

      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveText}>Save Expense</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 16
  },
  label: {
    marginTop: 10,
    marginBottom: 6,
    color: "#374151",
    fontWeight: "600"
  },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10
  },
  payerRow: {
    flexDirection: "row",
    flexWrap: "wrap"
  },
  payerChip: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    marginRight: 8,
    marginBottom: 8
  },
  payerChipActive: {
    backgroundColor: "#111827",
    borderColor: "#111827"
  },
  payerText: {
    color: "#374151",
    fontWeight: "600"
  },
  payerTextActive: {
    color: "#fff"
  },
  splitText: {
    marginTop: 10,
    color: "#6b7280"
  },
  saveButton: {
    marginTop: "auto",
    backgroundColor: "#2563eb",
    borderRadius: 10,
    alignItems: "center",
    paddingVertical: 13
  },
  saveText: {
    color: "#fff",
    fontWeight: "700"
  }
});
