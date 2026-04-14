import IP_ADDRESS from '@/assets/config';
import { fetchWithAuth } from '@/assets/fetch';
import { useAuth } from '@/components/AuthContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Client, StompSubscription } from "@stomp/stompjs";
import { useLocalSearchParams } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, FlatList, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import 'react-native-get-random-values';
import 'text-encoding';
import nacl, { box, randomBytes } from "tweetnacl";
import { decodeBase64, decodeUTF8, encodeBase64, encodeUTF8 } from 'tweetnacl-util';

const TextEncodingPolyfill = require('text-encoding');
Object.assign(global, {
  TextEncoder: TextEncodingPolyfill.TextEncoder,
  TextDecoder: TextEncodingPolyfill.TextDecoder,
});


export default function Chat() {

  const params = useLocalSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const receiverEmail = Array.isArray(params.receivermail) ? params.receivermail[0] : params.receivermail;
  const sharedKeyRef = useRef<Uint8Array | null>(null);
 
  const [content, setContent] = useState("");
  const [disappearing, setDisappearing] = useState(false);
  const [sharedKey, setSharedKey] = useState<Uint8Array>();

  const [publicEncryptingKeyReceiver, setPublicEncryptingKeyReceiver] = useState<string>('');
  const [chatMessages, setChatMessages] = useState<Record<string, any>>({});
  const messages = chatMessages[receiverEmail] || [];
  const stompClient = useRef<Client | null>(null);
  const [connected, setConnected] = useState(false);
  const subscriptionRef = useRef<StompSubscription | null>(null);

  const { email, token, setToken, privateSigningKey, privateEncryptingKey } = useAuth(); 


  useEffect(() => {

    let currentReceiverCryptoKey = publicEncryptingKeyReceiver;

    async function receiverKeys() {
      const receiverData = await getPublicKeys(receiverEmail);
      if (receiverData && privateEncryptingKey !== "" && privateEncryptingKey!== null) {
        const {  publicEncryptingkey } = receiverData;

        currentReceiverCryptoKey = publicEncryptingkey;
        setPublicEncryptingKeyReceiver(publicEncryptingkey);

        const sharedB = box.before(decodeBase64(currentReceiverCryptoKey), decodeBase64(privateEncryptingKey));
        setSharedKey(sharedB);
        sharedKeyRef.current = sharedB;
      }
    }
    receiverKeys();


  }, [receiverEmail, privateEncryptingKey, publicEncryptingKeyReceiver])



  async function refreshAccessToken() {
    const refreshToken = await SecureStore.getItemAsync('refreshToken');
    if (!refreshToken) throw new Error('No refresh token found');

    const response = await fetch(`http://${IP_ADDRESS}:8080/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: refreshToken })
    });
    const data = await response.json();
    const newAccessToken = data.accessToken;
    const newRefreshToken = data.refreshToken;

    await SecureStore.deleteItemAsync('accessToken');
    await SecureStore.deleteItemAsync('refreshToken');

    await SecureStore.setItemAsync('accessToken', newAccessToken);
    await SecureStore.setItemAsync('refreshToken', newRefreshToken);

    return newAccessToken;
  }


  async function getValidToken(): Promise<string> {
    const token = await SecureStore.getItemAsync('accessToken');
    if (!token) throw new Error('No access token found');

    const payload = JSON.parse(atob(token.split('.')[1]));
    const now = Math.floor(Date.now() / 1000);

    if (payload.exp <= now) {
      console.log('Token expired, refreshing...');
      return await refreshAccessToken();
    }
    return token;
  }

  useEffect(() => {
    async function SetConnection() {

      if (!token || !email) return;
      const tokken = await getValidToken();
      setToken(tokken);

      if (stompClient.current?.active) return;

      const client = new Client({
        brokerURL: `ws://${IP_ADDRESS}:8080/socket`,
        /* webSocketFactory: () => new WebSocket(`ws://${IP_ADDRESS}:8080/socket`),*/
        connectHeaders: {
          Authorization: "Bearer " + tokken
        },

        debug: (msg: any) => console.log(msg),
        reconnectDelay: 5000,

      });
      client.onConnect = () => {
        console.log("Connected to Web Socket");
        console.log(" STOMP CONNECTED");
        console.log("Client: ", client);
        stompClient.current = client;
        setConnected(true);

        if (subscriptionRef.current) {
          subscriptionRef.current.unsubscribe();
        }

        subscriptionRef.current = client.subscribe(`/user/${email}/queue/messages`, (message) => {


          const receivedMessage = JSON.parse(message.body);
          const chatKey = receivedMessage.senderEmail === email ? receivedMessage.receiverEmail : receivedMessage.senderEmail;

          if (sharedKeyRef.current) {
            try {
              const decrypted = decrypt(sharedKeyRef.current, receivedMessage.content);
              receivedMessage.content = decrypted;
            } catch (e) {
              console.log("WS Decryption error", e);
            }

          }
          console.log("Subscribed:", subscriptionRef.current);
          setChatMessages((prev) => {

            return {
              ...prev,
              [chatKey]: [...(prev[chatKey] || []), receivedMessage]
            };
          });
        });
      };

      client.onWebSocketError = (error) => {
        console.error("WS error", error);
      };

      client.onStompError = (frame) => {
        console.error("STOMP Error:", frame);
      };

      client.onDisconnect = () => {
        setConnected(false)
        console.warn("WebSocket disconnected");
      };

      client.activate();


      return () => {
        if (client.connected) {
          console.log("WebSocket disconnecting");
          client.deactivate();
          subscriptionRef.current?.unsubscribe();
          subscriptionRef.current = null;
        }
      };
    }
    SetConnection();
  }, [token]);


  useEffect(() => {
  let isMounted = true; 

  async function populateChat() {
    if (!email || !receiverEmail || !privateEncryptingKey || !sharedKey || !token) {
      return;
    }
    
    console.log(`[VREME: ${new Date().toISOString().split('T')[1]}] 3. Imam email! Šaljem zahtev na backend...`);

    try {
      setIsLoading(true);
      const response = await fetchWithAuth(
        `http://${IP_ADDRESS}:8080/messages/getfromChat?senderEmail=${email}&receiverEmail=${receiverEmail}`,
        token
      );
      console.log(`[VREME: ${new Date().toISOString().split('T')[1]}] 4. Backend je vratio odgovor! Status: ${response.status}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const messages = await response.json();
      
    
      if (!isMounted) return; 

      const filteredkeys = messages.map((msg: any) => {
        const chatKey = msg.senderEmail === email ? msg.receiverEmail : msg.senderEmail;
        try {
          msg.content = decrypt(sharedKey, msg.content);
        } catch (error) {
          console.log("error with decryption: " + error);
        }
        return { ...msg, chatKey };
      });

      setChatMessages((prev) => ({
        ...prev,
        [receiverEmail]: filteredkeys,
      }));
       console.log(`[VREME: ${new Date().toISOString().split('T')[1]}] 7.Postavio je poruke u chatMessages`);

    } catch (error) {
      if (isMounted) {
        console.error("Error fetching previous messages:", error);
      }
    }finally {
        if (isMounted) setIsLoading(false); 
      }
  }

  populateChat();

  return () => {
    isMounted = false; 
  };
}, [email, receiverEmail, privateEncryptingKey, sharedKey, token]);


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


  const sendMessage = async () => {

    const client = stompClient.current;
    if (!client || !connected) {
      console.error("WebSocket not ready");
      return;
    }

    if (!sharedKey && !privateSigningKey) {
      console.warn("Shared key is not ready yet!");
      return;
    }

    const rawContent = content;
    setContent("");
    if(sharedKey!=null && privateSigningKey!=null){
    const finalcontent = encrypt(sharedKey, rawContent);
    const signature = sign(finalcontent, decodeBase64(privateSigningKey));

    const message = {
      content: finalcontent,
      signature: signature,
      timeSent: new Date().toISOString(),
      senderEmail: email,
      receiverEmail: receiverEmail,
      disappearing: disappearing,
    }

    console.log("Sending message:", message);
    try {
      client.publish({
        destination: "/socket-subscriber/send",
        body: JSON.stringify(message),

      });

    } catch (error) {
      console.error("Error sending message:", error);

    }
    message.content = rawContent;
    setChatMessages((prev) => ({
      ...prev,
      [receiverEmail]: [...(prev[receiverEmail] || []), message]
    }));
  
  }
  };

  const newNonce = () => randomBytes(box.nonceLength);


  function encrypt(shared: Uint8Array, json: any) {

    const nonce = newNonce();
    const j = JSON.stringify(json)
    const messageUint8 = decodeUTF8(j);
    const encrypted = box.after(messageUint8, nonce, shared);

    const fullMessage = new Uint8Array(nonce.length + encrypted.length);
    fullMessage.set(nonce);
    fullMessage.set(encrypted, nonce.length);

    const base64FullMessage = encodeBase64(fullMessage);
    return base64FullMessage;
  };

  function decrypt(secretOrSharedKey: Uint8Array, messageWithNonce: string) {

    const messageWithNonceAsUint8Array = decodeBase64(messageWithNonce);
    const nonce = messageWithNonceAsUint8Array.slice(0, box.nonceLength);

    const message = messageWithNonceAsUint8Array.slice(
      box.nonceLength,
      messageWithNonce.length
    );

    const decrypted = box.open.after(message, nonce, secretOrSharedKey);

    if (!decrypted) {
      //throw new Error('Could not decrypt message');
      return null;
    }

    const base64DecryptedMessage = encodeUTF8(decrypted);
    return JSON.parse(base64DecryptedMessage);
  };

  function sign(message: any, secretKey: Uint8Array) {

    const messageAsUint8Array = decodeBase64(message);
    const signature = nacl.sign.detached(messageAsUint8Array, secretKey);
    return encodeBase64(signature);

  }

 /* function verifysignature(message: any, signature: any, publicKey: any) {
    const messageBytes = decodeBase64(message);
    const signature2 = decodeBase64(signature);
    return nacl.sign.detached.verify(messageBytes, signature2, publicKey);
  }*/
  return (
    <KeyboardAvoidingView 
    
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0} 
       style={{ flex: 1, backgroundColor: '#EFEAE2' }} 
    >
       {isLoading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#128C7E" />
        </View>
      ) : (
  

      <FlatList
        inverted={true} 
        data={[...messages].reverse()} 
        keyboardShouldPersistTaps="handled"
        keyExtractor={(_, index) => index.toString()}
        contentContainerStyle={{ paddingBottom: 20 }}
        renderItem={({ item }) => {
          const isMe = item.senderEmail === email;

          return (
            <View
              style={{
                alignSelf: isMe ? "flex-end" : "flex-start",
                marginVertical: 5,
                maxWidth: "70%",
              }}
            >

              <Text style={{ fontSize: 12, color: "gray" }}>
                {item.senderEmail}
              </Text>


              <View
                style={{
                  backgroundColor: isMe ? "#DCF8C6" : "#ECECEC",
                  padding: 10,
                  borderRadius: 10,
                }}
              >
                <Text>
                  {sharedKey
                    ? item.content
                    : "Dekriptovanje..."}
                </Text>
                <Text style={{ fontSize: 10, color: "gray", marginTop: 5 }}>
                  {new Date(item.timeSent).toLocaleTimeString()}
                </Text>
              </View>
            </View>
          );
        }}
      />
)}
      <View style={styles.inputContainer}>
        
        <View style={styles.textInputWrapper}>
          <TextInput 
            style={styles.textInput}
            value={content} 
            onChangeText={setContent} 
            placeholder="Message"
            placeholderTextColor="#888"
            multiline={true}
          />
 
          <TouchableOpacity 
            onPress={() => setDisappearing(!disappearing)} 
            style={styles.iconButton}
          >
            <MaterialCommunityIcons 
              name={disappearing ? "timer" : "timer-off-outline"} 
              size={24} 
              color={disappearing ? "#128C7E" : "#888"}
            />
          </TouchableOpacity>
        </View>

    
        <TouchableOpacity 
          style={[styles.sendButton, { backgroundColor: connected && content.trim() ? '#128C7E' : '#A0A0A0' }]} 
          onPress={sendMessage}
          disabled={!connected || !content.trim()}
        >
          <MaterialCommunityIcons name="send" size={24} color="white" style={{ marginLeft: 4 }} />
        </TouchableOpacity>
    </View>
  
    </KeyboardAvoidingView>
  );
};
const styles = StyleSheet.create({

  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 8,
    paddingVertical: 8,
    backgroundColor: 'transparent',
  },
  textInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingHorizontal: 12,
    minHeight: 48,
    maxHeight: 120,
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 10,
    paddingTop: 10,
  },
  iconButton: {
    padding: 8,
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
  },
});
