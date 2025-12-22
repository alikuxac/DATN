import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistStore, persistReducer, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from 'redux-persist';

// 👇 1. Xóa dòng import cũ (import storage from './storage')
// import storage from './storage'; 

// 👇 2. Thay bằng import trực tiếp từ thư viện
import AsyncStorage from '@react-native-async-storage/async-storage';

import appReducer from './slices/appSlice'; // (Ví dụ reducer của bạn)

const rootReducer = combineReducers({
  app: appReducer,
  // ... các reducer khác
});

const persistConfig = {
  key: 'root',
  version: 1,
  storage: AsyncStorage,
  whitelist: ['app'], // Chỉ lưu những slice cần thiết
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

export const persistor = persistStore(store);
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;