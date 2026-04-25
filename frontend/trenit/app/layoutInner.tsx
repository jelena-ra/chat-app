import { Ionicons } from "@expo/vector-icons";
import { Stack, usePathname, useRouter } from "expo-router";
import { useState } from "react";
import { Image, StyleSheet, TouchableOpacity, View } from "react-native";
import Sidebar from "./sidebar";


export default function RootLayoutInner() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
      const router = useRouter();
      const pathname = usePathname();

  const hideBottomBar =
    pathname === "/registration" || pathname === "/verification";
    return <View style={styles.container}>
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

      {!hideBottomBar ? <View style={styles.plus}>
                      <TouchableOpacity onPress={() => {console.log("CLICKED");router.push("/newGroup")}}><Ionicons name="call-outline" size={30} color={"#9d6d6d"}   /></TouchableOpacity>
                      <TouchableOpacity onPress={() => router.push("/grouphome")}  ><Ionicons name="people" size={30} color={"#9d6d6d"} /></TouchableOpacity>
                      <TouchableOpacity onPress={() => router.push("/home")} ><Ionicons name="chatbubble-outline" size={30} color={"#9d6d6d"} /></TouchableOpacity>
                      <TouchableOpacity onPress={() => router.push("/profile")}><Ionicons name="person" size={30} color={"#9d6d6d"} /></TouchableOpacity>
                  </View> : null}

    <Sidebar
    visible={sidebarOpen}
    onClose={() => setSidebarOpen(false)}
    />
   </View>

;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  plus: {
    backgroundColor: "#5a3e36",
    height: 40,
    flexDirection: "row",
    justifyContent: "space-evenly",
    alignItems: "center",
  },
})
