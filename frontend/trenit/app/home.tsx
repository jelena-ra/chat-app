import IP_ADDRESS from '@/assets/config';
import { fetchWithAuth } from '@/assets/fetch';
import Background from '@/components/GlobalBackground';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";


const profileImg = require('@/assets/images/profile.png');


interface MessageDTO {
    content: string;
    signature: string;
    isDisappearing: boolean;
    timeSent: string;
    read: boolean;
    senderEmail?: string;
    receiverEmail?: string;
}

interface ChatItem {
    partnerEmail: string;
    content: string;
    timeSent: string;
}

export default function Home() {
    const router = useRouter();
    const [email, setEmail] = useState<string | null>(null);
    const [chats, setChats] = useState<ChatItem[]>([]);
    const [token, setToken] = useState<string | null>(null);


    useEffect(() => {
        const getEmailToken = async () => {
            console.log('Uzima tokene i to');
            const em = await SecureStore.getItemAsync('email');
            const t = await SecureStore.getItemAsync('accessToken');
            if (em != null) {
                setEmail(em);
            } else {
                console.log("nema email")
            }
            if (t != null) {
                setToken(t);
            } else {
                console.log("nema tokena")
            }
        }
        getEmailToken();
    }, [])


    useEffect(() => {
        async function getMessages() {
            console.log('Uzima chatove i to');

            try {
                console.log("Pokusava dobaviit sve poruke i chatove");
                if (!email || !token) return;

                const response = await fetchWithAuth(`http://${IP_ADDRESS}:8080/messages/getChats?userEmail=${email}`, {
                    method: 'GET',

                });


                if (!response.ok) {
                    throw new Error("HTTP greška: " + response.status);
                }


                const data = (await response.json()) as Record<string, MessageDTO>;


                const transformedChats = Object.entries(data).map(([partnerEmail, lastMessageDTO]) => {
                    return {
                        partnerEmail: partnerEmail,
                        content: lastMessageDTO.content,
                        timeSent: lastMessageDTO.timeSent
                    };
                });

                /*transformedChats.sort((a, b) => new Date(b.timeSent).getTime() - new Date(a.timeSent).getTime());*/

                setChats(transformedChats);


            } catch (error) {
                console.log("Oops..there was an error : " + error);
            }


        }
        getMessages();
    }, [email])

    function handleChatPress(chat: any) {
        router.push({
            pathname: '/chat',
            params: { receivermail: chat.partnerEmail }
        });
    }
    return (
        
        <View style={styles.page}>
            <Background />
            <View style={styles.search}>
                <TouchableOpacity style={styles.searchTouch}><Ionicons name="search" size={30} color="#000" /><Text >Search</Text></TouchableOpacity>
            </View>
            <FlatList horizontal={true} style={styles.friendOrccG} data={chats} initialNumToRender={7} maxToRenderPerBatch={7} windowSize={7}
                keyExtractor={(item) => item.partnerEmail}
                renderItem={({ item }) => (

                    <TouchableOpacity style={{ borderRadius: 55 }}>
                        <View style={styles.friends}>
                            <Image style={styles.image} source={profileImg}></Image>
                            <Text numberOfLines={1} style={{ width: 50, fontSize: 10 }}>{item.partnerEmail}</Text>
                        </View>
                    </TouchableOpacity>
                )}
            />
            <FlatList style={styles.chats} data={chats}
                keyExtractor={(item) => item.partnerEmail}
                renderItem={({ item }) => (
                    <TouchableOpacity style={styles.chatCard} onPress={() => handleChatPress(item)}>
                        <View style={styles.image}><Image source={profileImg} style={styles.profimage}></Image></View>
                        <View style={styles.nameAndMssg}>
                            <View style={styles.name}><Text /*style={message.isRead ? styles.read : styles.notRead}*/>{item.partnerEmail}</Text>
                            </View>
                            <View style={styles.mssg}><Text numberOfLines={1} ellipsizeMode="tail">{item.content}</Text></View>
                        </View>
                        <View style={styles.notifAndTime}>
                            <View style={styles.name}><Text>{item.timeSent}</Text></View>

                        </View>
                    </TouchableOpacity>)}
            />
            <View style={styles.plus}>
                <TouchableOpacity ><Ionicons name="call-outline" size={30} color={"#9d6d6d"} /></TouchableOpacity>
                <TouchableOpacity><Ionicons name="people" size={30} color={"#9d6d6d"} /></TouchableOpacity>
                <TouchableOpacity><Ionicons name="chatbubble-outline" size={30} color={"#9d6d6d"} /></TouchableOpacity>
                <TouchableOpacity><Ionicons name="person" size={30} color={"#9d6d6d"} /></TouchableOpacity>
            </View>
        </View>
    )
}
const styles = StyleSheet.create({
    page: {
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-start",
        flex: 1,
        height: "100%"
    },
    friendOrccG: {
        backgroundColor: "#f5f5f5",
        height: 20,
        flexDirection: "row"
    },
    friends: {
        flexDirection: "column",
        borderRadius: 25,
        padding: 2,
        opacity: 0.6,

    },
    chats: {
        flexDirection: "column",
        display: "flex",
        height: "70%"
    },
    chatCard: {
        flexDirection: "row",
        backgroundColor: "#f5f1f1",
        margin: 4,
        borderRadius: 10,
        shadowColor: "black",
        shadowRadius: 10,
        shadowOffset: { width: 4, height: 2 },
        shadowOpacity: 0.5,
        opacity: 0.6
    },
    plus: {
        backgroundColor: "#5a3e36",
        height: 40,
        flexDirection: "row",
        justifyContent: "space-evenly"
    },
    background: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        height: "100%",
    },
    image: {
        height: 70,
        width: 70,
        borderRadius: 45
    },
    profimage: {
        borderRadius: 25,
        height: 50,
        width: 50,
        marginLeft: "10%"
    },
    nameAndMssg: {
        width: "60%",
    },
    notifAndTime: {
        marginLeft: "auto",
    },
    name: {},
    mssg: {
        maxWidth: "90%",
    },
    search: {
        height: 30,
        justifyContent: "center",
        width: "100%"
    },
    read: {

    },
    notRead: {
        fontWeight: "bold"
    },
    logoImg: {
        height: "100%",
        width: "20%",
        marginLeft: "auto"
    },
    searchTouch: {
        justifyContent: "center",
        flexDirection: "row",
        alignSelf: "center",
        borderColor: "#625252",
        width: "90%",
        borderWidth: 2,
        borderRadius: 10,
    }
});
