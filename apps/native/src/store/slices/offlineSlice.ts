import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface PendingRequest {
  id: string;
  url: string;
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  data: any;
  headers?: any;
  timestamp: number;
  retryCount: number;
}

interface OfflineState {
  isOffline: boolean;
  queue: PendingRequest[];
}

const initialState: OfflineState = {
  isOffline: false,
  queue: [],
};

const offlineSlice = createSlice({
  name: 'offline',
  initialState,
  reducers: {
    setConnectionStatus: (state, action: PayloadAction<boolean>) => {
      state.isOffline = !action.payload;
    },
    addToQueue: (state, action: PayloadAction<PendingRequest>) => {
      state.queue.push(action.payload);
    },
    removeFromQueue: (state, action: PayloadAction<string>) => {
      state.queue = state.queue.filter(req => req.id !== action.payload);
    },
    clearQueue: (state) => {
      state.queue = [];
    },
  },
});

export const { setConnectionStatus, addToQueue, removeFromQueue, clearQueue } = offlineSlice.actions;
export default offlineSlice.reducer;
