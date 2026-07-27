import Feather from "react-native-vector-icons/Feather";
import React from "react";
import { Platform, StyleSheet, Text, View, useColorScheme } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";

import { useCart } from "@/contexts/CartContext";
import { useColors } from "@/hooks/useColors";
import HomeScreen from "@/src/screens/HomeScreen";
import MenuScreen from "@/src/screens/MenuScreen";
import CartScreen from "@/src/screens/CartScreen";
import OrdersScreen from "@/src/screens/OrdersScreen";
import ProfileScreen from "@/src/screens/ProfileScreen";
import type { TabParamList } from "@/src/navigation/types";

const Tab = createBottomTabNavigator<TabParamList>();

function CartTabIcon({ color, size }: { color: string; size: number }) {
  const { itemCount } = useCart();
  return (
    <View style={styles.iconWrapper}>
      <Feather name="shopping-bag" size={size} color={color} />
      {itemCount > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{itemCount > 99 ? "99+" : itemCount}</Text>
        </View>
      )}
    </View>
  );
}

export default function TabNavigator() {
  const colors = useColors();
  const { itemCount } = useCart();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const isIOS = Platform.OS === "ios";

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.mutedForeground,
        headerShown: true,
        headerStyle: { backgroundColor: colors.primary },
        headerTintColor: "#FFFFFF",
        headerTitleStyle: {
          fontFamily: "Inter_700Bold",
          color: "#FFFFFF",
          fontSize: 18,
        },
        tabBarStyle: {
          position: "absolute",
          backgroundColor: isIOS ? "transparent" : colors.background,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          elevation: 0,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontFamily: "Inter_500Medium",
          marginBottom: isIOS ? 0 : 2,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: "Home",
          headerShown: false,
          tabBarIcon: ({ color }) => <Feather name="home" size={22} color={color} />,
        }}
      />
      <Tab.Screen
        name="Menu"
        component={MenuScreen}
        options={{
          title: "Menu",
          headerShown: false,
          tabBarIcon: ({ color }) => <Feather name="grid" size={22} color={color} />,
        }}
      />
      <Tab.Screen
        name="Cart"
        component={CartScreen}
        options={{
          title: "Cart",
          tabBarBadge: itemCount > 0 ? itemCount : undefined,
          tabBarBadgeStyle: {
            backgroundColor: colors.accent,
            fontSize: 10,
            fontFamily: "Inter_700Bold",
            color: "#FFFFFF",
            minWidth: 18,
            height: 18,
            borderRadius: 9,
          },
          tabBarIcon: ({ color }) => <Feather name="shopping-bag" size={22} color={color} />,
        }}
      />
      <Tab.Screen
        name="Orders"
        component={OrdersScreen}
        options={{
          title: "Orders",
          tabBarIcon: ({ color }) => <Feather name="clock" size={22} color={color} />,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) => <Feather name="user" size={22} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  iconWrapper: {
    width: 28,
    height: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  badge: {
    position: "absolute",
    top: -4,
    right: -8,
    backgroundColor: "#C8102E",
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 3,
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontFamily: "Inter_700Bold",
  },
});
