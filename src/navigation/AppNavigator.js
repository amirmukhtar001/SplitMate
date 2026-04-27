import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createDrawerNavigator } from "@react-navigation/drawer";
import {
  ActivityIndicator,
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Alert,
  Linking
} from "react-native";
import {
  DrawerContentScrollView,
  DrawerItemList,
  DrawerItem
} from "@react-navigation/drawer";
import HomeScreen from "../screens/HomeScreen";
import AddLoanScreen from "../screens/AddLoanScreen";
import DetailScreen from "../screens/DetailScreen";
import EditLoanScreen from "../screens/EditLoanScreen";
import AddPaymentScreen from "../screens/AddPaymentScreen";
import DashboardScreen from "../screens/DashboardScreen";
import BorrowersScreen from "../screens/BorrowersScreen";
import LegalScreen from "../screens/LegalScreen";
import LanguageSelectScreen from "../screens/LanguageSelectScreen";
import { useLanguage } from "../context/LanguageContext";
import { useAuth } from "../context/AuthContext";
import PhoneAuthScreen from "../screens/PhoneAuthScreen";
import { APP_META } from "../config/appMeta";

const RootStack = createNativeStackNavigator();
const MainStack = createNativeStackNavigator();
const Drawer = createDrawerNavigator();

function MenuButton({ onPress }) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.menuButton} accessibilityRole="button">
      <Text style={styles.menuIcon}>☰</Text>
    </TouchableOpacity>
  );
}

function MainStackNavigator() {
  const { t, isRTL } = useLanguage();

  return (
    <MainStack.Navigator
      screenOptions={{
        headerBackTitleVisible: false,
        headerTitleAlign: isRTL ? "right" : "center"
      }}
    >
      <MainStack.Screen
        name="Home"
        component={HomeScreen}
        options={({ navigation }) => ({
          title: t("screen.home"),
          headerLeft: isRTL
            ? undefined
            : () => <MenuButton onPress={() => navigation.getParent()?.openDrawer()} />,
          headerRight: isRTL
            ? () => <MenuButton onPress={() => navigation.getParent()?.openDrawer()} />
            : undefined
        })}
      />
      <MainStack.Screen
        name="AddLoan"
        component={AddLoanScreen}
        options={{ title: t("screen.addLoan") }}
      />
      <MainStack.Screen
        name="Detail"
        component={DetailScreen}
        options={{ title: t("screen.detail") }}
      />
      <MainStack.Screen
        name="EditLoan"
        component={EditLoanScreen}
        options={{ title: t("screen.editLoan") }}
      />
      <MainStack.Screen
        name="AddPayment"
        component={AddPaymentScreen}
        options={{ title: t("screen.addPayment") }}
      />
      <MainStack.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{ title: t("screen.dashboard") }}
      />
      <MainStack.Screen
        name="Borrowers"
        component={BorrowersScreen}
        options={{ title: t("screen.borrowers") }}
      />
      <MainStack.Screen
        name="LanguageSelect"
        component={LanguageSelectScreen}
        options={{ title: t("lang.select") }}
      />
    </MainStack.Navigator>
  );
}

function AppDrawerNavigator() {
  const { t, isRTL } = useLanguage();
  const { signOut } = useAuth();
  const openUrl = async (url) => {
    try {
      await Linking.openURL(url);
    } catch (_error) {
      Alert.alert(t("common.error"), t("legal.openUrlError"));
    }
  };

  const openEmail = async () => {
    const subject = encodeURIComponent("Smart Udhaar Support");
    const body = encodeURIComponent("Hello, I need help with Smart Udhaar.");
    const mailto = `mailto:${APP_META.supportEmail}?subject=${subject}&body=${body}`;
    await openUrl(mailto);
  };

  const handleLogout = () => {
    Alert.alert(t("auth.logoutTitle"), t("auth.logoutMessage"), [
      { text: t("home.cancel"), style: "cancel" },
      {
        text: t("auth.logoutButton"),
        style: "destructive",
        onPress: async () => {
          const { error } = await signOut();
          if (error) {
            Alert.alert(t("common.error"), error.message || t("auth.logoutError"));
          }
        }
      }
    ]);
  };

  return (
    <Drawer.Navigator
      key={`drawer-${isRTL ? "rtl" : "ltr"}`}
      drawerContent={(props) => (
        <View style={styles.drawerContentContainer}>
          <DrawerContentScrollView {...props} contentContainerStyle={styles.drawerScrollContent}>
            <DrawerItemList {...props} />
          </DrawerContentScrollView>
          <View style={styles.drawerFooter}>
            <DrawerItem
              label={t("lang.select")}
              labelStyle={styles.drawerFooterLabel}
              onPress={() => {
                props.navigation.navigate("MainStack", { screen: "LanguageSelect" });
                props.navigation.closeDrawer();
              }}
            />
            <DrawerItem
              label={t("legal.privacyPolicyButton")}
              labelStyle={styles.drawerFooterLabel}
              onPress={() => openUrl(APP_META.privacyPolicyUrl)}
            />
            <DrawerItem
              label={t("legal.contactSupportButton")}
              labelStyle={styles.drawerFooterLabel}
              onPress={openEmail}
            />
            <DrawerItem
              label={t("auth.logoutButton")}
              labelStyle={styles.drawerLogoutLabel}
              onPress={handleLogout}
            />
            <Text style={styles.drawerVersionText}>{`Smart Udhaar v${APP_META.appVersion}`}</Text>
          </View>
        </View>
      )}
      screenOptions={{
        drawerPosition: isRTL ? "right" : "left",
        drawerType: "front",
        swipeEnabled: false,
        overlayColor: "rgba(15, 23, 42, 0.18)",
        drawerStyle: {
          width: "78%"
        }
      }}
    >
      <Drawer.Screen
        name="MainStack"
        component={MainStackNavigator}
        options={{ title: t("screen.home"), headerShown: false }}
      />
      <Drawer.Screen
        name="Legal"
        component={LegalScreen}
        options={{ title: t("screen.legal") }}
      />
    </Drawer.Navigator>
  );
}

export default function AppNavigator() {
  const { hasSelectedLanguage, isLanguageReady, t, isRTL } = useLanguage();
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
          <RootStack.Screen name="AppDrawer" component={AppDrawerNavigator} options={{ headerShown: false }} />
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
  },
  menuButton: {
    paddingHorizontal: 4,
    paddingVertical: 2
  },
  menuIcon: {
    fontSize: 24,
    color: "#111827"
  },
  drawerContentContainer: {
    flex: 1
  },
  drawerScrollContent: {
    paddingTop: 0
  },
  drawerFooter: {
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    paddingTop: 6,
    paddingBottom: 16
  },
  drawerFooterLabel: {
    color: "#1f2937",
    fontWeight: "600"
  },
  drawerLogoutLabel: {
    color: "#b91c1c",
    fontWeight: "700"
  },
  drawerVersionText: {
    color: "#9ca3af",
    fontSize: 12,
    textAlign: "center",
    marginTop: 2
  }
});
