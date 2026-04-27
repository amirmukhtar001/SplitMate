import React, { useState } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert } from "react-native";
import { createGroup } from "../storage/splitmateStorage";

export default function CreateGroupScreen({ navigation }) {
  const [name, setName] = useState("");
  const [memberInput, setMemberInput] = useState("");
  const [members, setMembers] = useState([]);

  const addMember = () => {
    const clean = memberInput.trim();
    if (!clean) return;
    if (members.some((member) => member.toLowerCase() === clean.toLowerCase())) {
      Alert.alert("Duplicate member", "This member already exists.");
      return;
    }
    setMembers((prev) => [...prev, clean]);
    setMemberInput("");
  };

  const removeMember = (target) => {
    setMembers((prev) => prev.filter((member) => member !== target));
  };

  const handleCreate = async () => {
    const cleanName = name.trim();
    if (!cleanName) {
      Alert.alert("Validation", "Group name is required.");
      return;
    }
    if (members.length < 2) {
      Alert.alert("Validation", "Add at least 2 members.");
      return;
    }

    await createGroup({ name: cleanName, members });
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Group Name</Text>
      <TextInput
        value={name}
        onChangeText={setName}
        placeholder="Trip to Murree"
        style={styles.input}
      />

      <Text style={styles.label}>Add Member</Text>
      <View style={styles.row}>
        <TextInput
          value={memberInput}
          onChangeText={setMemberInput}
          placeholder="Ali"
          style={[styles.input, styles.memberInput]}
        />
        <TouchableOpacity style={styles.addButton} onPress={addMember}>
          <Text style={styles.addButtonText}>Add</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.memberList}>
        {members.map((member) => (
          <View key={member} style={styles.memberChip}>
            <Text style={styles.memberText}>{member}</Text>
            <TouchableOpacity onPress={() => removeMember(member)}>
              <Text style={styles.removeText}>x</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>

      <TouchableOpacity style={styles.createButton} onPress={handleCreate}>
        <Text style={styles.createButtonText}>Create Group</Text>
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
  row: {
    flexDirection: "row",
    alignItems: "center"
  },
  memberInput: {
    flex: 1,
    marginRight: 8
  },
  addButton: {
    backgroundColor: "#2563eb",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10
  },
  addButtonText: {
    color: "#fff",
    fontWeight: "700"
  },
  memberList: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 12
  },
  memberChip: {
    backgroundColor: "#e5e7eb",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center"
  },
  memberText: {
    color: "#111827",
    fontWeight: "600"
  },
  removeText: {
    color: "#dc2626",
    marginLeft: 8,
    fontWeight: "700"
  },
  createButton: {
    marginTop: "auto",
    backgroundColor: "#111827",
    borderRadius: 10,
    alignItems: "center",
    paddingVertical: 13
  },
  createButtonText: {
    color: "#fff",
    fontWeight: "700"
  }
});
