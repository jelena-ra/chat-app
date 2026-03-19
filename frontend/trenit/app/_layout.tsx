import { Stack } from "expo-router";

export default function RootLayout() {
  return <Stack>
      <Stack.Screen name="index" options={{ title: '' }} />
      <Stack.Screen name="home" options={{ title: '' }} />
      <Stack.Screen name="registration" options={{ title: '' }} />
       <Stack.Screen name="verification"  />
    </Stack>;
}
