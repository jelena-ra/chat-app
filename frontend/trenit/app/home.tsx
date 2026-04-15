import IP_ADDRESS from '@/assets/config';
import { fetchWithAuth } from '@/assets/fetch';
import { useAuth } from '@/components/AuthContext';
import Background from '@/components/GlobalBackground';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
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
}

export default function Home() {
    const router = useRouter();

    const [chats, setChats] = useState<ChatItem[]>([]);
    const { email, token ,privateEncryptingKey} = useAuth(); 
      const sharedKeyRef = useRef<Uint8Array | null>(null);


     async function receiverKeys(receiverEmail: string): Promise<Uint8Array | null> {
  const receiverData = await getPublicKeys(receiverEmail);

  if (receiverData && privateEncryptingKey) {
    const { publicEncryptingkey } = receiverData;

    const sharedB = box.before(
      decodeBase64(publicEncryptingkey),
      decodeBase64(privateEncryptingKey)
    );
    sharedKeyRef.current = sharedB;

    return sharedB;
  }

  return null;
}
 


   async function getPublicKeys(useremail: string) {
    if(!token){
      console.log("access token not found")
      return;
    }
    try {


      const response = await fetchWithAuth(`http://${IP_ADDRESS}:8080/users/getPublicKeys?userEmail=${useremail}`,token)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data;


    } catch (error) {
      console.error("Error fetching previous messages:", error);
    }
  }


    useEffect(() => {
        ////console.log(`[VREME: ${new Date().toISOString().split('T')[1]}] 1. Komponenta Home se učitala. Email vrednost: ${email}`);

        async function getMessages() {
            if (!email || !token) {
                //console.log(`[VREME: ${new Date().toISOString().split('T')[1]}] 2. Još nema emaila ili tokena, prekidam.`);
                return;
            }

            //console.log(`[VREME: ${new Date().toISOString().split('T')[1]}] 3. Imam email! Šaljem zahtev na backend...`);

            try {
                const response = await fetchWithAuth(`http://${IP_ADDRESS}:8080/messages/getChats?userEmail=${email}`, {
                    method: 'GET',
                }, token);

               // console.log(`[VREME: ${new Date().toISOString().split('T')[1]}] 4. Backend je vratio odgovor! Status: ${response.status}`);

                if (!response.ok) {
                    throw new Error("HTTP error: " + response.status);
                }

                const data = (await response.json()) as Record<string, MessageDTO>;
                
                //console.log(`[VREME: ${new Date().toISOString().split('T')[1]}] 5. JSON je parsiran.`);

                const transformedChats = await Promise.all(
                Object.entries(data).map(async ([partnerEmail, lastMessageDTO]) => {
                    const key = await receiverKeys(partnerEmail);

                    return {
                    partnerEmail,
                    content: key ? decrypt(key, lastMessageDTO.content) ?? "" : "",
                    timeSent: lastMessageDTO.timeSent,
                    };
                })
                );

                setChats(transformedChats);
                //console.log(`[VREME: ${new Date().toISOString().split('T')[1]}] 6. State je postavljen (setChats završeno).`);

            } catch (error) {
                console.log("Error :" + error)
                //console.log(`[VREME: ${new Date().toISOString().split('T')[1]}] GREŠKA: ` + error);
            }
        }
        
        getMessages();
    }, [email, token])

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
