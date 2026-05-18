import IP_ADDRESS from "@/assets/config";
import { fetchWithAuth } from "@/assets/fetch";
import { friendsCache } from "@/assets/friendsCached";
import { useAuth } from "@/components/AuthContext";
import Background from "@/components/GlobalBackground";
import { Ionicons } from "@expo/vector-icons";
import * as Contacts from "expo-contacts";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
    FlatList,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

const profileImg = require("@/assets/images/profile.png");

interface ContactItem {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    registered: boolean;
    checked: boolean;
    manualEmail: string;
}

export default function ContactsScreen() {
    const router = useRouter();
    const { email, token } = useAuth();

    const [contacts, setContacts] = useState<ContactItem[]>([]);
    const [searchText, setSearchText] = useState("");

    useEffect(() => {

         async function loadPhoneContacts() {
            console.log("proba");
        const { status } = await Contacts.requestPermissionsAsync();

        if (status !== "granted") {
            alert("You have to allow access to contacts.");
            return;
        }

        const { data } = await Contacts.getContactsAsync({
            fields: [Contacts.Fields.Emails, Contacts.Fields.PhoneNumbers],
        });

        const transformedContacts: ContactItem[] = data
            .map((c, index) => ({
                id: c.id ?? index.toString(),
                name: c.name ?? "No name",
                email: c.emails?.[0]?.email ?? null,
                phone: c.phoneNumbers?.[0]?.number ?? null,
                registered: false,
                checked: false,
                manualEmail: "",
            }))
            .filter((c) => c.email || c.phone);

        setContacts(transformedContacts);

         async function checkRegisteredContacts(contactsToCheck: ContactItem[]) {
        if (!token) return;
        const updatedContacts = await Promise.all(
            contactsToCheck.map(async (contact) => {
                if (!contact.email) {
                    return {
                        ...contact,
                        checked: true,
                        registered: false,
                    };
                }


            if (friendsCache[contact.email] !== undefined) {
                return {
                    ...contact,
                    email: contact.email,
                    checked: true,
                    registered: friendsCache[contact.email],
                };
            }

                try {
                    const response = await fetchWithAuth(
                        `http://${IP_ADDRESS}:8080/users/check-contact?email=${contact.email}`,
                        {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                            },
                          
                        },
                        token
                    );

                    if (!response.ok) {

                        friendsCache[contact.email] = false;
                        return {
                            ...contact,
                            checked: true,
                            registered: false,
                        };
                    }
                    const data = await response.json();
                   friendsCache[contact.email] = data === true;

                    return {
                        ...contact,
                        checked: true,
                        registered: friendsCache[contact.email],
                        email: contact.email,
                    };
                } catch (error) {
                    console.log("Check contact error:", error);
                    
                    friendsCache[contact.email]= false;
                    return {
                        ...contact,
                        checked: true,
                        registered: false,
                    };
                }
            })
        );

        setContacts(updatedContacts);
    }


        checkRegisteredContacts(transformedContacts);
    }


        loadPhoneContacts();
    }, [token]);

   
   
    function handleContactPress(contact: ContactItem) {
        if (!contact.email) return;

        if (contact.registered) {
            router.push({
                pathname: "/chat",
                params: {
                    receivermail: contact.email,
                },
            });
        }
    }

    async function sendInvite(toEmail: string) {
        if (!token || !email) {
            return;
        }

        if (!toEmail.trim()) {
            alert("Provide an email.");
            return;
        }

        try {
console.log("From email: "+ email+", to email: "+ toEmail.trim());
            const response = await fetchWithAuth(
                `http://${IP_ADDRESS}:8080/users/invite`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        fromEmail: email,
                        toEMail: toEmail.trim(),
                    }),
                },
                token
            );

            if (!response.ok) {
                throw new Error("Invite failed");
            }

            alert("Invitation sent");
        } catch (error) {
            console.log("Invite error:", error);
            alert("Error on sending invitation.");
        }
    }

    function changeManualEmail(contactId: string, value: string) {
        setContacts((prev) =>
            prev.map((contact) =>
                contact.id === contactId
                    ? { ...contact, manualEmail: value }
                    : contact
            )
        );
    }

    function renderAction(item: ContactItem) {
        if (!item.checked) {
            return <Text style={styles.loadingText}>Checking...</Text>;
        }

        if (item.email && item.registered) {
            return (
                <TouchableOpacity
                    style={styles.chatButton}
                    onPress={() => handleContactPress(item)}
                >
                    <Ionicons name="chatbubble-ellipses-outline" size={20} color="white" />
                    <Text style={styles.buttonText}>Message</Text>
                </TouchableOpacity>
            );
        }

        if (item.email && !item.registered) {
            return (
                <TouchableOpacity
                    style={styles.inviteButton}
                    onPress={() => sendInvite(item.email!)}
                >
                    <Ionicons name="mail-outline" size={20} color="white" />
                    <Text style={styles.buttonText}>Send invite</Text>
                </TouchableOpacity>
            );
        }

        return (
            <View style={styles.manualInviteBox}>
                <Text style={styles.noEmailText}>No email.Send an invite:</Text>

                <View style={styles.manualEmailRow}>
                    <TextInput
                        style={styles.emailInput}
                        placeholder="Enter email"
                        value={item.manualEmail}
                        onChangeText={(value) => changeManualEmail(item.id, value)}
                        autoCapitalize="none"
                        keyboardType="email-address"
                    />

                    <TouchableOpacity
                        style={styles.smallInviteButton}
                        onPress={() => sendInvite(item.manualEmail)}
                    >
                        <Ionicons name="send-outline" size={18} color="white" />
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    const filteredContacts = contacts.filter((contact) => {
    const query = searchText.toLowerCase();

    return (
        contact.name.toLowerCase().includes(query) ||
        contact.email?.toLowerCase().includes(query) ||
        contact.phone?.toLowerCase().includes(query)
    );
});

    return (
        <View style={styles.page}>
            <Background />

          
               <View style={styles.search}>
    <View style={styles.searchTouch}>
        <Ionicons name="search" size={28} color="#000" />
        <TextInput
            style={styles.searchInput}
            placeholder="Search contacts"
            value={searchText}
            onChangeText={setSearchText}
            autoCapitalize="none"
        />

        {searchText.length > 0 && (
            <TouchableOpacity onPress={() => setSearchText("")}>
                <Ionicons name="close-circle" size={22} color="#625252" />
            </TouchableOpacity>
        )}
    </View>

            </View>

            <FlatList
                style={styles.contactsList}
                data={filteredContacts}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <View style={styles.contactCard}>
                        <Image style={styles.profimage} source={profileImg} />

                        <View style={styles.nameAndInfo}>
                            <Text style={styles.name}>{item.name}</Text>

                            <Text numberOfLines={1} style={styles.info}>
                                {item.email ?? item.phone}
                            </Text>

                            {renderAction(item)}
                        </View>
                    </View>
                )}
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <Text>No contacts to show.</Text>
                    </View>
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    page: {
        flex: 1,
        flexDirection: "column",
    },
searchInput: {
    flex: 1,
    fontSize: 15,
    color: "#000",
    paddingVertical: 2,
},
    search: {
        height: 45,
        justifyContent: "center",
        width: "100%",
        marginTop: 5,
    },

    searchTouch: {
        justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    alignSelf: "center",
    borderColor: "#625252",
    width: "90%",
    borderWidth: 2,
    borderRadius: 10,
    paddingVertical: 4,
    paddingHorizontal: 8,
    gap: 6,
    backgroundColor: "#f5f1f1",
    opacity: 0.8,
    },

    contactsList: {
        flex: 1,
        marginTop: 5,
    },

    contactCard: {
        flexDirection: "row",
        alignItems: "flex-start",
        backgroundColor: "#f5f1f1",
        marginHorizontal: 8,
        marginVertical: 4,
        borderRadius: 10,
        shadowColor: "black",
        shadowRadius: 10,
        shadowOffset: { width: 4, height: 2 },
        shadowOpacity: 0.5,
        opacity: 0.9,
        padding: 8,
    },

    profimage: {
        borderRadius: 25,
        height: 50,
        width: 50,
        marginTop: 4,
    },

    nameAndInfo: {
        marginLeft: 12,
        flex: 1,
    },

    name: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#000",
    },

    info: {
        fontSize: 13,
        color: "#625252",
        marginTop: 3,
    },

    loadingText: {
        marginTop: 8,
        fontSize: 13,
        color: "#777",
    },

    chatButton: {
        marginTop: 8,
        backgroundColor: "#5a3e36",
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 10,
        alignSelf: "flex-start",
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },

    inviteButton: {
        marginTop: 8,
        backgroundColor: "#745148",
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 10,
        alignSelf: "flex-start",
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },

    buttonText: {
        color: "white",
        fontWeight: "bold",
        fontSize: 13,
    },

    manualInviteBox: {
        marginTop: 8,
    },

    noEmailText: {
        fontSize: 13,
        color: "#5a3e36",
        marginBottom: 6,
    },

    manualEmailRow: {
        flexDirection: "row",
        alignItems: "center",
    },

    emailInput: {
        flex: 1,
        borderWidth: 1,
        borderColor: "#625252",
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 6,
        backgroundColor: "white",
        fontSize: 13,
    },

    smallInviteButton: {
        marginLeft: 8,
        backgroundColor: "#5a3e36",
        padding: 9,
        borderRadius: 8,
    },

    empty: {
        alignItems: "center",
        marginTop: 30,
    },
});