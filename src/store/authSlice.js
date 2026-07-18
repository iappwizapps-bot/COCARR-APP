import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  uid:null,
        isAuthenticated:false,
        fcmToken:null,
        token:false,
        userName:null,
        isPremium:false,
        contactNumber:null,
        profilePhoto:null,
        email:null,
        licenseVerified:false,
        kycVerified:false,
        walletPoints:0,
        userRole:'customer' // customer or host
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    login: (state, action) => {
      console.log('action.payload', action.payload)
      console.log('login', state)
      return {...state,
                uid:action.payload.uid,
                isAuthenticated:true,
                token:action.payload.user?.token,
                userName:action.payload.user?.userName,
                fcmToken:action.payload.user?.fcmToken,
                contactNumber:action.payload.user?.contactNumber,
                isPremium:action.payload.user?.isPremium,
                email:action.payload.user?.email,
                profilePhoto:action.payload.user?.profilePhoto,
                licenseVerified:action.payload.user?.licenseVerified,
                kycVerified:action.payload.user?.kycVerified,
                walletPoints:action.payload.user?.walletPoints,
                userRole:action.payload.user?.userRole
      }
    },
    updateFcmToken: (state, action) => {
      return {...state,
                fcmToken:action.payload.fcmToken
      }
    },
    updateUserRole: (state, action) => {
      return {...state,
                userRole:action.payload.userRole
      }
    },
    updateWalletPoints: (state, action) => {
      console.log('updateWalletPoints', action.payload);
      return {...state,
                walletPoints:action.payload.walletPoints
      }
    },
    updateProfile: (state, action) => {
      console.log('updateProfile', action.payload);
      return {...state,
                userName:action.payload.userName ? action.payload.userName : state.userName,
                email:action.payload.email ? action.payload.email : state.email,
                profilePhoto:action.payload.profilePhoto ? action.payload.profilePhoto : state.profilePhoto
      }
    },
    updateToken: (state, action) => {
      console.log('updateToken', action.payload.token);
      return {...state,
                token:action.payload.token
      }
    },
    logout: (state) => {
      console.log('logout');
      return {
        uid:null,
        isAuthenticated:false,
        fcmToken:null,
        token:false,
        userName:null,
        isPremium:false,
        profilePhoto:null,
        email:null,
        licenseVerified:false,
        kycVerified:false
      }
    },
  },
});

export const { login, logout, updateToken,updateProfile,updateWalletPoints,updateUserRole,updateFcmToken } = authSlice.actions;
export default authSlice.reducer;
