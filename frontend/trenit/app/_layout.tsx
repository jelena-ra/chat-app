import { AuthProvider } from "@/components/AuthContext";
import { ThemeProvider } from "@/components/ThemeContext";
import RootLayoutInner from "./layoutInner";


export default function RootLayout() {
    return <ThemeProvider>
       <AuthProvider>
     <RootLayoutInner/>
     </AuthProvider>
   </ThemeProvider>

;
}
