import IP_ADDRESS from '@/assets/config';
import { loadPhoneContacts } from '@/assets/contacts';
import { fetchWithAuth } from './fetch';
export const friendsCache: Record<string, boolean> = {};

export function getFriendsEmails() {
    return Object.keys(friendsCache).filter((email) => friendsCache[email] === true);
}

export function isFriend(email: string) {
    return friendsCache[email.trim().toLowerCase()] === true;
}
export async function loadFriendsCache(token: string) {
  const contacts = await loadPhoneContacts();

  await Promise.all(
    contacts.flatMap((contact) =>
      contact.emails.map(async (email) => {
        if(email){
        if (friendsCache[email] !== undefined) return;

        try {
          const response = await fetchWithAuth(
            `http://${IP_ADDRESS}:8080/users/check-contact?email=${email}`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
            },
            token
          );

          if (!response.ok) {
            friendsCache[email] = false;
            return;
          }

          const data = await response.json();
          friendsCache[email] = data === true;
        } catch (error) {
          console.log("Load friends cache error:", error);
          friendsCache[email] = false;
        }}
      })
    )
  );

  return getFriendsEmails();
}