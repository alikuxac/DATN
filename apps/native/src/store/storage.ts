import { Storage } from 'redux-persist';

export const reduxStorage: Storage = {
  setItem: (key, value) => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(key, value);
    }
    return Promise.resolve(true);
  },
  getItem: (key) => {
    if (typeof window !== 'undefined') {
      const value = window.localStorage.getItem(key);
      return Promise.resolve(value);
    }
    return Promise.resolve(null);
  },
  removeItem: (key) => {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(key);
    }
    return Promise.resolve();
  },
};