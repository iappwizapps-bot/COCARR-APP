import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HostInboxScreen } from '../screens/host/hostInboxScreens/HostInboxScreen';

const Stack = createNativeStackNavigator();

export function HostInboxStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false ,statusBarColor:'#000'}}>
      <Stack.Screen name="HostInbox" component={HostInboxScreen} />
    </Stack.Navigator>
  );
}
