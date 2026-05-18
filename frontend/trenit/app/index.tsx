import { useAuth } from "@/components/AuthContext";
import { Redirect } from "expo-router";
import { ActivityIndicator, View } from 'react-native';
import { TextEncoder } from 'text-encoding';

globalThis.TextEncoder = TextEncoder;

export default function Index() {
        const { email, token, isAuthLoading } = useAuth();

         if (isAuthLoading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <ActivityIndicator size="large" />
      </View>
    );
  }
      return (
             (!email && !token) ? (<Redirect href="/registration"></Redirect>):(<Redirect href="/home"></Redirect>)
      )
}
