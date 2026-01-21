import { useSocketContext } from '@/context/SocketContext';

/**
 * Hook to consume Socket Context.
 * CENTRALIZED in SocketProvider to prevent duplicate connections.
 */
export const useSocketNotification = () => {
  const context = useSocketContext();
  return {
    ...context,
    sendLocationUpdate: context.sendLocationUpdate,
  };
};