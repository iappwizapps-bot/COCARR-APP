import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { combineReducers } from 'redux';
import authReducer from './authSlice';
import preferencesReducer from './preferencesSlice';
import bookingReducer from './bookingSlice';
import errorReducer from './errorSlice';

// Persist configuration
const persistConfig = {
  key: 'root',
  storage: AsyncStorage,
  whitelist: ['auth', 'preferences', 'booking'], // Specify which reducers to persist
  blacklist: ['booking.showLastBooking','error'], // Blacklist an object item in booking
};

// Combine all reducers
const rootReducer = combineReducers({
  auth: authReducer,
  preferences: preferencesReducer,
  booking: bookingReducer,
  error: errorReducer,
});

// Create persisted reducer
const persistedReducer = persistReducer(persistConfig, rootReducer);

// Create store
export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE', 'persist/PAUSE', 'persist/PURGE', 'persist/REGISTER'],
      },
    }),
});

// Create persistor
export const persistor = persistStore(store);
