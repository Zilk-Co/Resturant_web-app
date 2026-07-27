import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { NavigationContainer } from "@react-navigation/native";
import { StatusBar } from "react-native";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import { MenuProvider } from "@/contexts/MenuContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { OrderProvider } from "@/contexts/OrderContext";
import { OrderTypeProvider } from "@/contexts/OrderTypeContext";
import { SettingsProvider } from "@/contexts/SettingsContext";
import RootNavigator from "@/src/navigation/RootNavigator";
import { setBaseUrl } from "@/lib/api-client";

const queryClient = new QueryClient();
const API_URL = process.env.EXPO_PUBLIC_API_URL || "https://skewer-professor-stove.ngrok-free.dev";
setBaseUrl(API_URL);

export default function App() {
  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <LanguageProvider>
            <AuthProvider>
              <SettingsProvider>
                <CartProvider>
                  <MenuProvider>
                    <OrderProvider>
                      <OrderTypeProvider>
                        <GestureHandlerRootView style={{ flex: 1 }}>
                        <View style={{ flex: 1 }}>
                          <KeyboardProvider>
                            <StatusBar barStyle="light-content" backgroundColor="#1A3525" />
                            <NavigationContainer>
                              <RootNavigator />
                            </NavigationContainer>
                          </KeyboardProvider>
                        </View>
                      </GestureHandlerRootView>
                      </OrderTypeProvider>
                    </OrderProvider>
                  </MenuProvider>
                </CartProvider>
              </SettingsProvider>
            </AuthProvider>
          </LanguageProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
