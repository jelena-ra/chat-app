import * as SecureStore from 'expo-secure-store';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { Platform } from "react-native";

interface AuthContextType {
  email: string | null;
  isAuthLoading: boolean,
  token: string | null;
  privateSigningKey: string | null;
  privateEncryptingKey: string | null;
  setEmail: (email: string | null) => void;
  setToken: (token: string | null) => void;
  setPrivateSigningKey: (key: string | null) => void;
  setPrivateEncryptingKey: (key: string | null) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [email, setEmail] = useState<string | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [privateSigningKey, setPrivateSigningKey] = useState<string | null>(null);
  const [privateEncryptingKey, setPrivateEncryptingKey] = useState<string | null>(null);

  useEffect(() => {
  
    const loadData = async () => {
     
      let storedEmail; 
      let storedToken; 

      let safeEmail;
        let privS; 
        let privC;
    if (Platform.OS === "web") {
          storedEmail = localStorage.getItem('email');
          storedToken = localStorage.getItem('accessToken');

       safeEmail = storedEmail?.replace(/[^a-zA-Z0-9._-]/g, "_");
         privS = localStorage.getItem(`privateSigningKey_${safeEmail}`);
         privC = localStorage.getItem(`privateCryptoKey_${safeEmail}`);
    }else{
      storedEmail = await SecureStore.getItemAsync('email');
       storedToken = await SecureStore.getItemAsync('accessToken');

       safeEmail = storedEmail?.replace(/[^a-zA-Z0-9._-]/g, "_");
         privS = await SecureStore.getItemAsync(`privateSigningKey_${safeEmail}`);
         privC = await SecureStore.getItemAsync(`privateCryptoKey_${safeEmail}`);
    }

        if (privS) setPrivateSigningKey(privS);
        if (privC) setPrivateEncryptingKey(privC);
      
      if (storedEmail != null) setEmail(storedEmail);
      if (storedToken) setToken(storedToken);
      setIsAuthLoading(false);
    };
    loadData();
  }, []);

  return (
    <AuthContext.Provider value={{ email,isAuthLoading, token, privateSigningKey, privateEncryptingKey, 
      setEmail, setToken, setPrivateSigningKey, setPrivateEncryptingKey }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider-a");
  }
  return context;
};