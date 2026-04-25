import IP_ADDRESS from '@/assets/config';
import { fetchWithAuth } from '@/assets/fetch';
import { useAuth } from '@/components/AuthContext';
import Button from '@/components/Button';
import Background from '@/components/GlobalBackground';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

const defaultProfileImg = require('@/assets/images/profile.png');

export default function Profile() {
    const { email, token } = useAuth();
    const [date, setDate] = useState<Date | null>(null);
    const [name, setName] = useState('');
    const [surname, setSurname] = useState('');
    const [birthdate, setBirthdate] = useState('');
    const [imageUri, setImageUri] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!email || !token) return;
        getProfile();
        setImageUri(`http://${IP_ADDRESS}:8080/users/profile/image?email=${email}`);

    }, [email, token]);

    const pickImage = async () => {
        const permissionResult =
            await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (!permissionResult.granted) {
            Alert.alert('Permission needed', 'Allow gallery access to choose a profile photo.');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });

        if (result.canceled) return;

        const asset = result.assets[0];
        setImageUri(asset.uri);
    };

    const handleSaveProfileInfo = async () => {
        if (!email || !token) return;

        try {
            setSaving(true);
            console.log("Evo kako birthdate izgleda: " + birthdate);

            const response = await fetchWithAuth(
                `http://${IP_ADDRESS}:8080/users/profile/edit`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        email,
                        name,
                        surname,
                        birthdate,
                    }),
                },
                token
            );

            if (!response.ok) {
                throw new Error('Failed to edit profile');
            }

            Alert.alert('Success', 'Profile info saved.');
        } catch (error) {
            console.log(error);
            Alert.alert('Error', 'Profile info could not be saved.');
        } finally {
            setSaving(false);
        }
    };


    async function getProfile() {
        try {
            const response = await fetchWithAuth(
                `http://${IP_ADDRESS}:8080/users/profile?email=${email}`,
                {
                    method: 'GET',
                },
                token
            );

            if (!response.ok) {
                throw new Error('Failed to load profile');
            }

            const data = await response.json();
            setName(data.name ?? '');
            setSurname(data.surname ?? '');
            setDate(data.birthdate ?? '');
            console.log("Evo ga birthdate: " + data.birthdate);
            if (data.birthdate) {
                setDate(new Date(data.birthdate));
            }
        } catch (error) {
            console.log(error);
        }
    }

    const handleUploadImage = async () => {
        if (!email || !token || !imageUri || imageUri.startsWith('http')) return;

        try {
            const fileName = imageUri.split('/').pop() || 'profile.jpg';
            const ext = fileName.split('.').pop()?.toLowerCase();

            let mimeType = 'image/jpeg';
            if (ext === 'png') mimeType = 'image/png';
            if (ext === 'jpg' || ext === 'jpeg') mimeType = 'image/jpeg';

            const formData = new FormData();
            formData.append('email', email);
            formData.append(
                'file',
                {
                    uri: imageUri,
                    name: fileName,
                    type: mimeType,
                } as any
            );

            const response = await fetchWithAuth(`http://${IP_ADDRESS}:8080/users/profile/image`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: formData,
                token
            });

            if (!response.ok) {
                throw new Error('Failed to upload image');
            }

            setImageUri(`http://${IP_ADDRESS}:8080/users/profile/image?email=${email}&t=${Date.now()}`);
        } catch (error) {
            console.log(error);
            Alert.alert('Error', 'Profile photo could not be uploaded.');
        }
    };

    const handleSaveAll = async () => {
        await handleSaveProfileInfo();
        await handleUploadImage();
    };

    return (
        <KeyboardAvoidingView
            style={styles.keyboard}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <View style={styles.page}>
                <Background />

                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <View style={styles.topSection}>
                        <View style={styles.imageWrapper}>
                            <Image
                                source={imageUri ? { uri: imageUri } : defaultProfileImg}
                                style={styles.profileImage}
                                contentFit="cover"
                                onError={() => setImageUri(null)}
                            />

                            <TouchableOpacity style={styles.cameraButton} onPress={pickImage}>
                                <Ionicons name="camera" size={20} color="#fff" />
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.profileTitle}>Your profile</Text>
                        <Text style={styles.profileSubtitle}>
                            Add your photo and update your personal info
                        </Text>
                    </View>

                    <View style={styles.card}>
                        <Text style={styles.label}>Name</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter your name"
                            placeholderTextColor="#999"
                            value={name}
                            onChangeText={setName}
                        />

                        <Text style={styles.label}>Surname</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter your surname"
                            placeholderTextColor="#999"
                            value={surname}
                            onChangeText={setSurname}
                        />

                        <Text style={styles.label}>Birthdate</Text>

                        <DateTimePicker
                            value={date ?? new Date()}
                            mode="date"
                            display="default"
                            onChange={(event, selectedDate) => {
                                if (selectedDate) {
                                    setDate(selectedDate);

                                    const formatted =
                                        selectedDate.getFullYear() +
                                        '-' +
                                        String(selectedDate.getMonth() + 1).padStart(2, '0') +
                                        '-' +
                                        String(selectedDate.getDate()).padStart(2, '0');

                                    setBirthdate(formatted);
                                }
                            }}
                        />
                        <View style={styles.buttonWrap}>
                            <Button
                                label={saving ? 'Saving...' : 'Save changes'}
                                onPress={handleSaveAll}
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
    imageWrapper: {
        position: 'relative',
        marginBottom: 14,
    },
    profileImage: {
        width: 145,
        height: 145,
        borderRadius: 999,
        borderWidth: 4,
        borderColor: '#f6e4d0',
        backgroundColor: '#f5f5f5',
        shadowColor: '#000',
        shadowOpacity: 0.20,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 5 },
    },
    cameraButton: {
        position: 'absolute',
        right: 6,
        bottom: 6,
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: '#7a5650',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#fff',
    },
    profileTitle: {
        fontFamily: 'Georgia',
        fontSize: 24,
        fontWeight: 'bold',
        color: '#5e411a',
        marginBottom: 4,
    },
    profileSubtitle: {
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
    buttonWrap: {
        marginTop: 12,
    },
});