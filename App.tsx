import React from "react";
import { View, ActivityIndicator, Platform } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useFonts } from "expo-font";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Inter_400Regular } from "@expo-google-fonts/inter/400Regular";
import { Inter_500Medium } from "@expo-google-fonts/inter/500Medium";
import { Inter_600SemiBold } from "@expo-google-fonts/inter/600SemiBold";
import { Inter_700Bold } from "@expo-google-fonts/inter/700Bold";
import { Manrope_700Bold } from "@expo-google-fonts/manrope/700Bold";
import { SafeAreaProvider } from "react-native-safe-area-context";
import {
  NavigationContainer,
  DefaultTheme,
  DarkTheme,
} from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StoreProvider, useStore } from "./lib/store";
import { navigationRef } from "./lib/navigation";
import Shell from "./components/Shell";
import CaseDetails from "./screens/CaseDetails";
import { T, Icon, Loading } from "./components/ui";
const Stack = createNativeStackNavigator();
function Workspace() {
  const { palette: p, loaded, message } = useStore();
  if (!loaded) return <Loading />;
  return (
    <View style={{ flex: 1, backgroundColor: p.bg }}>
      <StatusBar style={p.dark ? "light" : "dark"} />
      <NavigationContainer
        ref={navigationRef}
        theme={{
          ...(p.dark ? DarkTheme : DefaultTheme),
          colors: {
            ...(p.dark ? DarkTheme : DefaultTheme).colors,
            background: p.bg,
            card: p.panel,
            text: p.text,
            border: p.border,
            primary: p.green,
          },
        }}
      >
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: p.bg },
          }}
        >
          <Stack.Screen name="Workspace" component={Shell} />
          <Stack.Screen
            name="CaseDetails"
            component={CaseDetails}
            options={{ presentation: "modal", animation: "slide_from_bottom" }}
          />
        </Stack.Navigator>
      </NavigationContainer>
      {!!message && (
        <View
          accessibilityRole="alert"
          accessibilityLiveRegion="polite"
          style={{
            position: "absolute",
            bottom: Platform.OS === "web" ? 24 : 88,
            alignSelf: "center",
            maxWidth: "92%",
            backgroundColor: p.raised,
            borderWidth: 1,
            borderColor: p.green + "60",
            borderRadius: 9,
            padding: 16,
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
            shadowColor: "#000",
            shadowOpacity: 0.3,
            shadowRadius: 20,
            elevation: 10,
            zIndex: 9999,
          }}
        >
          <Icon name="information-circle-outline" color={p.green} size={20} />
          <T style={{ fontSize: 12, flexShrink: 1 }}>{message}</T>
        </View>
      )}
    </View>
  );
}
export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    ...Ionicons.font,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Manrope_700Bold,
  });
  if (!fontsLoaded && !fontError)
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "#0b1118",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <ActivityIndicator color="#48dfb1" />
      </View>
    );
  return (
    <SafeAreaProvider>
      <StoreProvider>
        <Workspace />
      </StoreProvider>
    </SafeAreaProvider>
  );
}
