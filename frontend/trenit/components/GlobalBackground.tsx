import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "./ThemeContext";
export default function Background(){
    const { dark } = useTheme();
    return(
        <LinearGradient style={{position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        height:"100%",
        flex:1,
    }}colors={dark 
        ? ['#524e45', '#5d3e27'] 
        : ['#EDEAE3', '#da935c']
      }/>
    );
}