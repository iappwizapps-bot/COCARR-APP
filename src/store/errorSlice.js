import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    error:null,
    showErrorModal:false
};

const errorSlice = createSlice({
  name: 'error',
  initialState,
  reducers: {
    setError: (state, action) => {
      state.error = action.payload.error;
      state.showErrorModal = true;
    },
    closeErrorModal: (state) => {
      state.error = null;
      state.showErrorModal = false;
    },
  },
});

export const { setError, closeErrorModal } = errorSlice.actions;
export default errorSlice.reducer;
