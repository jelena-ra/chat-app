import Button from "@/components/Button";
import * as SecureStore from 'expo-secure-store';
import { useState } from "react";
import { Platform, Switch, Text, TextInput, View } from "react-native";
import nacl, { box, randomBytes } from "tweetnacl";
import { decodeBase64, decodeUTF8, encodeBase64, encodeUTF8 } from 'tweetnacl-util';

export default function Chat(){
/*const { email } = useLocalSearchParams();*/
const email = "jeca.zecau66@gmail.com";

const [content, setContent] = useState("");
  const [receiverEmail, setReceiverEmail] = useState("");
  const [disappearing, setDisappearing] = useState(false);


   async function  handleSubmit ()  {
  
    const BpublicKey="k3kn764th+BXuF5umX7oUp6X5wPB5/h2oe4VLP0QTj0=";
   

    const BsecretKey = Platform.OS !== 'web'
    ? await SecureStore.getItemAsync('privateKey')
    : "IoAZ5DbOeDPtzhFHpMN1OpS6gZ7HdScmxGZCEIrzYFA=";

    if (!BsecretKey) throw new Error("no private key");
    const AsecretKey="hF+8ysXkOE2WBuu0zSG5Lun5QEyfzKRnb1fZFIhqsFE=";
    const ApublicKey="j3ktc2BJzzXWBv9GFcNLMp2maSofPeUFL9hPDv8zZEY=";


    const Asecretsigning = "ieVh95IbXQsqEHyriYgTnl90kPkRT0wii65lGayDkoV7/T9kqfEezftmyZ6O9F5HHO4rjFGKroKCGMFEZTuziA==";
    const Apublicsigning = "e/0/ZKnxHs37ZsmejvReRxzuK4xRiq6CghjBRGU7s4g=";
    const sharedA = box.before(decodeBase64(BpublicKey), decodeBase64(AsecretKey));
    const sharedB = box.before(decodeBase64(ApublicKey), decodeBase64(BsecretKey));

    const finalcontent = encrypt(sharedA,content);
    const signature=sign(finalcontent,decodeBase64(Asecretsigning));

    const payload = {
      content:finalcontent,
      signature,
      timeSent:new Date().toISOString(), 
      senderEmail:email,
      receiverEmail,
      disappearing:false,
    };

    try {
    const response = await fetch("http://192.168.1.130:8080/messages/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

     
    const decrypted = decrypt(sharedB,finalcontent );
    const verify= verifysignature(finalcontent,signature,decodeBase64(Apublicsigning));

    console.log(content, finalcontent, decrypted);
    console.log('is verified:' , verify);

    console.log("RESPONSE:", data);
  } catch (error) {
    console.error("ERROR:", error);
  }
    console.log("SEND:", payload);
  };




   
    const newNonce = () => randomBytes(box.nonceLength);


    function  encrypt (shared: Uint8Array,json: any)  {

    const nonce = newNonce();
    const j = JSON.stringify(json)
    const messageUint8 = decodeUTF8(j);
    const encrypted = box.after(messageUint8, nonce, shared);

    const fullMessage = new Uint8Array(nonce.length + encrypted.length);
    fullMessage.set(nonce);
    fullMessage.set(encrypted, nonce.length);

    const base64FullMessage = encodeBase64(fullMessage);
    return base64FullMessage;
    };

function  decrypt ( secretOrSharedKey: Uint8Array, messageWithNonce: string) {

  const messageWithNonceAsUint8Array = decodeBase64(messageWithNonce);
  const nonce = messageWithNonceAsUint8Array.slice(0, box.nonceLength);

  const message = messageWithNonceAsUint8Array.slice(
    box.nonceLength,
    messageWithNonce.length
  );

  const decrypted =box.open.after(message, nonce, secretOrSharedKey);

  if (!decrypted) {
    throw new Error('Could not decrypt message');
  }

  const base64DecryptedMessage = encodeUTF8(decrypted);
  return JSON.parse(base64DecryptedMessage);
};

function sign (message: any, secretKey: Uint8Array){

    const messageAsUint8Array = decodeBase64(message);
    const signature = nacl.sign.detached(messageAsUint8Array, secretKey);
    return encodeBase64(signature);

}

function verifysignature(message: any, signature: any ,publicKey: any){
    const messageBytes = decodeBase64(message);
    const signature2 = decodeBase64(signature);
    return nacl.sign.detached.verify(messageBytes, signature2, publicKey);
}
 async function test(){
    const obj={"jel":"o"};
    const mess="poruka";
    const BpublicKey="k3kn764th+BXuF5umX7oUp6X5wPB5/h2oe4VLP0QTj0=";
   

    const BsecretKey = Platform.OS !== 'web'
    ? await SecureStore.getItemAsync('privateKey')
    : "IoAZ5DbOeDPtzhFHpMN1OpS6gZ7HdScmxGZCEIrzYFA=";

    if (!BsecretKey) throw new Error("no private key");


    /*if(Platform.OS !== 'web'){
        const b=  await SecureStore.getItemAsync('privateKey');
        if (!b) throw new Error("no private key");

        setB(b);
    }else{
        setB("IoAZ5DbOeDPtzhFHpMN1OpS6gZ7HdScmxGZCEIrzYFA=");
    }*/
    const AsecretKey="hF+8ysXkOE2WBuu0zSG5Lun5QEyfzKRnb1fZFIhqsFE=";
    const ApublicKey="j3ktc2BJzzXWBv9GFcNLMp2maSofPeUFL9hPDv8zZEY=";

    const Bpublicsignign="k1paKlodN9QtvGnrGzQ0smGXQfbWmOx2U+zWUOJzqyk=";

    const Asecretsigning = "ieVh95IbXQsqEHyriYgTnl90kPkRT0wii65lGayDkoV7/T9kqfEezftmyZ6O9F5HHO4rjFGKroKCGMFEZTuziA==";
    const Apublicsigning = "e/0/ZKnxHs37ZsmejvReRxzuK4xRiq6CghjBRGU7s4g=";
    const sharedA = box.before(decodeBase64(BpublicKey), decodeBase64(AsecretKey));
    const sharedB = box.before(decodeBase64(ApublicKey), decodeBase64(BsecretKey));
    
    const encrypted = encrypt(sharedA, obj);
    const decrypted = decrypt(sharedB, encrypted);

    const signature = sign(encrypted,decodeBase64(Asecretsigning));
    const verify= verifysignature(encrypted,signature,decodeBase64(Bpublicsignign));

    console.log(obj, encrypted, decrypted);
    console.log('is verified:' , verify);
}
/*"content": "string",
  "signature": "string",
  "timeSent": "2026-03-28T09:14:49.417Z",
  "senderEmail": "string",
  "receiverEmail": "string",
  "disappearing": true,
  "received": true,
  "deletedBySender": true,
  "read": true */
    return(
        <View>
            <Text>Content</Text>
      <TextInput value={content} onChangeText={setContent} />


      <Text>Receiver Email</Text>
      <TextInput value={receiverEmail} onChangeText={setReceiverEmail} />

      <Text>Disappearing</Text>
      <Switch value={disappearing} onValueChange={setDisappearing} />

            <Button label="press" onPress={handleSubmit}></Button>

        </View>
    );
};
