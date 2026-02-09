/* eslint-disable react-hooks/rules-of-hooks */
"use client";

import React, { createContext, useContext, useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { io, Socket } from 'socket.io-client';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type EventCallback = (...args: any[]) => void;

interface WebSocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  sendMessage: (event: string, data: unknown) => void;
  on: (event: string, callback: EventCallback) => void;
  off: (event: string, callback?: EventCallback) => void;
  reconnect: () => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

export function WebSocketProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [tokenVersion, setTokenVersion] = useState(0);
  const socketRef = useRef<Socket | null>(null);

  // Function to trigger reconnection (call after login)
  const reconnect = useCallback(() => {
    // Close existing socket if any
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }
    // Trigger re-connection by updating tokenVersion
    setTokenVersion(v => v + 1);
  }, []);

  // Listen for auth state changes
  useEffect(() => {
    const handleAuthChange = () => {
      console.log('Auth state changed, triggering WebSocket reconnect');
      setTokenVersion(v => v + 1);
    };

    window.addEventListener('auth-state-changed', handleAuthChange);
    return () => {
      window.removeEventListener('auth-state-changed', handleAuthChange);
    };
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
   
    if (!token) {
      console.log('No access token found, WebSocket will not connect');
      // Clean up any existing socket
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
      setIsConnected(false);
      setSocket(null);
      return;
    }

    // Remove /api suffix from API_URL for WebSocket connection
    const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api').replace('/api', '');
    console.log('Connecting WebSocket to:', `${baseUrl}/notifications`);
    
    const newSocket = io(`${baseUrl}/notifications`, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    newSocket.on('connect', () => {
      console.log('WebSocket connected');
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error.message);
      setIsConnected(false);
    });

    newSocket.on('error', (error) => {
      console.error('WebSocket error:', error);
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    return () => {
      newSocket.close();
      socketRef.current = null;
    };
  }, [tokenVersion]);

  const sendMessage = useCallback((event: string, data: unknown) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(event, data);
    }
  }, []);

  const on = useCallback((event: string, callback: EventCallback) => {
    socketRef.current?.on(event, callback);
  }, []);

  const off = useCallback((event: string, callback?: EventCallback) => {
    if (callback) {
      socketRef.current?.off(event, callback);
    } else {
      socketRef.current?.off(event);
    }
  }, []);

  const value = useMemo(() => ({
    socket,
    isConnected,
    sendMessage,
    on,
    off,
    reconnect
  }), [socket, isConnected, sendMessage, on, off, reconnect]);

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocket() {
  const context = useContext(WebSocketContext);
  if (context === undefined) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
}
