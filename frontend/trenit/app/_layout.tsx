import { AuthProvider } from "@/components/AuthContext";
import { ChatSocketProvider } from "@/components/ChatSocketContext";
import { ThemeProvider } from "@/components/ThemeContext";
import { SafeAreaProvider } from "react-native-safe-area-context";
import RootLayoutInner from "./layoutInner";

export default function RootLayout() {
    return<SafeAreaProvider>
      <ThemeProvider>
       <AuthProvider>
        <ChatSocketProvider>
     <RootLayoutInner/>
     </ChatSocketProvider>
     </AuthProvider>
   </ThemeProvider>
   </SafeAreaProvider>

;
}
