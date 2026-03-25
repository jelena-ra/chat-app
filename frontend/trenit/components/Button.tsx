import { Pressable, StyleSheet, Text, View } from 'react-native';

type Props = {
  label: string;
  onPress?: () => void; 
};

export default function Button({ label, onPress  }: Props) {
  return (
    <View style={styles.buttonContainer}>
      <Pressable  style={({ pressed }) => [styles.button,
    pressed && styles.buttonPressed ]} onPress={onPress}>
        <Text style={styles.buttonLabel}>{label}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  buttonContainer: {
    width: 320,
    height: 68,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 3,
  },
  buttonPressed:{
    backgroundColor:'#a87548',
    opacity:0.7
  },
  button: {
    borderRadius: 30,
    width: '100%',
    paddingVertical:18,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    backgroundColor:'#745148'
  },
  buttonLabel: {
    color: '#ffffff',
    fontSize: 16,
     fontFamily:"Georgia"
  },
});
