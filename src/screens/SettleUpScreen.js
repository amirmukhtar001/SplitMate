import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert } from "react-native";
import { addSettlement, getSplitMateData } from "../storage/splitmateStorage";

export default function SettleUpScreen({ route, navigation }) {
  const { groupId } = route.params;
  const [members, setMembers] = useState([]);
  const [fromMember, setFromMember] = useState(null);
  const [toMember, setToMember] = useState(null);
  const [amount, setAmount] = useState("");

  useEffect(() => {
    const load = async () => {
      const payload = await getSplitMateData();
      const groupMembers = payload.members.filter((member) => member.group_id === groupId);
      setMembers(groupMembers);
      setFromMember(groupMembers[0]?.id || null);
      setToMember(groupMembers[1]?.id || groupMembers[0]?.id || null);
    };
    load();
  }, [groupId]);

  const handleSave = async () => {
    const numericAmount = Number(amount);
    if (!fromMember || !toMember) {
      Alert.alert("Validation", "Select both members.");
      return;
    }
    if (fromMember === toMember) {
      Alert.alert("Validation", "From and To cannot be same.");
      return;
    }
    if (!numericAmount || numericAmount <= 0) {
      Alert.alert("Validation", "Enter a valid settlement amount.");
      return;
    }

    await addSettlement({
      groupId,
      fromMember,
      toMember,
      amount: numericAmount
    });
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>From (Debtor)</Text>
      <View style={styles.row}>
        {members.map((member) => {
          const isActive = fromMember === member.id;
          return (
            <TouchableOpacity
              key={`from-${member.id}`}
              style={[styles.chip, isActive ? styles.chipActive : null]}
              onPress={() => setFromMember(member.id)}
            >
              <Text style={[styles.chipText, isActive ? styles.chipTextActive : null]}>{member.name}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={styles.label}>To (Creditor)</Text>
      <View style={styles.row}>
        {members.map((member) => {
          const isActive = toMember === member.id;
          return (
            <TouchableOpacity
              key={`to-${member.id}`}
              style={[styles.chip, isActive ? styles.chipActive : null]}
              onPress={() => setToMember(member.id)}
            >
              <Text style={[styles.chipText, isActive ? styles.chipTextActive : null]}>{member.name}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={styles.label}>Amount</Text>
      <TextInput
        value={amount}
        onChangeText={setAmount}
        placeholder="500"
        keyboardType="numeric"
        style={styles.input}
      />

      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveText}>Save Settlement</Text>
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
  row: {
    flexDirection: "row",
    flexWrap: "wrap"
  },
  chip: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    marginRight: 8,
    marginBottom: 8
  },
  chipActive: {
    backgroundColor: "#111827",
    borderColor: "#111827"
  },
  chipText: {
    color: "#374151",
    fontWeight: "600"
  },
  chipTextActive: {
    color: "#fff"
  },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10
  },
  saveButton: {
    marginTop: "auto",
    backgroundColor: "#7c3aed",
    borderRadius: 10,
    alignItems: "center",
    paddingVertical: 13
  },
  saveText: {
    color: "#fff",
    fontWeight: "700"
  }
});
