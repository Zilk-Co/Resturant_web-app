import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { useColors } from "@/hooks/useColors";
import TabNavigator from "@/src/navigation/TabNavigator";
import LoginScreen from "@/src/screens/LoginScreen";
import AddAddressScreen from "@/src/screens/AddAddressScreen";
import ItemDetailScreen from "@/src/screens/ItemDetailScreen";
import CheckoutScreen from "@/src/screens/CheckoutScreen";
import OrderConfirmScreen from "@/src/screens/OrderConfirmScreen";
import TermsScreen from "@/src/screens/TermsScreen";
import PrivacyScreen from "@/src/screens/PrivacyScreen";
import ReviewsScreen from "@/src/screens/ReviewsScreen";
import type { RootStackParamList } from "@/src/navigation/types";

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const colors = useColors();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.primary },
        headerTintColor: "#FFFFFF",
        headerTitleStyle: {
          fontFamily: "Inter_700Bold",
          color: "#FFFFFF",
          fontSize: 18,
        },
        headerBackTitle: "Back",
        contentStyle: { backgroundColor: colors.background },
        animation: "slide_from_right",
      }}
    >
      <Stack.Screen name="Tabs" component={TabNavigator} options={{ headerShown: false }} />
      <Stack.Screen
        name="Login"
        component={LoginScreen}
        options={{ headerShown: false, presentation: "modal", animation: "slide_from_bottom" }}
      />
      <Stack.Screen
        name="Add-Address"
        component={AddAddressScreen}
        options={{ title: "Add Address", presentation: "modal", animation: "slide_from_bottom" }}
      />
      <Stack.Screen
        name="Item-Detail"
        component={ItemDetailScreen}
        options={{ title: "Product", headerShown: true }}
      />
      <Stack.Screen
        name="Checkout"
        component={CheckoutScreen}
        options={{ title: "Checkout" }}
      />
      <Stack.Screen
        name="Order-Confirm"
        component={OrderConfirmScreen}
        options={{ headerShown: false, gestureEnabled: false, animation: "fade" }}
      />
      <Stack.Screen
        name="Terms"
        component={TermsScreen}
        options={{ title: "Terms & Conditions" }}
      />
      <Stack.Screen
        name="Privacy"
        component={PrivacyScreen}
        options={{ title: "Privacy Policy" }}
      />
      <Stack.Screen
        name="Reviews"
        component={ReviewsScreen}
        options={{ title: "Customer Reviews" }}
      />
    </Stack.Navigator>
  );
}
