import nacl, { box, randomBytes } from "tweetnacl";
import { decodeBase64, decodeUTF8, encodeBase64, encodeUTF8 } from "tweetnacl-util";

export function encryptGroupKeyForUser(
  groupKeyBase64: string,
  receiverPublicEncryptingKeyBase64: string,
  senderPrivateEncryptingKeyBase64: string
) {
  const sharedKey = box.before(
    decodeBase64(receiverPublicEncryptingKeyBase64),
    decodeBase64(senderPrivateEncryptingKeyBase64)
  );

  const nonce = randomBytes(box.nonceLength);
  const message = decodeBase64(groupKeyBase64);

  const encrypted = box.after(message, nonce, sharedKey);

  const full = new Uint8Array(nonce.length + encrypted.length);
  full.set(nonce);
  full.set(encrypted, nonce.length);

  return encodeBase64(full);
}

export function decryptMyGroupKey(
  encryptedGroupKeyBase64: string,
  senderPublicEncryptingKeyBase64: string,
  myPrivateEncryptingKeyBase64: string
) {
  const sharedKey = box.before(
    decodeBase64(senderPublicEncryptingKeyBase64),
    decodeBase64(myPrivateEncryptingKeyBase64)
  );

  const full = decodeBase64(encryptedGroupKeyBase64);
  const nonce = full.slice(0, box.nonceLength);
  const encrypted = full.slice(box.nonceLength);

  const decrypted = box.open.after(encrypted, nonce, sharedKey);
  if (!decrypted) return null;

  return encodeBase64(decrypted);
}

export function encryptGroupMessage(groupKeyBase64: string, text: string) {
  const nonce = randomBytes(nacl.secretbox.nonceLength);
  const messageBytes = decodeUTF8(JSON.stringify(text));
  const key = decodeBase64(groupKeyBase64);

  const encrypted = nacl.secretbox(messageBytes, nonce, key);

  const full = new Uint8Array(nonce.length + encrypted.length);
  full.set(nonce);
  full.set(encrypted, nonce.length);

  return encodeBase64(full);
}

export function decryptGroupMessage(groupKeyBase64: string, cipherTextBase64: string) {
  const full = decodeBase64(cipherTextBase64);
  const nonce = full.slice(0, nacl.secretbox.nonceLength);
  const encrypted = full.slice(nacl.secretbox.nonceLength);

  const key = decodeBase64(groupKeyBase64);
  const decrypted = nacl.secretbox.open(encrypted, nonce, key);

  if (!decrypted) return null;

  return JSON.parse(encodeUTF8(decrypted));
}

export function signEncryptedContent(
  encryptedContentBase64: string,
  privateSigningKeyBase64: string
) {
  const messageBytes = decodeBase64(encryptedContentBase64);
  const secretKey = decodeBase64(privateSigningKeyBase64);

  const signature = nacl.sign.detached(messageBytes, secretKey);
  return encodeBase64(signature);
}
