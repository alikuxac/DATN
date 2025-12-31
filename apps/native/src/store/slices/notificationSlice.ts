import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface NotificationItem {
  _id: string;
  title: string;
  body: string;
  type: string;
  isRead: boolean;
  createdAt: string;
  data?: any;
}

interface NotificationState {
  items: NotificationItem[];
  unreadCount: number;
}

const initialState: NotificationState = {
  items: [],
  unreadCount: 0,
};

const notificationSlice = createSlice({
  name: 'notification',
  initialState,
  reducers: {
    setNotifications: (state, action: PayloadAction<NotificationItem[]>) => {
      state.items = action.payload;
      // We don't overwrite unreadCount here automatically anymore, 
      // or we only do it if we are sure we have the full list. 
      // But for hybrid strategy, let's keep them separate usually.
      // However, if we fetch list, we might want to update local items status.
    },
    setUnreadCount: (state, action: PayloadAction<number>) => {
      state.unreadCount = action.payload;
    },
    incrementUnread: (state) => {
      state.unreadCount += 1;
    },
    decrementUnread: (state) => {
      state.unreadCount = Math.max(0, state.unreadCount - 1);
    },
    addNotification: (state, action: PayloadAction<NotificationItem>) => {
      state.items.unshift(action.payload);
      // Hybrid: Socket event adds item AND we increment count
      // Logic handled in component or here? 
      // If we call addNotification, we usually imply it's new/unread.
      // But let's separate concerns or keep it simple.
      // Let's keep addNotification doing both for convenience if it IS unread.
      if (!action.payload.isRead) {
        state.unreadCount += 1;
      }
    },
    markAsReadLocal: (state, action: PayloadAction<string>) => {
      const index = state.items.findIndex((item) => item._id === action.payload);
      if (index !== -1 && !state.items[index].isRead) {
        state.items[index].isRead = true;
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
    },
    // Optional: Update full item if needed
    updateNotification: (state, action: PayloadAction<NotificationItem>) => {
      const index = state.items.findIndex((item) => item._id === action.payload._id);
      if (index !== -1) {
        // If read status changed, update unread count
        if (state.items[index].isRead !== action.payload.isRead) {
          if (action.payload.isRead) state.unreadCount--;
          else state.unreadCount++;
        }
        state.items[index] = action.payload;
      }
    }
  },
});

export const { setNotifications, setUnreadCount, incrementUnread, decrementUnread, addNotification, markAsReadLocal, updateNotification } = notificationSlice.actions;
export default notificationSlice.reducer;
