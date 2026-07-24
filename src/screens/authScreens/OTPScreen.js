import React, { useState, useRef } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Alert, 
  KeyboardAvoidingView, 
  Platform, 
  SafeAreaView,
  Image,
  Dimensions
} from 'react-native';
import { useDispatch } from 'react-redux';
import axios from 'axios';
import auth from '@react-native-firebase/auth';
import { login } from '../../store/authSlice';
import { API_URL } from '../../utils/constants';

const { width } = Dimensions.get('window');
const inputWidth = (width - 100 - 60) / 4; // 100 for padding, 60 for hyphens (20 * 3)

export function OTPScreen({ navigation, route }) {
  const [otp, setOtp] = useState(['', '', '', '']);
  const dispatch = useDispatch();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Create refs for each TextInput
  const inputs = useRef([]);
  // `isSubmitting` state updates asynchronously, so it can't block a second
  // call fired in the same tick — iOS SMS autofill populates all four boxes at
  // once and re-triggers the last one. A ref is the only reliable latch, and
  // without it the OTP was verified twice: the first call succeeded and logged
  // the user in, the second came back "Mobile no. already verified" and threw
  // an alert over the home screen.
  const submittingRef = useRef(false);

  // Handle OTP input change
  const handleChange = (text, index) => {
    if (/^\d+$/.test(text) || text === '') {
      const newOtp = [...otp];
      newOtp[index] = text;
      setOtp(newOtp);

      if (text !== '' && index < 3) {
        // Move focus to next input
        inputs.current[index + 1].focus();
      }

      if (text !== '' && index === 3) {
        // All digits entered, submit OTP
        handleSubmit(newOtp.join(''));
      }
    }
  };

  // Handle key presses for backspace
  const handleKeyPress = ({ nativeEvent }, index) => {
    if (nativeEvent.key === 'Backspace' && otp[index] === '' && index > 0) {
      const newOtp = [...otp];
      newOtp[index - 1] = '';
      setOtp(newOtp);
      inputs.current[index - 1].focus();
    }
  };

  // Handle OTP submission
  const handleSubmit = async (enteredOtp) => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setIsSubmitting(true);
    try {
      const response = await axios.post(`${API_URL}/user/verify-otp`, {
        mobile: route.params.mobileNumber,
        referralCode: route.params.referralCode ? route.params.referralCode : '',
        otp: enteredOtp
      });
      
      if (response.data.token) {
        const { token,user:userDbInfo } = response.data;
        let userInfo= await auth().signInWithCustomToken(token);
        const user = auth().currentUser;
        const authToken = await user.getIdToken();
        dispatch(login({ id: user.uid,user:{ userName: userDbInfo.name, email: userDbInfo.email,token:authToken, isPremium:userDbInfo.isPremium, profilePhoto:userDbInfo.profilePhoto,licenseVerified:userDbInfo.licenseVerified,kycVerified:userDbInfo.kycVerified, contactNumber:userDbInfo.contactNumber }}));
      } else {
        resetForRetry('Invalid OTP. Please try again.');
      }
    } catch (error) {
      // A wrong or expired OTP is normal user error, not a crash — console.log
      // keeps it out of the red-box overlay. Surface the server's own message
      // ("Invalid OTP", "OTP expired", …) instead of a generic string.
      console.log('OTP verification failed:', error?.response?.data || error?.message);
      const serverMessage =
        error?.response?.data?.error?.message || error?.response?.data?.message;
      resetForRetry(serverMessage || 'An error occurred. Please try again.');
    }
  };

  // Clears the boxes and re-arms submission after a failed attempt.
  const resetForRetry = (message) => {
    submittingRef.current = false;
    setIsSubmitting(false);
    Alert.alert('Error', message);
    setOtp(['', '', '', '']);
    inputs.current[0]?.focus();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={styles.topContainer}>
          <Image 
            source={require('../../images/logo.png')} 
            style={styles.logo}
            resizeMode="contain"
          />

          <Text style={styles.title}>Enter OTP to Verify</Text>
          
          <Text style={styles.subtitle}>Sent to {route.params.mobileNumber}</Text>
          
          <View style={styles.otpContainer}>
            {otp.map((digit, index) => (
              <React.Fragment key={index}>
                <TextInput
                  ref={(ref) => inputs.current[index] = ref}
                  style={styles.otpInput}
                  keyboardType="number-pad"
                  maxLength={1}
                  value={digit}
                  onChangeText={(text) => handleChange(text, index)}
                  onKeyPress={(e) => handleKeyPress(e, index)}
                  returnKeyType="next"
                  autoFocus={index === 0}
                />
                {index < 3 && <Text style={styles.hyphen}>-</Text>}
              </React.Fragment>
            ))}
          </View>
        </View>
        
        <View style={styles.bottomContainer}>
          {/* The 4th digit auto-submits, so this button is live the moment the
              code is complete — tapping it then sent a second verify for the
              same OTP. Disabled while a request is in flight. */}
          <TouchableOpacity
            style={[styles.button,
              { backgroundColor: otp.every(digit => digit !== '') && !isSubmitting ? '#EDBF31' : '#454545' }]}
            disabled={!otp.every(digit => digit !== '') || isSubmitting}
            onPress={() => handleSubmit(otp.join(''))}
          >
            <Text style={styles.buttonText}>{isSubmitting ? 'Verifying…' : 'Verify OTP'}</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#000',
  },
  container: {
    flex: 1,
    backgroundColor: '#000',
    padding: 20,
    justifyContent: 'space-between',
  },
  topContainer: {
    flex: 1,
  },
  logo: {
    height: 40,
    width: 80,
    marginBottom: 48,
  },
  bottomContainer: {
    paddingBottom: 24,
  },
  title: {
    fontSize: 14,                           // Larger font size for prominence
    fontWeight: '500',                      // Semi-bold text
    color: '#efefef',                          // White color for readability
    marginBottom: 2, 
  },
  subtitle: {
    fontSize: 12,
    color: '#959595',
    marginBottom: 24,
  },
  otpContainer: {
    flexDirection: 'row',
    // justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
  },
  otpInput: {
    width: inputWidth,
    height: inputWidth,
    borderWidth: 1,
    borderColor: '#252525',
    borderRadius: 7,
    textAlign: 'center',
    fontSize: 24,
    color: '#fff',
    backgroundColor: '#151515',
  },
  hyphen: {
    color: '#959595',
    fontSize: 24,
    paddingHorizontal: 10,
  },
  button: {
    paddingVertical: 14,
    borderRadius: 7,
    alignItems: 'center',
  },
  buttonText: {
    color: '#000',
    fontSize: 14,
    textTransform:'uppercase',
    fontWeight: '600',
  },
});
