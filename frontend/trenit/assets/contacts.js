import * as Contacts from "expo-contacts";

export async function loadPhoneContacts() {
  const { status } = await Contacts.requestPermissionsAsync();

  if (status !== "granted") {
    alert("You have to allow contacts access.");
    return [];
  }

  const { data } = await Contacts.getContactsAsync({
    fields: [Contacts.Fields.Emails, Contacts.Fields.PhoneNumbers],
  });

  return data
    .map((c) => ({
      name: c.name,
      emails: c.emails?.map((e) => e.email).filter(Boolean) ?? [],
      phones: c.phoneNumbers?.map((p) => p.number).filter(Boolean) ?? [],
    }))
    .filter((c) => c.emails.length > 0 || c.phones.length > 0);
}