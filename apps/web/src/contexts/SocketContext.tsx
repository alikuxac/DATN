'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Socket } from 'socket.io-client';
import { initializeSocket, disconnectSocket, getSocket } from '@/lib/socket';
import Cookies from 'js-cookie';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  connect: (userId: string) => void;
  disconnect: () => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const useSocketContext = (): SocketContextType => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocketContext must be used within SocketProvider');
  }
  return context;
};

interface SocketProviderProps {
  children: React.ReactNode;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const connect = useCallback((userId: string) => {
    if (!userId) {
      console.warn('[SocketProvider] Cannot connect without userId');
      return;
    }

    const newSocket = initializeSocket(userId);
    setSocket(newSocket);

    const handleConnect = () => setIsConnected(true);
    const handleDisconnect = () => setIsConnected(false);

    newSocket.on('connect', handleConnect);
    newSocket.on('disconnect', handleDisconnect);

    return () => {
      newSocket.off('connect', handleConnect);
      newSocket.off('disconnect', handleDisconnect);
    };
  }, []);

  const disconnect = useCallback(() => {
    disconnectSocket();
    setSocket(null);
    setIsConnected(false);
  }, []);

  // Auto-connect if user is authenticated
  useEffect(() => {
    const accessToken = Cookies.get('accessToken');
    const userId = Cookies.get('userId'); // Assuming userId is stored in cookie

    if (accessToken && userId) {
      connect(userId);
    }

    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  const value: SocketContextType = {
    socket,
    isConnected,
    connect,
    disconnect,
  };

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};
