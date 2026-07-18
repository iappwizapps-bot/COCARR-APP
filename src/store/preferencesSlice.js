import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  theme: 'dark',
  language: 'en',
  notifications: true,
};

const preferencesSlice = createSlice({
  name: 'preferences',
  initialState,
  reducers: {
    setTheme: (state, action) => {
      state.theme = action.payload;
    },
    setLanguage: (state, action) => {
      state.language = action.payload;
    },
    toggleNotifications: (state) => {
      state.notifications = !state.notifications;
    },
  },
});

export const { setTheme, setLanguage, toggleNotifications } = preferencesSlice.actions;
export default preferencesSlice.reducer;
