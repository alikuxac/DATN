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

  const connect = useCallback((userId: string, token?: string) => {
    if (!userId) {
      console.warn('[SocketProvider] Cannot connect without userId');
      return;
    }

    const newSocket = initializeSocket(userId, token);
    setSocket(newSocket);

    const handleConnect = () => setIsConnected(true);
    const handleDisconnect = () => setIsConnected(false);

    newSocket.on('connect', handleConnect);
    newSocket.on('disconnect', handleDisconnect);

    newSocket.on('new_notification', (data: any) => {
      console.log('🔔 [Alert] New Notification:', data);
      // In a real app, we might dispatch a Redux action or show a toast here
    });

    newSocket.on('force_logout', () => {
      console.warn('⚠️ Force logout received from server');
      Cookies.remove('accessToken');
      Cookies.remove('user');
      window.location.href = '/auth/login?reason=session_expired';
    });

    return () => {
      newSocket.off('connect', handleConnect);
      newSocket.off('disconnect', handleDisconnect);
      newSocket.off('new_notification');
      newSocket.off('force_logout');
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
    const userCookie = Cookies.get('user');
    let userId = '';

    if (userCookie) {
      try {
        const userData = JSON.parse(userCookie);
        userId = userData.data?._id || userData.data?.id;
      } catch (e) {
        console.error('[SocketContext] Error parsing user cookie:', e);
      }
    }

    if (accessToken && userId) {
      connect(userId, accessToken);
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
