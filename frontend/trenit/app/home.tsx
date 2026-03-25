import Background from '@/components/GlobalBackground';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

const profileImg= require('@/assets/images/profile.png');


export default function Home(){

 const messages = [
  {
    senderName: "Teodora Becejac",
    messageText: "Heyy, hhhow are you?",
    messageTime: "09:15 AM",
    isRead: true,
  },
  {
    senderName: "Mladen Radisic",
    messageText: "Did you get my email?",
    messageTime: "09:20 AM",
    isRead: false,
  },
  {
    senderName: "Aleksandra Sanja",
    messageText: "Let's meet for lunch.",
    messageTime: "10:05 AM",
    isRead: true,
  },
  {
    senderName: "Savo Radisic",
    messageText: "Happy Birthday! 🎉",
    messageTime: "11:30 AM",
    isRead: false,
  },
  {
    senderName: "Sara Vukojevic",
    messageText: "Check this out!",
    messageTime: "12:15 PM",
    isRead: true,
  },
  {
    senderName: "Srdjan Vukojevic",
    messageText: "Are we still on for tonight?",
    messageTime: "01:45 PM",
    isRead: false,
  },
  {
    senderName: "Dijana Savic",
    messageText: "Thanks for your help!",
    messageTime: "02:30 PM",
    isRead: true,
  },
  {
    senderName: "Mima Sekaric",
    messageText: "Call me when you're free.",
    messageTime: "03:00 PM",
    isRead: false,
  },
  {
    senderName: "Mina Sekaric",
    messageText: "Got the documents, thanks.",
    messageTime: "04:10 PM",
    isRead: true,
  },
  {
    senderName: "Vanja Kapetina",
    messageText: "See you tomorrow!",
    messageTime: "05:00 PM",
    isRead: false,
  },
];
    return(
        <View style={styles.page}>
            <Background/>
           <View style={styles.search}>
                <TouchableOpacity style={styles.searchTouch}><Ionicons name="search" size={30} color="#000" /><Text >Search</Text></TouchableOpacity>
           </View>
           <ScrollView horizontal={true} style={styles.friendOrccG}>
            {messages.map((friend,index)=> (
            <TouchableOpacity key={index} style={{borderRadius:55}}>
                <View style={styles.friends}>
                <Image style={styles.image} source={profileImg}></Image>
                <Text numberOfLines={1} style={{width:50, fontSize:10}}>{friend.senderName}</Text>
                </View>
            </TouchableOpacity>
            ))}
           </ScrollView>
           <ScrollView style={styles.chats}>
                {messages.map((message, index) => (
            <View style={styles.chatCard} key={index}>
                <View style={styles.image}><Image source={profileImg} style={styles.profimage}></Image></View>
                <View style={styles.nameAndMssg}>
                    <View style={styles.name}><Text style={message.isRead ? styles.read : styles.notRead}>{message.senderName}</Text>
                    </View>
                    <View style={styles.mssg}><Text numberOfLines={1} ellipsizeMode="tail">{message.messageText}</Text></View>
                </View>
                <View style={styles.notifAndTime}>
                    <View style={styles.name}><Text>{message.messageTime}</Text></View>
                    <View style={styles.mssg}>{!message.isRead?<Text style={{ color: "red" }}>1</Text>:null}</View>
                </View>
            </View>))}
           </ScrollView>
           <View style={styles.plus}>
            <TouchableOpacity ><Ionicons name="call-outline" size={30} color={"#9d6d6d"}/></TouchableOpacity>
            <TouchableOpacity><Ionicons name="people" size={30} color={"#9d6d6d"}/></TouchableOpacity>
            <TouchableOpacity><Ionicons name="chatbubble-outline" size={30} color={"#9d6d6d"}/></TouchableOpacity>
            <TouchableOpacity><Ionicons name="person" size={30} color={"#9d6d6d"}/></TouchableOpacity>
           </View>
        </View>
)
}
const styles = StyleSheet.create({
    page:{
        display:"flex",
        flexDirection:"column",
        justifyContent:"flex-start",
        flex: 1, 
        height:"100%"
        },
    friendOrccG:{
        backgroundColor:"#f5f5f5",
        height: 20,
        flexDirection:"row"
    },
    friends:{
        flexDirection:"column",
        borderRadius:25,
        padding:2,
        opacity:0.6,
        
    },
    chats:{
        flexDirection:"column",
        display:"flex",
        height:"70%"
    },
    chatCard:{
        flexDirection:"row",
        backgroundColor:"#f5f1f1",
        margin:4,
        borderRadius:10,
        shadowColor:"black",
        shadowRadius:10,
        shadowOffset:{width:4,height:2},
        shadowOpacity:0.5,
        opacity:0.6
    },
    plus:{
        backgroundColor:"#5a3e36",
        height: 40,
        flexDirection:"row",
        justifyContent:"space-evenly"
    },
     background: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        height:"100%",
    },
    image:{
        height:70,
        width:70,
        borderRadius:45
    },
    profimage:{
        borderRadius:25,
        height:50,
        width:50,
        marginLeft:"10%"
    },
    nameAndMssg:{
        width:"60%",
    },
    notifAndTime:{
        marginLeft:"auto",
    },
    name:{},
    mssg:{
        maxWidth:"90%",
    },
    search:{
        height: 30,
        justifyContent:"center",
        width:"100%"
    },
    read:{

    },
    notRead:{
        fontWeight:"bold"
    },
    logoImg:{
        height:"100%",
        width:"20%",
        marginLeft:"auto"
    },
    searchTouch:{
        justifyContent:"center",
        flexDirection:"row",
        alignSelf:"center",
        borderColor:"#625252",
        width:"90%",
        borderWidth:2,
        borderRadius:10,
    }
});
