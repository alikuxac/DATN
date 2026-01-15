import NetInfo from '@react-native-community/netinfo';
import { store } from '@/store';
import { setConnectionStatus, removeFromQueue, PendingRequest, addToQueue } from '@/store/slices/offlineSlice';
import { apiService } from './api.service';

class OfflineService {
  private isConnected = true;

  constructor() {
    // Initialize listener
    NetInfo.fetch().then(state => {
      const connected = !!(state.isConnected);
      this.isConnected = connected;
      store.dispatch(setConnectionStatus(connected));
    });

    NetInfo.addEventListener(state => {
      const connected = !!(state.isConnected);
      const wasConnected = this.isConnected;
      this.isConnected = connected;

      store.dispatch(setConnectionStatus(connected));

      if (connected && !wasConnected) {
        console.log('Back online: Processing queue...');
        this.processQueue();
      }
    });
  }

  async processQueue() {
    const state = store.getState();
    // @ts-ignore
    const queue = state.offline.queue as PendingRequest[];

    if (queue.length === 0) return;

    for (const req of queue) {
      try {
        console.log(`Processing offline request: ${req.method} ${req.url}`);

        switch (req.method) {
          case 'POST':
            await apiService.post(req.url, req.data, { headers: req.headers });
            break;
          case 'PUT':
            await apiService.put(req.url, req.data, { headers: req.headers });
            break;
          case 'PATCH':
            await apiService.patch(req.url, req.data, { headers: req.headers });
            break;
          case 'DELETE':
            await apiService.delete(req.url, { headers: req.headers });
            break;
        }

        // Success - remove from queue
        store.dispatch(removeFromQueue(req.id));
      } catch (error) {
        console.error(`Failed to retry request ${req.id}`, error);
        // Keep in queue or implement retry count limit logic here
      }
    }
  }

  // Wrapper function to use in UI
  async attemptAction(
    actionFn: () => Promise<any>,
    offlineFallback: {
      method: 'POST' | 'PUT' | 'PATCH' | 'DELETE',
      endpoint: string,
      data?: any
    }
  ) {
    if (this.isConnected) {
      return await actionFn();
    } else {
      // Add to queue
      store.dispatch(addToQueue({
        id: Date.now().toString(),
        url: offlineFallback.endpoint,
        method: offlineFallback.method,
        data: offlineFallback.data,
        timestamp: Date.now(),
        retryCount: 0
      }));
      throw new Error('OFFLINE_SAVED');
    }
  }
}

export const offlineService = new OfflineService();
