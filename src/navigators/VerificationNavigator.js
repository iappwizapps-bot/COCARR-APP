import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { KycVerificationScreen } from '../screens/verificationScreens/KycVerificationScreen';
import { LicenseVerificationScreen } from '../screens/verificationScreens/LicenseVerificationScreen';
import { ProfileVerificationScreen } from '../screens/verificationScreens/ProfileVerificationScreen';

const Stack = createNativeStackNavigator();

export function VerificationNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false ,statusBarColor:'#000'}}>
      <Stack.Screen name="KycVerification" component={KycVerificationScreen}/>
      <Stack.Screen name="LicenseVerification" component={LicenseVerificationScreen}/>
      <Stack.Screen name="ProfileVerification" component={ProfileVerificationScreen}/>
    </Stack.Navigator>
  );
}
