import * as base64 from 'base64-js';
import { useEffect, useState } from "react";
import nacl from 'tweetnacl';

export default function KeyPairs(){

    const[privateSigningKey, setprivateSigningKey] = useState("");
    const[publicSigningKey, setpublicSigningKey] = useState("");
    const[privateCryptoKey, setprivateCryptoKey] = useState("");
    const[publicCryptoKey, setpublicCryptoKey] = useState("");

    useEffect(()=>{

        const keyPairSigning =  nacl.sign.keyPair();
        setpublicSigningKey(base64.fromByteArray(keyPairSigning.publicKey));
        setprivateSigningKey(base64.fromByteArray(keyPairSigning.secretKey));
        

        const keyPairCrypto = nacl.box.keyPair();
        setpublicCryptoKey(base64.fromByteArray(keyPairCrypto.publicKey));
        setprivateCryptoKey(base64.fromByteArray(keyPairCrypto.secretKey));
            

    },[]);

    return {privateSigningKey,publicSigningKey,privateCryptoKey,publicCryptoKey}

}