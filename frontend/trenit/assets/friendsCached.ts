export const friendsCache: Record<string, boolean> = {};

export function getFriendsEmails() {
    return Object.keys(friendsCache).filter((email) => friendsCache[email] === true);
}

export function isFriend(email: string) {
    return friendsCache[email.trim().toLowerCase()] === true;
}