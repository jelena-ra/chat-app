import React, { useState } from 'react';
import { StyleSheet, Text } from 'react-native';

interface ActionLinkProps {
  onPress: () => void;
  children: React.ReactNode;
}

export default function ActionLink({ onPress, children }: ActionLinkProps) {
  const [pressed, setPressed] = useState(false);

  return (
    <Text
      style={[styles.linkText, pressed && styles.linkPressed]}
      onPress={onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
    >
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  linkText: {
    color: '#5b3214',
    textDecorationLine: 'underline',
  },
  linkPressed: {
    color: '#3c200c',
  },
});