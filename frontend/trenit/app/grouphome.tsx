import IP_ADDRESS from '@/assets/config';
import { fetchWithAuth } from '@/assets/fetch';
import { useAuth } from '@/components/AuthContext';
import { useChatSocket } from '@/components/ChatSocketContext';
import Background from '@/components/GlobalBackground';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { StompSubscription } from '@stomp/stompjs';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';



interface GroupChatItem {
  groupId: number;
  groupName: string;
  lastMessageContent: string | null;
  lastMessageTime: string | null;
  lastSenderEmail: string | null;
}


export default function GroupHome() {
  const router = useRouter();
  const { email, token } = useAuth();
  const { stompClient, connected } = useChatSocket();
const groupSubscriptionsRef = useRef<StompSubscription[]>([]);
  const [groups, setGroups] = useState<GroupChatItem[]>([]);

  useEffect(() => {
 if (!connected || !stompClient.current || groups.length === 0) return;
    

 

  groupSubscriptionsRef.current.forEach((sub) => sub.unsubscribe());
  groupSubscriptionsRef.current = [];
  console.log("GROUP HOME SUB EFFECT", {
  connected,
  hasClient: !!stompClient.current,
  groupsLength: groups.length,
  ids: groups.map(g => g.groupId),
});

  groups.forEach((group) => {
    const destination = `/topic/group/${group.groupId}`;
    console.log("GROUP HOME SUBSCRIBING TO:", destination);

    const sub = stompClient.current!.subscribe(destination, async (message) => {
      console.log("GROUP HOME RECEIVED:", message.body);

      await getGroups();
    });

    groupSubscriptionsRef.current.push(sub);
  });

  return () => {
    groupSubscriptionsRef.current.forEach((sub) => sub.unsubscribe());
    groupSubscriptionsRef.current = [];
  };
}, [connected, groups.map((g) => g.groupId).join(",")]);


  async function getGroups() {
    if (!email || !token) return;

    try {
      const response = await fetchWithAuth(
        `http://${IP_ADDRESS}:8080/messages/groupChats?email=${email}`,
        {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            },
            token
      );

      if (!response.ok) {
        throw new Error('HTTP error: ' + response.status);
      }

      const data = await response.json();
      setGroups(data);
    } catch (error) {
      console.log('Error loading groups:', error);
    }
  }

  useEffect(() => {
    getGroups();
  }, [email, token]);

  function handleGroupPress(group: GroupChatItem) {
    router.push({
      pathname: '/groupchat',
      params: {
        groupId: group.groupId,
        groupName: group.groupName,
      },
    });
  }

  return (
    <View style={styles.page}>
      <Background />

      <View style={styles.search}>
        <TouchableOpacity style={styles.searchTouch}>
          <Ionicons name="search" size={30} color="#000" />
          <Text>Search groups</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        style={styles.chats}
        data={groups}
        keyExtractor={(item) => item.groupId.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.chatCard}
            onPress={() => handleGroupPress(item)}
          >
            <View style={styles.groupIcon}>
              <MaterialCommunityIcons name="account-group" size={34} color="#5a3e36" />
            </View>

            <View style={styles.nameAndMssg}>
              <Text style={styles.groupName}>{item.groupName}</Text>

              <Text numberOfLines={1} ellipsizeMode="tail" style={styles.message}>
                {item.lastSenderEmail
                  ? `${item.lastSenderEmail}: ${item.lastMessageContent ?? ''}`
                  : 'No messages yet'}
              </Text>
            </View>

            <View style={styles.timeBox}>
              <Text style={styles.timeText}>
                {item.lastMessageTime
                  ? item.lastMessageTime.slice(5, 16).replace('T', ' ')
                  : ''}
              </Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'flex-start',
    height: '100%',
  },
  search: {
    height: 30,
    justifyContent: 'center',
    width: '100%',
  },
  searchTouch: {
    justifyContent: 'center',
    flexDirection: 'row',
    alignSelf: 'center',
    borderColor: '#625252',
    width: '90%',
    borderWidth: 2,
    borderRadius: 10,
  },
  chats: {
    flexDirection: 'column',
    height: '90%',
  },
  chatCard: {
    flexDirection: 'row',
    backgroundColor: '#f5f1f1',
    margin: 4,
    borderRadius: 10,
    shadowColor: 'black',
    shadowRadius: 10,
    shadowOffset: { width: 4, height: 2 },
    shadowOpacity: 0.5,
    opacity: 0.8,
    paddingVertical: 8,
  },
  groupIcon: {
    height: 55,
    width: 55,
    borderRadius: 30,
    backgroundColor: '#dfc490',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  nameAndMssg: {
    width: '65%',
    marginLeft: 12,
    justifyContent: 'center',
  },
  groupName: {
    fontWeight: 'bold',
    color: '#453e3e',
  },
  message: {
    color: '#453e3e',
    marginTop: 4,
  },
  timeBox: {
    marginLeft: 'auto',
    justifyContent: 'center',
    paddingRight: 10,
  },
  timeText: {
    fontSize: 12,
    color: 'gray',
  },
});