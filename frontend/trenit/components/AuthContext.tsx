import * as SecureStore from 'expo-secure-store';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';

interface AuthContextType {
  email: string | null;
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
  const [token, setToken] = useState<string | null>(null);
  const [privateSigningKey, setPrivateSigningKey] = useState<string | null>(null);
  const [privateEncryptingKey, setPrivateEncryptingKey] = useState<string | null>(null);

  useEffect(() => {
  
    const loadData = async () => {
      const storedEmail = await SecureStore.getItemAsync('email');
      const storedToken = await SecureStore.getItemAsync('accessToken');

      const safeEmail = storedEmail?.replace(/[^a-zA-Z0-9._-]/g, "_");
        const privS = await SecureStore.getItemAsync(`privateSigningKey_${safeEmail}`);
        const privC = await SecureStore.getItemAsync(`privateCryptoKey_${safeEmail}`);

        if (privS) setPrivateSigningKey(privS);
        if (privC) setPrivateEncryptingKey(privC);
      
      if (storedEmail != null) setEmail(storedEmail);
      if (storedToken) setToken(storedToken);
    };
    loadData();
  }, []);

  return (
    <AuthContext.Provider value={{ email, token, privateSigningKey, privateEncryptingKey, 
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