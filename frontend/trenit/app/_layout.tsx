import { AuthProvider } from "@/components/AuthContext";
import { ChatSocketProvider } from "@/components/ChatSocketContext";
import { ThemeProvider } from "@/components/ThemeContext";
import RootLayoutInner from "./layoutInner";


export default function RootLayout() {
    return <ThemeProvider>
       <AuthProvider>
        <ChatSocketProvider>
     <RootLayoutInner/>
     </ChatSocketProvider>
     </AuthProvider>
   </ThemeProvider>

;
}
