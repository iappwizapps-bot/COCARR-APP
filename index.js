/**
 * @format
 */

import {AppRegistry} from 'react-native';
import App from './App';
import {name as cocarrApp} from './app.json';


// Ensure Firebase is initialized
// import firebase from '@react-native-firebase/app';

// if (!firebase.apps.length) {
    // firebase.initializeApp();
//   }
  
AppRegistry.registerComponent(cocarrApp, () => App);
