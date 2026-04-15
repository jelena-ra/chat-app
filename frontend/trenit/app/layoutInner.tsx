import { Ionicons } from "@expo/vector-icons";
import { Stack } from "expo-router";
import { useState } from "react";
import { Image, TouchableOpacity, View } from "react-native";
import Sidebar from "./sidebar";


export default function RootLayoutInner() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    return <>
     <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: "#745148",
          },

          headerLeft: () => (
            <TouchableOpacity onPress={() => setSidebarOpen(true)}>
              <Ionicons name="menu" size={30} color="#745858" />
            </TouchableOpacity>
          ),

          headerTitle: () => (
            <View pointerEvents="none" style={{ flex: 1, alignItems: "flex-end" }}>
              <Image
                source={require('@/assets/images/C.png')}
                style={{ width: 80, height: 40, resizeMode: "cover" }}
              />
            </View>
          ),

          headerTitleAlign: "center",
        }}
      >
      <Stack.Screen name="index" />
      <Stack.Screen name="home" />
      <Stack.Screen  name="registration" />
      <Stack.Screen name="verification" />
      <Stack.Screen name="chat" />
      </Stack>
    <Sidebar
    visible={sidebarOpen}
    onClose={() => setSidebarOpen(false)}
    />
   </>

;
}
