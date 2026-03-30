import ActionLink from '@/components/ActionLink';
import Button from '@/components/Button';
import Background from '@/components/GlobalBackground';
import KeyPairs from '@/components/KeyPairs';
import { router, useLocalSearchParams } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useRef, useState } from 'react';
import { Platform, StyleSheet, Text, TextInput, View } from 'react-native';

export default function Verification(){
      const { email } = useLocalSearchParams();
      const inputsRef = useRef<(TextInput | null)[]>(Array(6).fill(null));
      const [code,setCode]= useState<string[]>(['', '', '', '', '', '']);
      const {privateSigningKey,publicSigningKey, privateCryptoKey,publicCryptoKey} = KeyPairs();


      const handleChange = (text:string,index:number)=>{
        const newCode:string[]=[...code];
        newCode[index]=text;
        setCode(newCode);
      }

      const handleResendCode = async()=>{
        try{
            const response = await fetch('http://172.20.10.2:8080/auth/resendCode?email=' +email,{
                method:'POST',
                headers:{
                    'Content-Type':'application/json'
                }
        });

        if (!response.ok) {
        throw new Error('Something went wrong');
        }
        alert("Verification code succesfully sent to your address");
        }catch(error){
            console.log("Error: ",error)
        }
        
      }

      async function generateKeyPairs (){
        
        if (Platform.OS === 'web') {
            localStorage.setItem('privateSigningKey', privateSigningKey);
            localStorage.setItem('privateCryptoKey', privateCryptoKey);
        } else{
            await SecureStore.setItemAsync('privateSigningKey', privateSigningKey);
            await SecureStore.setItemAsync('privateCryptoKey', privateCryptoKey);
        }
        try{
            const response = await fetch('http://192.168.1.130:8080/auth/publicKeys',{
                method:'POST',
                headers:{
                    'Content-Type' : 'application/json'
                },
                  body: JSON.stringify({
                        email: email,
                        publicSigningkey: publicSigningKey,
                        publicEncryptingkey: publicCryptoKey
                    })
            });

            if (!response.ok) {
            throw new Error('Something went wrong');
            }

        }catch(error){
            console.log("Ooops!There was en error: ",error);
        }
      }

      const handleVerification = async()=>{
        const finalCode = code.join('');
        try{

             router.push('/home');

            const response = await fetch('http://192.168.1.130:8080/auth/verify?code='+finalCode+'&email='+email,{
            method:'POST',
             headers: {
        'Content-Type': 'application/json',
        }
        });

        if (!response.ok) {
        throw new Error('Something went wrong');
        }
      
        generateKeyPairs();
        

        }catch(error){
            console.log("Error: ",error);
        }
        
      }
    return (
                <View style={styles.page} >
                <Background/>
                <Text style={styles.txt}>Enter 6-digit code sent to your email</Text>
                    <View style={styles.inputs}>
                        {code.map((digit, index) => (
                        <TextInput
                            key={index}
                            style={styles.digit}
                            value={digit}
                            onChangeText={(text) => {
                                handleChange(text, index);
                                if (text && index < code.length - 1) {
                                    setTimeout(() => {
                                        inputsRef.current[index + 1]?.focus();
                                    }, 0);
                                }
                            }}
                            onKeyPress={({ nativeEvent }) => {
                                if (nativeEvent.key === 'Backspace' && !code[index] && index > 0) {
                                    setTimeout(() => {
                                        inputsRef.current[index - 1]?.focus();
                                    }, 0);
                                }
                            }}
                            ref={(el) => { inputsRef.current[index] = el; }}
                            maxLength={1}
                            keyboardType="numeric"
                           
                        />
                        ))}
                    </View>
                    <View  style={styles.button} >
                        <Button label="Enter" onPress={handleVerification}/>
                    </View >
                    <View style={styles.textBelow}>
                        <Text style={styles.txt}>Did not receive code?{' '}</Text><ActionLink onPress={handleResendCode}> Resend</ActionLink>
                    </View>
                </View> 
            );
}

const styles = StyleSheet.create({
    inputs:{
        flexDirection:"row",
        padding:10,
        backgroundColor:"white",
        justifyContent:"space-between",
        height:"20%",
        width:"90%",
        alignSelf:"center",
        maxWidth:500

    },
    link:{
        
    },
    pressedlink:{

    },
    button:{
        alignSelf:"center",

    },
    digit:{
        backgroundColor:"#f5f5f5",
        width:"15%",
        height:"90%",
        fontSize:30,
        textAlign:"center"
    },
    textBelow:{
        flexDirection:"row",
        justifyContent:"center",
    },
    page:{
        flexDirection:"column",
        justifyContent:"center",
        height:"100%"
    },
    txt:{
        fontFamily:"Georgia",
        color:'#453e3e',
        margin:5,
        alignSelf:"center",
    }
})