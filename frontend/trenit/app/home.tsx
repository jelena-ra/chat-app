import IP_ADDRESS from '@/assets/config';
import { fetchWithAuth } from '@/assets/fetch';
import { useAuth } from '@/components/AuthContext';
import { useChatSocket } from '@/components/ChatSocketContext';
import Background from '@/components/GlobalBackground';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { StompSubscription } from '@stomp/stompjs';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';

import { FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import 'text-encoding';
import { box } from "tweetnacl";
import { decodeBase64, encodeUTF8 } from 'tweetnacl-util';


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
    isRead: boolean;
    senderEmail:string;
}

const publicKeysCache: Record<string, { publicEncryptingkey: string }> = {};

export default function Home() {
    console.log(`[VREME: ${new Date().toISOString().split('T')[1]}] usao u home...`);
    const router = useRouter();

      const { stompClient, connected } = useChatSocket();

    const [chats, setChats] = useState<ChatItem[]>([]);
    const { email, token, privateEncryptingKey } = useAuth();
    const subscriptionRef = useRef<StompSubscription | null>(null);


    async function getMissingPublicKeys(partnerEmails: string[]) {
        if (!token) return {};

        const missingEmails = partnerEmails.filter(
            (partnerEmail) => !publicKeysCache[partnerEmail]
        );

        if (missingEmails.length === 0) {
            return publicKeysCache;
        }

        const t1 = Date.now();

        const keysResponse = await fetchWithAuth(
            `http://${IP_ADDRESS}:8080/users/getAllPublicKeys`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(missingEmails),
            },
            token
        );

        console.log("getAllPublicKeys fetch:", Date.now() - t1, "ms");

        if (!keysResponse.ok) {
            throw new Error("HTTP error: " + keysResponse.status);
        }

        const keysList = await keysResponse.json();
        console.log("getAllPublicKeys + json:", Date.now() - t1, "ms");

        keysList.forEach((item: any) => {
            publicKeysCache[item.email] = {
                publicEncryptingkey: item.publicEncryptingkey,
            };
        });

        return publicKeysCache;
    }

useFocusEffect(
    useCallback(() => {
        if (!connected || !stompClient.current || !email) return;

        if (subscriptionRef.current) {
            subscriptionRef.current.unsubscribe();
        }

        subscriptionRef.current = stompClient.current.subscribe(
            `/user/${email}/queue/messages`,
            async (message) => {
                console.log("HOME dobio novu poruku:", message.body);
                await getMessages();
            }
        );

        return () => {
            subscriptionRef.current?.unsubscribe();
            subscriptionRef.current = null;
        };
    }, [connected, email, token, privateEncryptingKey, stompClient])
);

async function getMessages() {
            if (!email || !token) {
            
                return;
            }
        
            try {
                //console.log("getChats fetch:", Date.now() - t0, "ms");
                const response = await fetchWithAuth(`http://${IP_ADDRESS}:8080/messages/getChats?userEmail=${email}`, {
                    method: 'GET',
                }, token);

                if (!response.ok) {
                    throw new Error("HTTP error: " + response.status);
                }

                const data = (await response.json()) as Record<string, MessageDTO>;
                //console.log("getChats + json:", Date.now() - t0, "ms");


                const partnerEmails = Object.keys(data);

                const keysByEmail = await getMissingPublicKeys(partnerEmails);

                //const t2 = Date.now();

                const transformedChats: ChatItem[] = Object.entries(data).map(
                    ([partnerEmail, lastMessageDTO]) => {

                        const partnerKeys = keysByEmail[partnerEmail];

                        let content = "";
                        let senderEmail = "";

                        if(lastMessageDTO.senderEmail!=null){
                            senderEmail = lastMessageDTO.senderEmail;
                        }

                        if (partnerKeys?.publicEncryptingkey && privateEncryptingKey) {
                            const sharedKey = box.before(
                                decodeBase64(partnerKeys.publicEncryptingkey),
                                decodeBase64(privateEncryptingKey)
                            );
                            content = decrypt(sharedKey, lastMessageDTO.content) ?? "";
                        }
                        console.log("Is read? "+lastMessageDTO.read);
                        return {
                            partnerEmail,
                            content,
                            timeSent: lastMessageDTO.timeSent.slice(5, 16).replace("T", " "),
                            isRead:lastMessageDTO.read,
                            senderEmail
                        };

                    }

                ).sort((a, b) =>
            new Date(b.timeSent).getTime() - new Date(a.timeSent).getTime()
            );
                //console.log("decrypt+transform:", Date.now() - t2, "ms");
                //console.log("TOTAL:", Date.now() - t0, "ms");
                
                setChats(transformedChats);
                //console.log(`[VRIJEME: ${new Date().toISOString().split('T')[1]}] 6. State Chatova je postavljen (setChats završeno).`);

            } catch (error) {
                console.log("Error :" + error)
            }
        }
        
    useEffect(() => {
        getMessages();
    },[email] )

    function decrypt(secretOrSharedKey: Uint8Array, messageWithNonce: string) {

        const messageWithNonceAsUint8Array = decodeBase64(messageWithNonce);
        const nonce = messageWithNonceAsUint8Array.slice(0, box.nonceLength);

        const message = messageWithNonceAsUint8Array.slice(
            box.nonceLength,
            messageWithNonceAsUint8Array.length
        );

        const decrypted = box.open.after(message, nonce, secretOrSharedKey);

        if (!decrypted) {
            //throw new Error('Could not decrypt message');
            return null;
        }

        const base64DecryptedMessage = encodeUTF8(decrypted);
        return JSON.parse(base64DecryptedMessage);
    };


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
                            <View style={styles.name}><Text style={(!item.isRead && item.senderEmail!==email) ? styles.notRead : null}>{item.partnerEmail}</Text>
                            </View>
                            <View style={styles.mssg}><Text numberOfLines={1} ellipsizeMode="tail">{item.content}</Text></View>
                        </View>
                        <View style={styles.notifAndTime}>
                            <View style={styles.name}><Text>{item.timeSent}</Text></View>
                            {(!item.isRead && item.senderEmail!==email) ? (<View>
                                <MaterialCommunityIcons
                                    name="circle"
                                    size={16}
                                    color="#e30d0d"
                                    
                                     style={{ marginTop: 6, alignSelf: "flex-end",opacity:1 }}
                                />
                                </View>
                                ) :  null}
                            
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
     flexDirection: "column",
    alignItems: "flex-end",
    justifyContent: "center",
    paddingRight: 10,
    minWidth: 10,
   
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
