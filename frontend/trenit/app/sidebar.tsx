import { Link } from "expo-router";
import { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useTheme } from "../components/ThemeContext";

type SidebarProps = {
  visible: boolean;
  onClose: () => void;
};

export default function Sidebar({ visible, onClose }: SidebarProps) {
  const slideAnim = useRef(new Animated.Value(-300)).current;
  const { toggleTheme, dark } = useTheme();
  const email = "";

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: visible ? 0 : -300,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [visible, slideAnim]);

  return (
    <>
      {visible && (
        <TouchableOpacity style={styles.overlay} onPress={onClose} />
      )}

      <Animated.View
        style={[
          styles.sidebar,
          { transform: [{ translateX: slideAnim }] },
        ]}
      >
        <View style={styles.content}>
           <Text><Link  href={{
              pathname: '/registration',
              params: { email: email }
            }}>registration</Link></Text>

            <Text><Link  href={{
              pathname: '/home',
              params: { email: email }
            }}>home</Link></Text>

            <Text><Link  href={{
              pathname: '/profile',
              params: { email: email }
            }}>profile</Link></Text>

            <TouchableOpacity onPress={toggleTheme}><Text>Dark mode</Text></TouchableOpacity>
            <Text>{dark ? "DARK" : "LIGHT"}</Text>
        </View>
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  sidebar: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 300,
    backgroundColor: "#faf7f7",
    zIndex: 100,
    padding: 20,
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.3)",
    zIndex: 99,
  },
  content: {
    marginTop:50,
    fontSize:20
  },
});