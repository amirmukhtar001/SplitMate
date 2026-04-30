import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { ActivityIndicator, View, StyleSheet } from "react-native";
import GroupsScreen from "../screens/GroupsScreen";
import CreateGroupScreen from "../screens/CreateGroupScreen";
import GroupDetailScreen from "../screens/GroupDetailScreen";
import AddExpenseScreen from "../screens/AddExpenseScreen";
import SettleUpScreen from "../screens/SettleUpScreen";
import LanguageSelectScreen from "../screens/LanguageSelectScreen";
import { useLanguage } from "../context/LanguageContext";
import { useAuth } from "../context/AuthContext";
import PhoneAuthScreen from "../screens/PhoneAuthScreen";
import ActivityScreen from "../screens/ActivityScreen";

const RootStack = createNativeStackNavigator();

export default function AppNavigator() {
  const { hasSelectedLanguage, isLanguageReady, t } = useLanguage();
  const { session, isAuthReady } = useAuth();

  if (!isLanguageReady || !isAuthReady) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <RootStack.Navigator>
        {!hasSelectedLanguage ? (
          <RootStack.Screen
            name="LanguageSelect"
            component={LanguageSelectScreen}
            options={{ headerShown: false }}
          />
        ) : !session ? (
          <RootStack.Screen
            name="PhoneAuth"
            component={PhoneAuthScreen}
            options={{ title: t("screen.phoneAuth"), headerLeft: () => null }}
          />
        ) : (
          <>
            <RootStack.Screen name="Home" component={GroupsScreen} options={{ title: "SplitMate" }} />
            <RootStack.Screen name="Activity" component={ActivityScreen} options={{ title: "Activity" }} />
            <RootStack.Screen name="CreateGroup" component={CreateGroupScreen} options={{ title: "Create Group" }} />
            <RootStack.Screen name="GroupDetail" component={GroupDetailScreen} options={{ title: "Group Detail" }} />
            <RootStack.Screen name="AddExpense" component={AddExpenseScreen} options={{ title: "Add Expense" }} />
            <RootStack.Screen name="SettleUp" component={SettleUpScreen} options={{ title: "Settle Up" }} />
            <RootStack.Screen
              name="LanguageSelect"
              component={LanguageSelectScreen}
              options={{ title: t("lang.select") }}
            />
          </>
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f3f4f6"
  }
});
