import { ThemeProvider } from "../components/ThemeContext";
import RootLayoutInner from "./layoutInner";


export default function RootLayout() {
    return <ThemeProvider>
     <RootLayoutInner/>
   </ThemeProvider>

;
}
