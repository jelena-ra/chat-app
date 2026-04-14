import IP_ADDRESS from '@/assets/config';
import ActionLink from '@/components/ActionLink';
import Button from '@/components/Button';
import Background from '@/components/GlobalBackground';
import KeyPairs from '@/components/KeyPairs';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useEffect, useRef, useState } from 'react';
import { Platform, StyleSheet, Text, TextInput, View } from 'react-native';

export default function Verification(){
      const inputsRef = useRef<(TextInput | null)[]>(Array(6).fill(null));
        const [email,setEmail] = useState<string>('');
      const [code,setCode]= useState<string[]>(['', '', '', '', '', '']);
      const {privateSigningKey,publicSigningKey, privateCryptoKey,publicCryptoKey} = KeyPairs();


useEffect(() => {
  console.log("RADI LOG");
   const getEmailToken = async ()=>{
   const em= await SecureStore.getItemAsync('email');
   console.log("Email u pocetku:"+email);
   if(em!==null){
   setEmail(em);
   }
   }
    getEmailToken();
}, [email]);

      const handleChange = (text:string,index:number)=>{
        const newCode:string[]=[...code];
        newCode[index]=text;
        setCode(newCode);
      }

      const handleResendCode = async()=>{
        try{
            const response = await fetch(`http://${IP_ADDRESS}:8080/auth/resendCode?email=` +email,{
                method:'POST',
              
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
         console.log("usau u generate keys")
          console.log("priv signing: eys"+privateSigningKey )
          console.log("priv crypto: eys"+privateCryptoKey )
          console.log("email"+email )
        if (Platform.OS === 'web') {
            console.log("ovde je u generate u web")
            localStorage.setItem('privateSigningKey', privateSigningKey);
            localStorage.setItem('privateCryptoKey', privateCryptoKey);
        } else{
            console.log("ovde je u generate u else")
            const safeEmail = email.replace(/[^a-zA-Z0-9._-]/g, "_");
            await SecureStore.deleteItemAsync(`privateSigningKey_${safeEmail}`);
            await SecureStore.deleteItemAsync(`privateCryptoKey_${safeEmail}`);

            await SecureStore.setItemAsync(`privateSigningKey_${safeEmail}`, privateSigningKey);
            await SecureStore.setItemAsync(`privateCryptoKey_${safeEmail}`, privateCryptoKey);

            console.log("EMAIL PRI SAVE:", safeEmail);
            const test = await SecureStore.getItemAsync(`privateCryptoKey_${safeEmail}`);
            console.log("TEST READ:", test);
        }
        try{
            console.log("sad setuje public i priv key")
            const response = await fetch(`http://${IP_ADDRESS}:8080/auth/publicKeys`,{
                method:'POST',
                
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

      async function handleVerification(){
        const finalCode = code.join('');
          console.log("kod koji salje:"+finalCode);
        try{

            
             console.log("sad salje request")
            const response = await fetch(`http://${IP_ADDRESS}:8080/auth/verify?code=`+finalCode+'&email='+email,{
            method:'POST',
            
        });

        if (!response.ok) {
            console.log("prc error")
        throw new Error('Something went wrong');
        }
        const data = await response.json(); 
        await SecureStore.deleteItemAsync(`accessToken`);
        await SecureStore.deleteItemAsync(`refreshToken`);

        await SecureStore.setItemAsync('accessToken', data.accessToken);
        await SecureStore.setItemAsync('refreshToken', data.refreshToken);

        const em = Array.isArray(email) ? email[0] : email;
        await SecureStore.setItemAsync('email', em);

        console.log("ovde setuje token: ", data.accessToken )
        await generateKeyPairs();
        
 router.push('/home');
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