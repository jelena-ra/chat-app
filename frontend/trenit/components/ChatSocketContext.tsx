import IP_ADDRESS from '@/assets/config';
import { useAuth } from '@/components/AuthContext';
import { Client } from '@stomp/stompjs';
import * as SecureStore from 'expo-secure-store';
import React, { createContext, ReactNode, useContext, useEffect, useRef, useState } from 'react';

interface ChatSocketContextType {
  stompClient: React.MutableRefObject<Client | null>;
  connected: boolean;
}

const ChatSocketContext = createContext<ChatSocketContextType | null>(null);

export const ChatSocketProvider = ({ children }: { children: ReactNode }) => {
  const { email, token, setToken } = useAuth();
  const stompClient = useRef<Client | null>(null);
  const [connected, setConnected] = useState(false);

  async function refreshAccessToken() {
    console.log("SOCKET REFRESH START");
    const refreshToken = await SecureStore.getItemAsync('refreshToken');
    if (!refreshToken) throw new Error('No refresh token found');

    console.log("refreshToken before request:", refreshToken);

    const response = await fetch(`http://${IP_ADDRESS}:8080/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken })
    });

    const raw = await response.text();
  console.log("SOCKET REFRESH RAW:", raw);
    const data = raw ? JSON.parse(raw) : {};
    const newAccessToken = data.accessToken;
    const newRefreshToken = data.refreshToken;

    await SecureStore.setItemAsync('accessToken', newAccessToken);
    await SecureStore.setItemAsync('refreshToken', newRefreshToken);

    setToken(newAccessToken);
    return newAccessToken;
  }

  async function getValidToken(): Promise<string|null> {
    const storedToken = await SecureStore.getItemAsync('accessToken');
    if (!storedToken) return null;

    const payload = JSON.parse(atob(storedToken.split('.')[1]));
    const now = Math.floor(Date.now() / 1000);

    if (payload.exp <= now) {
      return await refreshAccessToken();
    }

    return storedToken;
  }

  useEffect(() => {
    let isMounted = true;

    async function connectSocket() {
      if (!email) return;
      if (stompClient.current?.active) return;

      try {
        const validToken = await getValidToken();
        if (!validToken) {
          console.log("Socket skipped: no access token yet");
          return;
      }
        const client = new Client({
          brokerURL: `ws://${IP_ADDRESS}:8080/socket`,
          connectHeaders: {
            Authorization: `Bearer ${validToken}`
          },
          reconnectDelay: 5000,
          debug: (msg) => console.log(msg),
        });

        client.onConnect = () => {
          if (!isMounted) return;
          console.log('Connected to WebSocket');
          stompClient.current = client;
          setConnected(true);
        };

        client.onDisconnect = () => {
          if (!isMounted) return;
          console.warn('WebSocket disconnected');
          setConnected(false);
        };

        client.onWebSocketError = (error) => {
          console.error('WS error', error);
        };

        client.onStompError = (frame) => {
          console.error('STOMP Error:', frame);
        };

        stompClient.current = client;
        client.activate();
      } catch (error) {
        console.error('Socket connection error:', error);
      }
    }

    connectSocket();

    return () => {
      isMounted = false;
      if (stompClient.current?.active) {
        stompClient.current.deactivate();
      }
    };
  }, [email, token]);

  return (
    <ChatSocketContext.Provider value={{ stompClient, connected }}>
      {children}
    </ChatSocketContext.Provider>
  );
};

export const useChatSocket = () => {
  const context = useContext(ChatSocketContext);
  if (!context) {
    throw new Error('useChatSocket must be used within ChatSocketProvider');
  }
  return context;
};