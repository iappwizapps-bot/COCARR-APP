import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import  HomeScreen from '../screens/homeScreens/HomeScreen';
import { CarsListingScreen } from '../screens/homeScreens/CarsListingScreen';
import { CarsInfoScreen } from '../screens/homeScreens/carinfo/CarInfoScreen';
import { DatePickerScreen } from '../screens/homeScreens/DatePickerScreen';
import { CityPickerScreen } from '../screens/homeScreens/CityPickerScreen';
import { PaymentSuccessScreen } from '../screens/homeScreens/PaymentSuccessScreen';
import BookingOfferScreen from '../screens/homeScreens/carinfo/BookingOfferScreen';
import PremiumMembershipScreen from '../screens/profileScreens/PremiumMembership';
import HostHomeScreen from '../screens/host/homeScreens/HostHomeScreen';
import AddCar from '../screens/host/homeScreens/AddCar';
import { BRAND_COLOR } from '../utils/constants';
import ScheduleInfoScreen from '../screens/host/hostCarsScreens/ScheduleInfoScreen';
import { CreateScheduleScreen } from '../screens/host/hostCarsScreens/CreateScheduleScreen';
import { CreateScheduleBlockScreen } from '../screens/host/hostCarsScreens/CreateScheduleBlock';
import { TabNavigator } from './TabNavigator';

const Stack = createNativeStackNavigator();

export function HomeStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false ,statusBarColor:'#000'}}>
      {/* <Stack.Screen name="/" component={TabNavigator} /> */}
      <Stack.Screen name="HostHome" component={HostHomeScreen} />
      <Stack.Screen name="AddCar" component={AddCar} options={{presentation: 'fullScreenModal',statusBarColor:'#1c1c1c'}}/>
      <Stack.Screen name="CarsListing" component={CarsListingScreen} />
      <Stack.Screen name="CarInfo" component={CarsInfoScreen} />
      <Stack.Screen name="BookingOffers" options={{presentation: 'fullScreenModal',title:'Offers',headerShown:false}} component={BookingOfferScreen} />
      <Stack.Screen name="DatePicker" component={DatePickerScreen} options={{ presentation: 'modal' }} />
      <Stack.Screen name="CityPicker" component={CityPickerScreen} options={{ presentation: 'modal' }} />
      <Stack.Screen name="ScheduleInfo" component={ScheduleInfoScreen}/>
      <Stack.Screen name="CreateSchedule" component={CreateScheduleScreen}/>
      <Stack.Screen name="CreateScheduleBlock" component={CreateScheduleBlockScreen}/>
      <Stack.Screen name="PaymentSuccess" component={PaymentSuccessScreen} /> 
    </Stack.Navigator>
  );
}
