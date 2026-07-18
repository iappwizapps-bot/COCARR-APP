import moment from "moment";
import { request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import { Platform } from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import Toast from "react-native-toast-message";
import axios from "axios";


export const UnauthAxios = () => {
  const instance = axios.create();
  instance.interceptors.request.use(config => {
    delete config.headers['Authorization'];
    return config;
  });
  return instance;
};


export const formatDate = (dateTime, type = 'short') => {
  if (!dateTime) return '';
  
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const date = new Date(dateTime);
  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  const hours = date.getHours();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const formattedHours = hours % 12 || 12;
  const formattedMinutes = date.getMinutes().toString().padStart(2, '0');

  if (type === 'short') {
    const roundedMinutes = Math.round(date.getMinutes() / 30) * 30;
    const formattedRoundedMinutes = roundedMinutes === 60 ? '00' : roundedMinutes.toString().padStart(2, '0');
    const adjustedHours = (roundedMinutes === 60 ? (formattedHours % 12) + 1 : formattedHours).toString().padStart(2, '0');
    return `${day} ${month} ${adjustedHours}:${formattedRoundedMinutes} ${ampm}`;
  }
  return `${day} ${month} ${year} ${formattedHours}:${formattedMinutes} ${ampm}`;
};

export const formatDateOnly = (dateTime, type = 'short') => {
  if (!dateTime) return '';
  
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const date = new Date(dateTime);
  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();

  if (type === 'short') {
    return `${day} ${month}`;
  }
  return `${day} ${month} ${year}`;
};



export const getCurrentLocation = async () => {
  try {
    let permission;
    if (Platform.OS === 'ios') {
      permission = PERMISSIONS.IOS.LOCATION_WHEN_IN_USE;
    } else if (Platform.OS === 'android') {
      permission = PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION;
    }

    const result = await request(permission);

    if (result !== RESULTS.GRANTED) {
      throw new Error('Location permission not granted');
    }



    const getCurrentPosition = () => {
      return new Promise((resolve, reject) => {
        Geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            resolve({ latitude, longitude });
          },
          (error) => {
            reject(new Error(`Error getting location: ${error.message}`));
          }
        );
      });
    };

    const position = await getCurrentPosition();
    return position;
  } catch (error) {
    throw new Error(`Error handling location permission: ${error.message}`);
  }
};


export const showToast = (type, text1, text2) => {
  Toast.show({
    type: type,
    text1: text1,
    text2: text2,
    position: 'top',
    swipeable: true,
    visibilityTime: 3000,
    contentContainerStyle: {
      padding: 4,
    },
    text1Style: {
      color: 'white',
      fontSize: 16,
      fontWeight: 'bold',
    },
    text2Style: {
      color: 'white',
      fontSize: 14,
    },
  });
}


export function addHoursToDate(date, hours) {
  // Ensure date is a Moment object
  const momentDate = moment(date);

  // Add hours to the date
  const newDate = momentDate.add(hours, 'hours');

  // Return the new date
  return newDate.format();
}



export const formatTime = (dateTime, type = 'short') => {
  if (!dateTime) return '';
  
  const date = new Date(dateTime);
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const formattedHours = hours % 12 || 12;
  
  if (type === 'short') {
    return `${formattedHours}${ampm}`;
  }
  return `${formattedHours}:${minutes.toString().padStart(2, '0')}${ampm}`;
};



export function convertToUnixTimestamp(dateObject) {
  const unixTimestamp = Math.floor(dateObject.getTime() / 1000);
  return unixTimestamp;
}



export function formatExpiryDateandTime(dateTime) {
  const now = new Date();
  const expiryDate = new Date(dateTime);
  const diffInMs = expiryDate - now;
  const diffInMins = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInDays > 1) {
    return `Expires in ${diffInDays} days`;
  } else if (diffInDays === 1) {
    return 'Expires tomorrow';
  } else if (diffInHours >= 1) {
    return `Expires in ${diffInHours} hours`;
  } else if (diffInMins >= 1) {
    return `Expires in ${diffInMins} mins`;
  } else {
    return 'Expires soon';
  }
}