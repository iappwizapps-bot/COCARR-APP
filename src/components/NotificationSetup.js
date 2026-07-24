import { Alert, Platform } from 'react-native';
import messaging from '@react-native-firebase/messaging';
import axios from 'axios';
import { API_URL } from '../utils/constants';
import { store } from '../store/store';
import { updateFcmToken } from '../store/authSlice';

// Called from an effect, not a component body, so it must NOT use hooks
// (useDispatch here caused the "Invalid hook call" warning on launch). We
// dispatch through the store instance directly instead.
export const setupNotificationListeners = async () => {
  try {
    // iOS must be registered for remote messages before an FCM token can be
    // issued — skipping this is what produces the classic
    // "No APNS token specified before fetching FCM Token" registration error.
    if (Platform.OS === 'ios' && !messaging().isDeviceRegisteredForRemoteMessages) {
      await messaging().registerDeviceForRemoteMessages();
    }

    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (enabled) {
      let token;
      try {
        token = await messaging().getToken();
      } catch (e) {
        // No APNs token yet (e.g. iOS simulator or before registration) — not
        // fatal, just skip registering the device this launch.
        console.log('FCM getToken skipped:', e?.message);
      }
      if (token) {
        store.dispatch(updateFcmToken({ fcmToken: token }));
        try {
          await axios.post(`${API_URL}/notification/`, { token });
        } catch (e) {
          console.log('Notification token registration failed:', e?.message);
        }
      }
    }

    const unsubscribeForeground = messaging().onMessage(async (remoteMessage) => {
      const n = remoteMessage?.notification;
      if (n?.title || n?.body) Alert.alert(n.title || '', n.body || '');
    });

    messaging().onNotificationOpenedApp(() => {});
    messaging().getInitialNotification().catch(() => {});

    return unsubscribeForeground;
  } catch (error) {
    // Firebase/messaging not available (e.g. simulator without APNs) — keep the
    // app quiet rather than surfacing a red-box or console error on launch.
    console.log('Notification setup skipped:', error?.message);
  }
};
