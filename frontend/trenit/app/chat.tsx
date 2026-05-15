import IP_ADDRESS from '@/assets/config';
import { fetchWithAuth } from '@/assets/fetch';
import { useAuth } from '@/components/AuthContext';
import { useChatSocket } from '@/components/ChatSocketContext';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { StompSubscription } from "@stomp/stompjs";
/*import { Image } from 'expo-image';*/
import { Stack, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, AppState, AppStateStatus, FlatList, Image, Keyboard, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { v4 as uuidv4 } from 'uuid';

import 'react-native-get-random-values';

import * as ImagePicker from "expo-image-picker";
import { TextDecoder, TextEncoder } from 'text-encoding';
import nacl, { box, randomBytes } from "tweetnacl";
import { decodeBase64, decodeUTF8, encodeBase64, encodeUTF8 } from 'tweetnacl-util';


Object.assign(globalThis, {
  TextEncoder,
  TextDecoder,
});


export default function Chat() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const receiverEmail = Array.isArray(params.receivermail) ? params.receivermail[0] : params.receivermail;
  const sharedKeyRef = useRef<Uint8Array | null>(null);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const [content, setContent] = useState("");
  const [disappearing, setDisappearing] = useState(false);
  const [sharedKey, setSharedKey] = useState<Uint8Array>();

  const [publicEncryptingKeyReceiver, setPublicEncryptingKeyReceiver] = useState<string>('');
  const [chatMessages, setChatMessages] = useState<Record<string, any>>({});
  const messages = chatMessages[receiverEmail] || [];
  const subscriptionRef = useRef<StompSubscription | null>(null);
  const readsubscriptionRef = useRef<StompSubscription | null>(null);

  const openedsubscriptionRef = useRef<StompSubscription | null>(null);

  const { email, token, privateSigningKey, privateEncryptingKey } = useAuth();
  const { stompClient, connected } = useChatSocket();

  const [revealedMessages, setRevealedMessages] = useState<Record<string, boolean>>({});


  useEffect(() => {
    if (Platform.OS !== "android") return;

    const show = Keyboard.addListener("keyboardDidShow", (e) => {
      setKeyboardHeight(e.endCoordinates.height - insets.bottom);
    });

    const hide = Keyboard.addListener("keyboardDidHide", () => {
      setKeyboardHeight(0);
    });

    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  useEffect(() => {
    console.log(`[VREME: ${new Date().toISOString().split('T')[1]}] 0. U prvom sam useeffectu...`);
    let currentReceiverCryptoKey = publicEncryptingKeyReceiver;


    async function getPublicKeys(useremail: string) {
      if (!token) {
        console.log("access token not found")
        return;
      }
      try {


        const response = await fetchWithAuth(`http://${IP_ADDRESS}:8080/users/getPublicKeys?userEmail=${useremail}`, token)
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return data;


      } catch (error) {
        console.error("Error fetching previous messages:", error);
      }
    }


    async function receiverKeys() {
      const receiverData = await getPublicKeys(receiverEmail);
      if (receiverData && privateEncryptingKey !== "" && privateEncryptingKey !== null) {
        const { publicEncryptingkey } = receiverData;

        currentReceiverCryptoKey = publicEncryptingkey;
        setPublicEncryptingKeyReceiver(publicEncryptingkey);

        const sharedB = box.before(decodeBase64(currentReceiverCryptoKey), decodeBase64(privateEncryptingKey));
        setSharedKey(sharedB);
        sharedKeyRef.current = sharedB;
      }
    }
    receiverKeys();


  }, [receiverEmail, privateEncryptingKey, token])

  useEffect(() => {
    if (!email || !receiverEmail) return;

    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState !== 'active') {
        if (stompClient.current && connected) {
          stompClient.current.publish({
            destination: "/socket-subscriber/inactive-chat",
            body: email

          });
        }
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, [email, receiverEmail, connected, stompClient]);



  useEffect(() => {
    async function SetConnection() {
      if (!connected || !stompClient.current || !email) return;
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
      }

      if (readsubscriptionRef.current) {
        readsubscriptionRef.current.unsubscribe();
      }

      if (openedsubscriptionRef.current) {
        openedsubscriptionRef.current.unsubscribe();
      }


      subscriptionRef.current = stompClient.current.subscribe(`/user/${email}/queue/messages`, (message) => {


        const receivedMessage = JSON.parse(message.body);


        const chatKey = receivedMessage.senderEmail === email ? receivedMessage.receiverEmail : receivedMessage.senderEmail;

        if (sharedKeyRef.current && receivedMessage.disappearingStatus !== "READ") {
          try {
            const decrypted = decrypt(sharedKeyRef.current, receivedMessage.content);
            receivedMessage.content = decrypted;
          } catch (e) {
            console.log("WS Decryption error", e);
          }

        }
        if (receivedMessage.disappearingStatus === "READ") {
          receivedMessage.content = "disappearing..."
        }
        console.log("Subscribed:", subscriptionRef.current);
        setChatMessages((prev) => {

          return {
            ...prev,
            [chatKey]: [...(prev[chatKey] || []), receivedMessage]
          };
        });
      });


      readsubscriptionRef.current = stompClient.current.subscribe(`/user/${email}/queue/read`, (message) => {


        const readUpdate = JSON.parse(message.body);


        const updatedMessageIds: number[] = readUpdate.messageId || [];
        console.log("evo ih id:" + updatedMessageIds);

        if (updatedMessageIds.length === 0) return;

        setChatMessages((prev) => {
          const updatedChats: Record<string, any[]> = {};

          for (const chatKey in prev) {
            const currentMessages = Array.isArray(prev[chatKey]) ? prev[chatKey] : [];

            updatedChats[chatKey] = currentMessages.map((msg: any) =>
              updatedMessageIds.includes(msg.clientId)
                ? { ...msg, read: true }
                : msg


            );
          }

          return {
            ...prev,
            ...updatedChats,
          };
        });

      });


      openedsubscriptionRef.current = stompClient.current.subscribe(`/user/${email}/queue/message-opened`, (message) => {


        const messageUpdate = JSON.parse(message.body);


        const updatedMessageIds: number[] = messageUpdate.messageId || [];

        if (updatedMessageIds.length === 0) return;

        setChatMessages((prev) => {
          const updatedChats: Record<string, any[]> = {};

          for (const chatKey in prev) {
            const currentMessages = Array.isArray(prev[chatKey]) ? prev[chatKey] : [];

            updatedChats[chatKey] = currentMessages.map((msg: any) =>
              updatedMessageIds.includes(msg.clientId)
                ? { ...msg, disappearingStatus: "READ" }
                : msg


            );
          }

          return {
            ...prev,
            ...updatedChats,
          };
        });

      });
    }


    SetConnection();


  }, [token, connected, email, stompClient]);


  useFocusEffect(
    useCallback(() => {
      if (!stompClient.current || !connected) return;

      stompClient.current.publish({
        destination: "/socket-subscriber/active-chat",
        body: JSON.stringify({
          userEmail: email,
          withUser: receiverEmail
        })
      });

      return () => {
        if (!email) return;
        stompClient.current?.publish({
          destination: "/socket-subscriber/inactive-chat",
          body: email
        });
      };
    }, [receiverEmail, connected, email, stompClient]));


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
            if (msg.disappearingStatus === "READ") {
              msg.content = "";
            } else {
              msg.content = decrypt(sharedKey, msg.content);
            }
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
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    populateChat();

    return () => {
      isMounted = false;
    };
  }, [email, receiverEmail, privateEncryptingKey, sharedKey, token]);



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
    if (sharedKey != null && privateSigningKey != null) {
      const imagesToSend = selectedImages;
      setSelectedImages([]);
      const finalcontent = encrypt(sharedKey, rawContent);
      const signature = sign(finalcontent, decodeBase64(privateSigningKey));
      const clientId = uuidv4();
      const disappearingstatus = disappearing ? "DISAPPEARING" : "NOT_DISAPPEARING";
      let imageIds: number[] = [];

      const localMessage = {
        clientId,
        content: rawContent,
        signature,
        timeSent: new Date().toISOString(),
        senderEmail: email,
        receiverEmail,
        disappearingStatus: disappearingstatus,
        read: false,
        imageIds: [],
        localImageUris: imagesToSend,
        sending: true,
      };
      setChatMessages((prev) => ({
        ...prev,
        [receiverEmail]: [...(prev[receiverEmail] || []), localMessage]
      }));
      if (imagesToSend.length > 0) {
        imageIds = await uploadMessageImages(imagesToSend);
      }

      const message = {
        clientId: clientId,
        content: finalcontent,
        signature: signature,
        timeSent: new Date().toISOString(),
        senderEmail: email,
        receiverEmail: receiverEmail,
        disappearingStatus: disappearingstatus,
        read: false,
        imageIds: imageIds,
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

      setChatMessages((prev) => ({
        ...prev,
        [receiverEmail]: (prev[receiverEmail] || []).map((msg: any) =>
          msg.clientId === clientId
            ? {
              ...msg,
              imageIds,
              localImageUris: [],
              sending: false,
            }
            : msg
        ),
      }));
    }
  };

  const newNonce = () => randomBytes(box.nonceLength);

  function revealMessage(item: any) {
    setRevealedMessages((prev) => ({
      ...prev,
      [item.clientId]: true,
    }));

    stompClient.current?.publish({
      destination: '/socket-subscriber/open-message',
      body: JSON.stringify({
        clientId: item.clientId,
        userEmail: email
      })
    })
    setTimeout(() => {
      setRevealedMessages((prev) => ({
        ...prev,
        [item.clientId]: false,
      }));

    }, 10000);

  }

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

  function pickImages() {
    const pickImages = async () => {
      const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        Alert.alert("Permission needed", "Allow gallery access to choose images.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        selectionLimit: 5,
        quality: 0.4,
      });

      if (result.canceled) return;

      const uris = result.assets.map((asset) => asset.uri);
      setSelectedImages((prev) => [...prev, ...uris]);
    };

    pickImages();
  }

  async function uploadMessageImages(imageUris: string[]) {
    if (!token || imageUris.length === 0) return [];

    const formData = new FormData();


    imageUris.forEach((uri, index) => {
      const fileName = uri.split("/").pop() ?? `image-${index}.jpg`;

        console.log("ANDROID UPLOAD URI:", uri);
       formData.append("files", {
      uri: Platform.OS === "android" ? uri : uri.replace("file://", ""),
      name: fileName,
      type: "image/jpeg",
    } as any);
  });

    const response = await fetch(
      `http://${IP_ADDRESS}:8080/messages/images`,
      {
        method: "POST",
        body: formData,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Image upload failed: ${response.status}`);
    }
    return await response.json();
  }
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

    <View style={{ flex: 1 }}>
      {(<Stack.Screen
        options={{
          headerLeft: () => (
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <MaterialCommunityIcons name="account" size={34} color="#5a3e36" />
              <Text style={{ fontWeight: "bold", fontSize: 15, padding: 5, margin: 5 }}>{receiverEmail}</Text>
            </View>
          ),
        }}
      />)}
      {isLoading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#128C7E" />
        </View>
      ) : (<View style={{ flex: Platform.OS === 'ios' ? 1 : 0.9 }}>
        <FlatList
          inverted={true}
          data={[...messages].reverse()}
          keyboardShouldPersistTaps="handled"
          keyExtractor={(item) => item.clientId}
          contentContainerStyle={{ paddingBottom: 80 }}
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

                {/*#DCF8C6 */}
                <TouchableOpacity
                  disabled={item.disappearingStatus !== "DISAPPEARING" || item.senderEmail === email}
                  onPress={() => revealMessage(item)}
                  style={{
                    backgroundColor: isMe ? "#dfc490" : "#ececec",
                    padding: 10,
                    borderRadius: 10,
                  }}
                >
                  <Text style={{
                    opacity: item.disappearingStatus === "NOT_DISAPPEARING" && !revealedMessages[item.clientId] ? 1 : 0.4,
                    fontStyle: item.disappearingStatus === "DISAPPEARING" ? "italic" : "normal",
                  }}>
                    {item.disappearingStatus === "READ" &&
                      !revealedMessages[item.clientId]
                      ? <Text>Disappearing <MaterialCommunityIcons name="clock-fast" /></Text>

                      : item.disappearingStatus === "DISAPPEARING" &&
                        item.senderEmail !== email

                        ? revealedMessages[item.clientId]
                          ? item.content
                          : "Tap to reveal 👀"

                        : item.disappearingStatus === "DISAPPEARING" &&
                          item.senderEmail === email

                          ? <Text>Disappearing <MaterialCommunityIcons name="clock-fast" /></Text>

                          : sharedKey
                            ? item.content
                            : "Decrypting..."}</Text>

                  {item.localImageUris?.map((uri: string) => (
                    <Image key={uri} source={{
                      uri: uri, headers: {
                        Authorization: `Bearer ${token}`,
                      },
                    }} style={styles.messageImage} />
                  ))}
                  {item.imageIds?.map((id: number) => (
                    <Image
                      key={id}
                      source={{
                        uri: `http://${IP_ADDRESS}:8080/messages/images/${id}`,
                        headers: {
                          Authorization: `Bearer ${token}`,
                        },
                      }}
                      /*contentFit="cover"*/
                      onLoad={() => console.log("IMAGE LOADED:", id)}
                      onError={(e) => console.log("IMAGE ERROR:", id)}
                      style={styles.messageImage}
                    />
                  ))} 
                  {item.sending && (
  <Text style={{ fontSize: 10, color: "gray", fontStyle: "italic" }}>
    sending...
  </Text>
)}


                  <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                    <Text style={{ fontSize: 10, color: "gray", marginTop: 5 }}>
                      {new Date(item.timeSent).toLocaleTimeString()}
                    </Text>
                    {(isMe && !item.read && !item.sending) ? <MaterialIcons name="check" size={13} /> : null}
                    {(isMe && item.read) ? <MaterialCommunityIcons name="check-all" size={13} color="#29889d" /> : null}
                  </View>
                </TouchableOpacity>
              </View>
            );
          }}
        /></View>
      )}
      {Platform.OS === 'ios' ? (
        <KeyboardAvoidingView
          behavior={'padding'}
          keyboardVerticalOffset={90}
        >
          <View style={styles.inputContainer}>

            {selectedImages.length > 0 && (
              <View style={styles.selectedImagesRow}>
                {selectedImages.map((uri) => (
                  <View key={uri} style={styles.imageWrapper}>
                    <Image source={{ uri }} style={styles.selectedImage} />

                    <TouchableOpacity
                      style={styles.removeImageButton}
                      onPress={() =>
                        setSelectedImages((prev) =>
                          prev.filter((img) => img !== uri)
                        )
                      }
                    >
                      <MaterialCommunityIcons
                        name="close"
                        size={14}
                        color="white"
                      />
                    </TouchableOpacity>
                  </View>

                ))}
              </View>
            )}
            <View style={styles.bottomRow}>
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
                <TouchableOpacity
                  onPress={() => pickImages()}
                  style={styles.iconButton}
                >
                  <MaterialCommunityIcons
                    name={"image-outline"}
                    size={24}
                    color={"#128C7E"}
                  />
                </TouchableOpacity>
              </View>



              <TouchableOpacity
                style={[styles.sendButton, { backgroundColor: connected && (content.trim() || selectedImages.length!==0) ? '#128C7E' : '#A0A0A0' }]}
                onPress={sendMessage}
                disabled={/*!connected ||*/ (!content.trim() && selectedImages.length===0) }
              >
                <MaterialCommunityIcons name="send" size={24} color="white" style={{ marginLeft: 4 }} />
              </TouchableOpacity>
            </View></View>
        </KeyboardAvoidingView>
      ) : (
        <View style={[
          styles.inputContainerAndroid,
          { bottom: keyboardHeight }
        ]}>
           {selectedImages.length > 0 && (
              <View style={styles.selectedImagesRow}>
                {selectedImages.map((uri) => (
                  <View key={uri} style={styles.imageWrapper}>
                     <Image source={{
                      uri: uri, headers: {
                        Authorization: `Bearer ${token}`,
                      },
                    }} style={styles.selectedImage} />
                

                    <TouchableOpacity
                      style={styles.removeImageButton}
                      onPress={() =>
                        setSelectedImages((prev) =>
                          prev.filter((img) => img !== uri)
                        )
                      }
                    >
                      <MaterialCommunityIcons
                        name="close"
                        size={14}
                        color="white"
                      />
                    </TouchableOpacity>
                  </View>

                ))}
              </View>
            )}
          <View style={styles.bottomRow}>
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
              <TouchableOpacity
                onPress={() => pickImages()}
                style={styles.iconButton}
              >
                <MaterialCommunityIcons
                  name={"image-outline"}
                  size={24}
                  color={"#128C7E"}
                />
              </TouchableOpacity>

            </View>
          <TouchableOpacity
            style={[styles.sendButton, { backgroundColor: connected && (content.trim() ||  selectedImages.length !== 0 )? '#128C7E' : '#A0A0A0' }]}
            onPress={sendMessage}
            disabled={!connected || (!content.trim() && selectedImages.length === 0)}
          >
            <MaterialCommunityIcons name="send" size={24} color="white" style={{ marginLeft: 4 }} />
          </TouchableOpacity>
        </View></View>
      )}

    </View>
  );
};
const styles = StyleSheet.create({

  inputContainer: {
    /*flexDirection: 'row',
    alignItems: 'flex-end',*/
    paddingHorizontal: 8,
    paddingVertical: 8,
    backgroundColor: 'transparent',
    paddingBottom: Platform.OS === "android" ? 20 : 8,
  },
  messageImage: {
    width: 180,
    height: 180,
    borderRadius: 12,
    marginTop: 6,
  },
  bottomRow: {
    flexDirection: "row",
    alignItems: "flex-end",
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
    maxWidth:"100%"
  },
  imageWrapper: {
    position: "relative",
  },

  removeImageButton: {
    position: "absolute",
    top: -5,
    right: -5,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },

  selectedImagesRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 8,
    paddingHorizontal: 8,
    flexWrap: "wrap",
  },

  selectedImage: {
    width: 55,
    height: 55,
    borderRadius: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 10,
    paddingTop: 10,
  },
  iconButton: {
    padding: 1,
  },
  /* selectedImagesRow: {
   flexDirection: "row",
   gap: 8,
   marginBottom: 8,
   paddingHorizontal: 8,
 },
 
 selectedImage: {
   width: 55,
   height: 55,
   borderRadius: 10,
 },*/
  inputContainerAndroid: {
    position: "absolute",
    left: 0,
    bottom:0,
    right: 0,
    /*flexDirection: "row",
    alignItems: "flex-end",*/
    paddingHorizontal: 8,
    paddingVertical: 8,
    backgroundColor: "#EFEAE2",
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
