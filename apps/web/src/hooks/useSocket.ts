'use client';

import { useEffect, useCallback } from 'react';
import { useSocketContext } from '@/contexts/SocketContext';
import { onEvent, offEvent, emitEvent } from '@/lib/socket';

export const useSocket = () => {
  const { socket, isConnected, connect, disconnect } = useSocketContext();

  const emit = useCallback(
    <K extends keyof import('@/lib/socket').SocketEvents>(
      event: K,
      data: Parameters<import('@/lib/socket').SocketEvents[K]>[0]
    ) => {
      emitEvent(event, data);
    },
    []
  );

  const on = useCallback(
    <K extends keyof import('@/lib/socket').SocketEvents>(
      event: K,
      callback: import('@/lib/socket').SocketEvents[K]
    ) => {
      onEvent(event, callback);
    },
    []
  );

  const off = useCallback(
    <K extends keyof import('@/lib/socket').SocketEvents>(
      event: K,
      callback?: import('@/lib/socket').SocketEvents[K]
    ) => {
      offEvent(event, callback);
    },
    []
  );

  return {
    socket,
    isConnected,
    connect,
    disconnect,
    emit,
    on,
    off,
  };
};
