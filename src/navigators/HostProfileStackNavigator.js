import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ProfileScreen } from '../screens/profileScreens/ProfileScreen';
import { OffersScreen } from '../screens/profileScreens/Offers';
import { EditProfileScreen } from '../screens/profileScreens/EditProfileScreen';
import ReferralPage from '../screens/profileScreens/ReferralPage';
import WalletPage from '../screens/profileScreens/WalletPage';
import HostEarningsPage from '../screens/host/hostProfileScreens/HostEarningsPage';
import { HostProfile } from '../screens/host/hostProfileScreens/HostProfile';

const Stack = createNativeStackNavigator();

export function HostProfileStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false ,statusBarColor:'#000'}}>
      <Stack.Screen name="HostProfile" component={HostProfile} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      <Stack.Screen name="HostEarnings" component={HostEarningsPage} />
      <Stack.Screen name="Referral" component={ReferralPage}/>
      <Stack.Screen name="Offers" component={OffersScreen} />
      <Stack.Screen name="Wallet" component={WalletPage}/>
    </Stack.Navigator>
  );
}
