import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { OpenScreen } from '../screens/authScreens/OpenScreen';
import { MobileInputScreen } from '../screens/authScreens/MobileInputScreen';
import { OTPScreen } from '../screens/authScreens/OTPScreen';

const Stack = createNativeStackNavigator();

export function AuthNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Open" component={OpenScreen} options={{statusBarHidden:true}}/>
      <Stack.Screen name="MobileInput" component={MobileInputScreen} />
      <Stack.Screen name="OTP" component={OTPScreen} />
    </Stack.Navigator>
  );
}
