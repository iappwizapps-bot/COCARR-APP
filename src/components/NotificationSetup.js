import { Alert } from 'react-native';
import messaging from '@react-native-firebase/messaging';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_URL } from '../utils/constants';
import { useDispatch } from 'react-redux';
import { updateFcmToken } from '../store/authSlice';

export const setupNotificationListeners = async () => {

  const dispatch = useDispatch();
  try {
    // Request permission and get token
    const authStatus = await messaging().requestPermission();
    const enabled =
    authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
    authStatus === messaging.AuthorizationStatus.PROVISIONAL;

  if (enabled) {
    console.log("Notification permission granted.");
    const token = await messaging().getToken();
    if (token) {
      console.log("FCM Token:", token);
      // await AsyncStorage.setItem("fcmToken", token);
      dispatch(updateFcmToken({fcmToken:token}))
      await axios.post(`${API_URL}/notification/`, { token });
    }
  }

  // Listen for foreground notifications
  const unsubscribeForeground = messaging().onMessage(async (remoteMessage) => {
    console.log("New Foreground Notification:", remoteMessage);
    Alert.alert(remoteMessage.notification.title, remoteMessage.notification.body);
  });

  // Listen for background notification clicks
  messaging().onNotificationOpenedApp((remoteMessage) => {
    console.log("User tapped on notification (Background):", remoteMessage);
  });

  // Listen for killed-state notification clicks
  messaging().getInitialNotification().then((remoteMessage) => {
    if (remoteMessage) {
      console.log("User tapped on notification (Killed State):", remoteMessage);
    }
  });

  return unsubscribeForeground;
  } catch (error) {
    console.error("Error setting up notification listeners:", error);
  }
};