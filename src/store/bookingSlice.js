import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  selectedCity: null,
  selectedLocation: null,
  showCityPicker: false,
  showCancelRide:null,
  showExtendRide:null,
  showLastBooking: null,
  startDateTime: new Date(Math.ceil(Date.now() / (1000 * 60 * 60)) * 1000 * 60 * 60 + 1000 * 60 * 60 * 3).toISOString(),
  endDateTime: new Date(Math.ceil(Date.now() / (1000 * 60 * 60)) * 1000 * 60 * 60 + 1000 * 60 * 60 * 15).toISOString(),
};

const bookingSlice = createSlice({
  name: 'booking',
  initialState,
  reducers: {
    setShowCityLocation: (state, action) => {
      return {
        ...state,
        selectedCity: action.payload.selectedCity ? action.payload.selectedCity : state.selectedCity,
        selectedLocation: action.payload.selectedLocation ? action.payload.selectedLocation : state.selectedLocation
      }
    },
    setShowCancelRide: (state, action) => {
      return {
        ...state,
        showCancelRide: action.payload
      }
    },
    setShowExtendRide: (state, action) => {
      return {
        ...state,
        showExtendRide: action.payload
      }
    },
    setShowLastBooking: (state, action) => {
      return {
        ...state,
        showLastBooking: action.payload
      }
    },
    setSelectedCity: (state, action) => {
      return {
        ...state,
        selectedCity:action.payload,
        selectedLocation:null,
        showCityPicker:false
      }
    },
    setShowCityPicker: (state, action) => {
      return {
        ...state,
        showCityPicker: action.payload
      }
    },
    clearSelectedCity: (state) => {
      return {
        ...state,
        selectedCity: null
      }
    },
    setStartDateTime: (state, action) => {
      return {
        ...state,
        startDateTime: action.payload
      }
    },
    setEndDateTime: (state, action) => {
      return {
        ...state,
        endDateTime: action.payload
      }
    },
    setDates: (state, action) => {
      return {
        ...state,
        startDateTime: action.payload.startDateTime,
        endDateTime: action.payload.endDateTime
      }
    },
    clearDates: (state) => {
      return {
        ...state,
        startDateTime: null,
        endDateTime: null
      }
    },
    resetBooking: (state) => {
      return {
        ...state,
        selectedCity: null,
        startDateTime: null,
        endDateTime: null
      }
    },
  },
});

export const {
  setShowCancelRide,
  setShowCityLocation,
  setShowExtendRide,
  setShowLastBooking,
  setSelectedCity,
  clearSelectedCity,
  setShowCityPicker,
  setStartDateTime,
  setEndDateTime,
  clearDates,
  setDates,
  resetBooking,
} = bookingSlice.actions;

export default bookingSlice.reducer;