import IP_ADDRESS from '@/assets/config';
import { fetchWithAuth } from '@/assets/fetch';
import { useAuth } from '@/components/AuthContext';
import Button from '@/components/Button';
import Background from '@/components/GlobalBackground';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { box, randomBytes } from 'tweetnacl';
import { decodeBase64, encodeBase64 } from 'tweetnacl-util';

interface PublicKeyDTO {
  email: string;
  publicEncryptingkey: string;
}

export default function NewGroup() {
  const { email, token, privateEncryptingKey } = useAuth();

  const [groupName, setGroupName] = useState('');
  const [membersText, setMembersText] = useState('');
  const [creating, setCreating] = useState(false);

  function parseMembers() {
    const members = membersText
      .split(',')
      .map((m) => m.trim())
      .filter((m) => m.length > 0);

    const unique = Array.from(new Set(members));

    if (email && !unique.includes(email)) {
      unique.push(email);
    }

    return unique;
  }

  function generateGroupKeyBase64() {
    return encodeBase64(randomBytes(32));
  }

  function encryptGroupKeyForUser(
    groupKeyBase64: string,
    receiverPublicKeyBase64: string,
    myPrivateKeyBase64: string
  ) {
    const sharedKey = box.before(
      decodeBase64(receiverPublicKeyBase64),
      decodeBase64(myPrivateKeyBase64)
    );

    const nonce = randomBytes(box.nonceLength);
    const groupKeyBytes = decodeBase64(groupKeyBase64);

    const encrypted = box.after(groupKeyBytes, nonce, sharedKey);

    const full = new Uint8Array(nonce.length + encrypted.length);
    full.set(nonce);
    full.set(encrypted, nonce.length);

    return encodeBase64(full);
  }

  async function handleCreateGroup() {
    if (!email || !token || !privateEncryptingKey) {
      Alert.alert('Error', 'You are not fully logged in.');
      return;
    }

    if (!groupName.trim()) {
      Alert.alert('Error', 'Enter group name.');
      return;
    }

    const memberEmails = parseMembers();

    if (memberEmails.length < 2) {
      Alert.alert('Error', 'Group needs at least 2 members.');
      return;
    }

    try {
      setCreating(true);

      const createResponse = await fetchWithAuth(
        `http://${IP_ADDRESS}:8080/groups/create`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: groupName.trim(),
            adminEmail: email,
            memberEmails,
          }),
        },
        token
      );

      if (!createResponse.ok) {
        throw new Error(`Create group failed: ${createResponse.status}`);
      }

      const createdGroup = await createResponse.json();
      const groupId = createdGroup.id;

      const groupKeyBase64 = generateGroupKeyBase64();

      const keysResponse = await fetchWithAuth(
        `http://${IP_ADDRESS}:8080/users/getAllPublicKeys`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(memberEmails),
        },
        token
      );

      if (!keysResponse.ok) {
        throw new Error(`Public keys failed: ${keysResponse.status}`);
      }

      const publicKeys = (await keysResponse.json()) as PublicKeyDTO[];

      const encryptedKeys = publicKeys.map((item) => ({
        groupId,
        userEmail: item.email,
        encryptedGroupKey: encryptGroupKeyForUser(
          groupKeyBase64,
          item.publicEncryptingkey,
          privateEncryptingKey
        ),
      }));

      const saveKeysResponse = await fetchWithAuth(
        `http://${IP_ADDRESS}:8080/group-keys/save-all`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(encryptedKeys),
        },
        token
      );

      if (!saveKeysResponse.ok) {
        throw new Error(`Save group keys failed: ${saveKeysResponse.status}`);
      }

      await SecureStore.setItemAsync(`groupKey_${groupId}`, groupKeyBase64);

      router.push({
        pathname: '/groupchat',
        params: {
          groupId,
          groupName: groupName.trim(),
        },
      });
    } catch (error) {
      console.log('Create group error:', error);
      Alert.alert('Error', 'Group could not be created.');
    } finally {
      setCreating(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.keyboard}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.page}>
        <Background />

        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.topSection}>
            <View style={styles.groupIcon}>
              <MaterialCommunityIcons name="account-group" size={58} color="#7a5650" />
            </View>

            <Text style={styles.title}>New group</Text>
            <Text style={styles.subtitle}>
              Create a secure encrypted group chat
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.label}>Group name</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter group name"
              placeholderTextColor="#999"
              value={groupName}
              onChangeText={setGroupName}
            />

            <Text style={styles.label}>Members</Text>
            <TextInput
              style={[styles.input, styles.membersInput]}
              placeholder="friend1@gmail.com, friend2@gmail.com"
              placeholderTextColor="#999"
              value={membersText}
              onChangeText={setMembersText}
              multiline
            />

            <View style={styles.infoBox}>
              <Ionicons name="lock-closed" size={18} color="#7a5650" />
              <Text style={styles.infoText}>
                The group key will be encrypted separately for every member.
              </Text>
            </View>

            <View style={styles.buttonWrap}>
              <Button
                label={creating ? 'Creating...' : 'Create group'}
                onPress={handleCreateGroup}
              />
            </View>
          </View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboard: {
    flex: 1,
    backgroundColor: '#EFEAE2',
  },
  page: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 35,
    paddingBottom: 40,
    alignItems: 'center',
  },
  topSection: {
    alignItems: 'center',
    marginBottom: 24,
    width: '100%',
  },
  groupIcon: {
    width: 145,
    height: 145,
    borderRadius: 999,
    backgroundColor: '#f6e4d0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
  },
  title: {
    fontFamily: 'Georgia',
    fontSize: 24,
    fontWeight: 'bold',
    color: '#5e411a',
    marginTop: 14,
    marginBottom: 4,
  },
  subtitle: {
    fontFamily: 'Georgia',
    color: '#5f5555',
    fontSize: 13,
    textAlign: 'center',
    width: '85%',
  },
  card: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 28,
    padding: 22,
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 12,
  },
  label: {
    fontFamily: 'Georgia',
    color: '#453e3e',
    marginBottom: 6,
    marginLeft: 4,
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 16,
    fontSize: 15,
    marginBottom: 16,
    color: '#2d2d2d',
    borderWidth: 1,
    borderColor: '#ebe3e3',
  },
  membersInput: {
    minHeight: 95,
    textAlignVertical: 'top',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#f8efe6',
    borderRadius: 14,
    padding: 12,
    marginBottom: 18,
  },
  infoText: {
    flex: 1,
    marginLeft: 8,
    fontFamily: 'Georgia',
    color: '#5f5555',
    fontSize: 12,
  },
  buttonWrap: {
    marginTop: 4,
  },
});