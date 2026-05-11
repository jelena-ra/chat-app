import IP_ADDRESS from '@/assets/config';
import Button from '@/components/Button';
import Background from '@/components/GlobalBackground';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';


const imgSource = require('@/assets/images/C.png');

export default function Registration(){ 
      const router = useRouter(); 
      const [number, setPhone] = useState('');
      const [email, setEmail] = useState('');

      
      const handleRegister = async()=>{
    try{
        
        console.log(`Pokušavam poziv na: http://${IP_ADDRESS}:8080/auth/register`);
        const response = await fetch(`http://${IP_ADDRESS}:8080/auth/register`,{
            method:'POST',
           
      body: JSON.stringify({ number, email }),
       headers: {
    'Content-Type': 'application/json',
  },
    });

      if (!response.ok) {
      throw new Error('Something went wrong');
    }
     const em = Array.isArray(email) ? email[0] : email;
     await SecureStore.deleteItemAsync('email');
     console.log("email posle register "+em);
    
    await SecureStore.setItemAsync('email', em);

    /*const data = await response.json();*/
router.push({
        pathname: '/verification',
        params: { email },
        });
    
        
    }catch(error){
        console.log("Ovde je erorcina")
        console.log(error)
        return;
    }
}
 const handleLogin = async()=>{
    try{
        router.push({
        pathname: '/home',
        params: { email },
        });
        const response = await fetch(`http://${IP_ADDRESS}:8080/auth/login`,{
            method:'POST',
           
      body: JSON.stringify({ number, email }),
    });


     if (!response.ok) {
            throw new Error('Something went wrong');
            }
            const data = await response.json(); 
            
            await SecureStore.setItemAsync('accessToken', data.accessToken);
            await SecureStore.setItemAsync('refreshToken', data.refreshToken);
            
            const em = Array.isArray(email) ? email[0] : email;
            await SecureStore.setItemAsync('email', em);
    
            console.log("ovde setuje token: ", data.accessToken )
    
        
    }catch(error){
        console.log(error)
        return;
    }


}

return(
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0} 
       style={{ flex: 1}} 
    >
         <Background/>
        <ScrollView
    contentContainerStyle={{ flexGrow: 0, paddingBottom: 80 }}
    keyboardShouldPersistTaps="handled"
  >
    <View style={styles.page}>
       
        <Image source={imgSource} style={styles.img} ></Image>
        <Text style={styles.txtSign}>Connect with your friends</Text>
        <Text style={styles.txt}>Create your account </Text>
        <View>
            <View style={styles.card}>
            <Text style={styles.txt}> phone number: </Text>
            <TextInput  style={styles.input} placeholder='Enter phone number' placeholderTextColor="#999" value={number}
  onChangeText={setPhone}></TextInput>
            <Text style={styles.txt}> email: </Text>
            <TextInput  style={styles.input}  value={email}
  onChangeText={setEmail} placeholder='Enter email' placeholderTextColor="#999" ></TextInput>
            <View style={styles.button}>
                <Button label="Get Started ->" onPress={handleRegister}/>
                {/* <Button label="Login ->" onPress={handleLogin}/>*/ } 
            </View>
        {/*    <Text><Link  href={{
    pathname: '/verification',
    params: { email: email }
  }}>verification</Link></Text>
  <Text><Link  href={{
    pathname: '/home',
    params: { email: email }
  }}>home</Link></Text>*/ } 
            </View>
        </View>
    </View>
    </ScrollView>
    </KeyboardAvoidingView>
   
);

}


const styles = StyleSheet.create({
    page:{
        flex: 1,
        flexDirection:"column",
        justifyContent: "flex-start",
        alignItems:"center",
        paddingTop:2,
        backgroundColor:"transparent"
    },
    input:{
        backgroundColor:"#f5f5f5",
        borderRadius:10,
        padding:25,
        marginTop:10,
        fontSize:16,
        marginBottom:15,
    },
    card:{
        backgroundColor:"#ffffff",
        borderRadius:25,
        padding:20,
        shadowColor:"#000",
        shadowOffset:{width:4,height:4},
        shadowOpacity:0.5,
        shadowRadius:10,
        elevation:15,
        width:"100%",
        flex:0.8   
        },
    background: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        height:"100%",
    },
    button:{
        marginTop:40,
        width:"100%"
    },
    img:{
        width:"80%",
        borderColor:"#d09756",
        borderCurve:"circular",
        height:"30%",
        resizeMode:"contain",
        shadowColor:"#000",
        shadowOpacity:0.2,
        shadowRadius:10,
        shadowOffset:{width:0,height:6}        
    },
    txt:{
        fontFamily:"Georgia",
        color:'#453e3e',
        margin:5
    },
     txtSign:{
        fontFamily:"Georgia",
        fontWeight:"bold",
        marginTop:-20,
        marginBottom:5,
        color:"#5e411a",
        textAlign:"center",
        fontSize:22    
    }
})