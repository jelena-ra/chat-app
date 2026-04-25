import IP_ADDRESS from '@/assets/config';
import { fetchWithAuth } from '@/assets/fetch';
import {
    decryptGroupMessage,
    decryptMyGroupKey,
    encryptGroupMessage,
    signEncryptedContent
} from '@/assets/groupcrypto';
import { useAuth } from '@/components/AuthContext';
import { useChatSocket } from '@/components/ChatSocketContext';

import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StompSubscription } from '@stomp/stompjs';
import { useLocalSearchParams } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';

interface GroupMessageDTO {
  clientId: string;
  content: string;
  signature: string;
  timeSent: string;
  senderEmail: string;
  groupId: number;
  disappearing: boolean;
}

export default function GroupChat() {
  const params = useLocalSearchParams();
  const groupId = Number(Array.isArray(params.groupId) ? params.groupId[0] : params.groupId);

  const { email, token, privateSigningKey, privateEncryptingKey  } = useAuth();
  const { stompClient, connected } = useChatSocket();

  const [content, setContent] = useState('');
  const [messages, setMessages] = useState<GroupMessageDTO[]>([]);
  const [groupKey, setGroupKey] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const subscriptionRef = useRef<StompSubscription | null>(null);

  useEffect(() => {
    async function loadGroupKey() {

      if (!groupId || !email || !token) return;
     
      try {
        const localKey = await SecureStore.getItemAsync(`groupKey_${groupId}`);
        if (localKey) {
          setGroupKey(localKey);
          return;
        }

        const response = await fetchWithAuth(
          `http://${IP_ADDRESS}:8080/group-keys/my-key?groupId=${groupId}&email=${email}`,
          
        {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            },
            token
        );

        if (!response.ok) {
          throw new Error(`Failed to get group key: ${response.status}`);
        }

        const data = await response.json();

        if (!privateEncryptingKey) {
  throw new Error("Missing private encrypting key");
}

const myGroupKey = decryptMyGroupKey(
  data.encryptedGroupKey,
  data.adminPublicEncryptingKey,
  privateEncryptingKey
);

if (!myGroupKey) {
  throw new Error("Could not decrypt group key");
}

        await SecureStore.setItemAsync(`groupKey_${groupId}`, myGroupKey);
        setGroupKey(myGroupKey);
      } catch (error) {
        console.log("Error loading group key:", error);
      }
    }

    loadGroupKey();
  }, [groupId, email, token, privateEncryptingKey]);

  useEffect(() => {
    async function loadOldMessages() {
      if (!groupId || !token || !groupKey) return;

      try {
        setIsLoading(true);

        const response = await fetchWithAuth(
          `http://${IP_ADDRESS}:8080/messages/group?groupId=${groupId}`,
        {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            },
            token
        );

        if (!response.ok) {
          throw new Error(`Failed loading group messages: ${response.status}`);
        }

        const data = await response.json();

        const decryptedMessages = data.map((msg: GroupMessageDTO) => ({
          ...msg,
          content: decryptGroupMessage(groupKey, msg.content)
        }));

        setMessages(decryptedMessages);
      } catch (error) {
        console.log("Error loading group messages:", error);
      } finally {
        setIsLoading(false);
      }
    }

    loadOldMessages();
  }, [groupId, token, groupKey]);



 useEffect(() => {
  if (!connected || !stompClient.current || !groupId || !groupKey) return;

  console.log("SUBSCRIBING TO GROUP:", `/topic/group/${groupId}`);

  const sub = stompClient.current.subscribe(
    `/topic/group/${groupId}`,
    (message) => {
      console.log("GROUP WS RECEIVED:", message.body);

      const received = JSON.parse(message.body) as GroupMessageDTO;
      const decrypted = decryptGroupMessage(groupKey, received.content);

      setMessages((prev) => {
        if (prev.some((m) => m.clientId === received.clientId)) {
          return prev;
        }

        return [
          ...prev,
          { ...received, content: decrypted }
        ];
      });
    }
  );

  subscriptionRef.current = sub;

  return () => {
    console.log("UNSUBSCRIBING FROM GROUP:", `/topic/group/${groupId}`);
    sub.unsubscribe();
    subscriptionRef.current = null;
  };
}, [connected, groupId, groupKey, stompClient]);

  const sendMessage = async () => {
    if (!stompClient.current || !connected || !content.trim() || !groupKey || !privateSigningKey || !email) {
      return;
    }

    const rawContent = content;
    setContent('');

    const encrypted = encryptGroupMessage(groupKey, rawContent);
    const signature = signEncryptedContent(encrypted, privateSigningKey);

    const message = {
      clientId: uuidv4(),
      content: encrypted,
      signature,
      timeSent: new Date().toISOString(),
      senderEmail: email,
      groupId,
      disappearing: false
    };

    try {
      stompClient.current.publish({
        destination: `/socket-subscriber/group/${groupId}`,
        body: JSON.stringify(message)
      });

      setMessages((prev) => [
        ...prev,
        { ...message, content: rawContent }
      ]);
    } catch (error) {
      console.log("Error sending group message:", error);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      style={{ flex: 1, backgroundColor: '#EFEAE2' }}
    >
      {isLoading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#128C7E" />
        </View>
      ) : (
        <FlatList
          inverted
          data={[...messages].reverse()}
          keyExtractor={(item) => item.clientId}
          renderItem={({ item }) => {
            const isMe = item.senderEmail === email;

            return (
              <View
                style={{
                  alignSelf: isMe ? 'flex-end' : 'flex-start',
                  marginVertical: 5,
                  maxWidth: '70%',
                }}
              >
                <Text style={{ fontSize: 12, color: 'gray' }}>
                  {item.senderEmail}
                </Text>

                <View
                  style={{
                    backgroundColor: isMe ? '#dfc490' : '#ececec',
                    padding: 10,
                    borderRadius: 10,
                  }}
                >
                  <Text>{item.content}</Text>
                  <Text style={{ fontSize: 10, color: 'gray', marginTop: 5 }}>
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
            placeholder="Group message"
            placeholderTextColor="#888"
            multiline
          />
        </View>

        <TouchableOpacity
          style={[
            styles.sendButton,
            { backgroundColor: connected && content.trim() ? '#128C7E' : '#A0A0A0' }
          ]}
          onPress={sendMessage}
          disabled={!connected || !content.trim()}
        >
          <MaterialCommunityIcons name="send" size={24} color="white" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
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
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
});