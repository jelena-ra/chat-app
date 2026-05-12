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
import { Stack, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, Alert, FlatList, Keyboard, KeyboardAvoidingView, Modal, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StompSubscription } from '@stomp/stompjs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import * as SecureStore from 'expo-secure-store';
import { useEffect, useRef, useState } from 'react';

import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';

interface GroupMessageDTO {
    clientId: string;
    content: string;
    signature: string;
    timeSent: string;
    senderEmail: string;
    groupId: number;
    disappearingStatus: string;
}

export default function GroupChat() {
    const params = useLocalSearchParams();
    const groupId = Number(Array.isArray(params.groupId) ? params.groupId[0] : params.groupId);

    const { email, token, privateSigningKey, privateEncryptingKey } = useAuth();
    const { stompClient, connected } = useChatSocket();
    const insets = useSafeAreaInsets();
    const [addMemberVisible, setAddMemberVisible] = useState(false);
    const [newMemberEmail, setNewMemberEmail] = useState('');

    const [content, setContent] = useState('');
    const [messages, setMessages] = useState<GroupMessageDTO[]>([]);
    const [groupKey, setGroupKey] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const openedsubscriptionRef = useRef<StompSubscription | null>(null);

    const subscriptionRef = useRef<StompSubscription | null>(null);
    const [keyboardHeight, setKeyboardHeight] = useState(0);
    const [disappearing, setDisappearing] = useState(false);
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
        if (!stompClient.current || !connected || !email || !groupId) return;

        stompClient.current.publish({
            destination: "/socket-subscriber/active-group-chat",
            body: JSON.stringify({
                userEmail: email,
                groupId: groupId,
            }),
        });
    }, [connected, email, groupId, stompClient]);

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
                    `http://${IP_ADDRESS}:8080/messages/group?groupId=${groupId}&userEmail=${email}`,
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
                    content: decryptGroupMessage(groupKey, msg.content),
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

    function revealMessage(item: any) {
        setRevealedMessages((prev) => ({
            ...prev,
            [item.clientId]: true,
        }));

        stompClient.current?.publish({
            destination: '/socket-subscriber/open-groupmessage',
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

    async function handleAddMember() {
        if (!email || !token || !groupId || !newMemberEmail.trim()) {
            Alert.alert('Error', 'Enter email.');
            return;
        }

        try {
            const response = await fetchWithAuth(
                `http://${IP_ADDRESS}:8080/groups/add-member`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        groupId,
                        memberEmail: newMemberEmail.trim(),
                        requesterEmail: email,
                    }),
                },
                token
            );

            if (!response.ok) {
                throw new Error(`Add member failed: ${response.status}`);
            }

            Alert.alert('Success', 'Member added.');
            setNewMemberEmail('');
            setAddMemberVisible(false);
        } catch (error) {
            console.log('Add member error:', error);
            Alert.alert('Error', 'Could not add member.');
        }
    }

    useEffect(() => {
        if (!connected || !stompClient.current || !groupId || !groupKey) return;

        console.log("SUBSCRIBING TO GROUP:", `/topic/group/${groupId}`);

        if (openedsubscriptionRef.current) {
            openedsubscriptionRef.current.unsubscribe();
        }


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

        openedsubscriptionRef.current = stompClient.current.subscribe(`/user/${email}/queue/message-opened`, (message) => {


            const messageUpdate = JSON.parse(message.body);


            const updatedMessageIds: string[] = messageUpdate.messageId || [];

            if (updatedMessageIds.length === 0) return;


            setMessages((prev) =>
                prev.map((msg) =>
                    updatedMessageIds.includes(msg.clientId)
                        ? { ...msg, disappearingStatus: "READ" }
                        : msg
                )
            );


        });

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
        const disappearingstatus = disappearing ? "DISAPPEARING" : "NOT_DISAPPEARING";
        const message = {
            clientId: uuidv4(),
            content: encrypted,
            signature,
            timeSent: new Date().toISOString(),
            senderEmail: email,
            groupId,
            disappearingStatus: disappearingstatus
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


        <View style={{ flex: 1 }}>
            <Stack.Screen
                options={{
                    headerRight: () => (
                        <TouchableOpacity onPress={() => setAddMemberVisible(true)}>
                            <MaterialCommunityIcons name="dots-vertical" size={26} color="#745858" />
                        </TouchableOpacity>
                    ),
                }}
            />
            {isLoading ? (
                <View style={styles.loader}>
                    <ActivityIndicator size="large" color="#128C7E" />
                </View>
            ) : (

                <View style={{ flex: Platform.OS === 'ios' ? 1 : 0.9 }}>
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
                                                {item.disappearingStatus === "READ"
                                                    ? <Text>Disappearing <MaterialCommunityIcons name="clock-fast" /></Text>

                                                    : item.disappearingStatus === "DISAPPEARING" &&
                                                        item.senderEmail !== email

                                                        ? revealedMessages[item.clientId]
                                                            ? item.content
                                                            : "Tap to reveal 👀"

                                                        : item.disappearingStatus === "DISAPPEARING" &&
                                                            item.senderEmail === email

                                                            ? <Text>Disappearing <MaterialCommunityIcons name="clock-fast" /></Text>

                                                            :
                                                            item.content
                                                }
                                            </Text>
                                            <Text style={{ fontSize: 10, color: 'gray', marginTop: 5 }}>
                                                {new Date(item.timeSent).toLocaleTimeString()}
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            );
                        }}
                    /></View>
            )}
            <Modal
                visible={addMemberVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setAddMemberVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalCard}>
                        <Text style={styles.modalTitle}>Add member</Text>

                        <TextInput
                            style={styles.modalInput}
                            placeholder="Enter user email"
                            placeholderTextColor="#999"
                            value={newMemberEmail}
                            onChangeText={setNewMemberEmail}
                            autoCapitalize="none"
                        />

                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={styles.cancelButton}
                                onPress={() => setAddMemberVisible(false)}
                            >
                                <Text style={styles.cancelText}>Cancel</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.addButton}
                                onPress={handleAddMember}
                            >
                                <Text style={styles.addText}>Add</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
            {Platform.OS === 'ios' ? (<KeyboardAvoidingView behavior={'padding'}
                keyboardVerticalOffset={90}>
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
                        style={[
                            styles.sendButton,
                            { backgroundColor: connected && content.trim() ? '#128C7E' : '#A0A0A0' }
                        ]}
                        onPress={sendMessage}
                        disabled={!connected || !content.trim()}
                    >
                        <MaterialCommunityIcons name="send" size={24} color="white" />
                    </TouchableOpacity>
                </View></KeyboardAvoidingView>) : (
                <View style={[
                    styles.inputContainerAndroid,
                    { bottom: keyboardHeight }
                ]}>
                    <View style={styles.textInputWrapper}>
                        <TextInput
                            style={styles.textInput}
                            value={content}
                            onChangeText={setContent}
                            placeholder="Group message"
                            placeholderTextColor="#888"
                            multiline
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
            )}
        </View>
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
        paddingBottom: Platform.OS === "android" ? 20 : 8,
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
    iconButton: {
        padding: 8,
    },
    textInput: {
        flex: 1,
        fontSize: 16,
        paddingVertical: 10,
        paddingTop: 10,
    },
    inputContainerAndroid: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: "row",
        alignItems: "flex-end",
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
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.35)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalCard: {
        width: '85%',
        backgroundColor: '#fff',
        borderRadius: 22,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 3, height: 3 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 10,
    },
    modalTitle: {
        fontFamily: 'Georgia',
        fontSize: 20,
        fontWeight: 'bold',
        color: '#5e411a',
        marginBottom: 14,
    },
    modalInput: {
        backgroundColor: '#f5f5f5',
        borderRadius: 14,
        paddingVertical: 14,
        paddingHorizontal: 14,
        borderWidth: 1,
        borderColor: '#ebe3e3',
        marginBottom: 18,
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
    },
    cancelButton: {
        paddingVertical: 10,
        paddingHorizontal: 14,
        marginRight: 8,
    },
    addButton: {
        backgroundColor: '#7a5650',
        borderRadius: 12,
        paddingVertical: 10,
        paddingHorizontal: 18,
    },
    cancelText: {
        color: '#5f5555',
    },
    addText: {
        color: '#fff',
        fontWeight: 'bold',
    },
});