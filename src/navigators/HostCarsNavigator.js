import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AddCar from '../screens/host/homeScreens/AddCar';
import { HostCarsScreen } from '../screens/host/hostCarsScreens/HostCarsScreen';
import ScheduleInfoScreen from '../screens/host/hostCarsScreens/ScheduleInfoScreen';
import { CreateScheduleScreen } from '../screens/host/hostCarsScreens/CreateScheduleScreen';
import { CreateScheduleBlockScreen } from '../screens/host/hostCarsScreens/CreateScheduleBlock';
import { HostCarInfoScreen } from '../screens/host/hostCarsScreens/HostCarInfoScreen';

const Stack = createNativeStackNavigator();

export function HostCarsNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false ,statusBarColor:'#000'}}>
      <Stack.Screen name="HostCars" component={HostCarsScreen} />
      <Stack.Screen name="HostCarInfo" component={HostCarInfoScreen}/>
      <Stack.Screen name="ScheduleInfo" component={ScheduleInfoScreen}/>
      <Stack.Screen name="CreateSchedule" component={CreateScheduleScreen}/>
      <Stack.Screen name="CreateScheduleBlock" component={CreateScheduleBlockScreen}/>
    </Stack.Navigator>
  );
}
