import Button from '@/components/Button';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { Image, StyleSheet, Text, TextInput, View } from 'react-native';



const imgSource = require('@/assets/images/C.png');

export default function Registration(){ 
      const router = useRouter(); 
      const [number, setPhone] = useState('');
      const [email, setEmail] = useState('');

      const handleRegister = async()=>{
    try{
        router.push({
        pathname: '/verification',
        params: { email },
        });

        const response = await fetch('http://172.20.10.2:8080/auth/register',{
            method:'POST',
             headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ number, email }),
    });

      if (!response.ok) {
      throw new Error('Something went wrong');
    }

    const data = await response.json();

    
        
    }catch(error){
        console.log(error)
        return;
    }


}

return(
    <View style={styles.page}>
        <LinearGradient style={styles.background}
        colors={['#EDEAE3', '#a87548']}
      />
        <Image source={imgSource} style={styles.img} ></Image>
        <Text style={styles.txtSign}>Connect with your friends </Text>
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
            </View>
            <Text><Link  href={{
    pathname: '/verification',
    params: { email: email }
  }}>verification</Link></Text>
            </View>
        </View>
    </View>
   
);

}


const styles = StyleSheet.create({
    page:{
        flex: 1,
        flexDirection:"column",
        justifyContent: "flex-start",
        alignItems:"center",
        paddingTop:2
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
        flex:0.7   
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