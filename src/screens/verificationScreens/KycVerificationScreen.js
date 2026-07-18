import React, { useState } from 'react';
import { View, Text, TextInput, Button, Image, TouchableOpacity } from 'react-native';

export function KycVerificationScreen() {
  const [kycInput, setKycInput] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [kycImage, setKycImage] = useState(null);

  const handleVerify = () => {
    
  };

  const handleImageUpload = () => {
    launchImageLibrary(
      {
        mediaType: 'photo',
        maxWidth: 300,
        maxHeight: 300,
        quality: 1,
      },
      (response) => {
        if (response.didCancel) {
          console.log('User cancelled image picker');
        } else if (response.error) {
          console.log('ImagePicker Error: ', response.error);
        } else {
          const source = response.assets[0].uri;
          setKycImage(source);
        }
      }
    );
  };

  const handleSaveAndContinue = () => {
    // Handle save and continue logic here
    console.log('KYC Input:', kycInput);
    console.log('KYC Image:', kycImage);
  };

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text>KYC Input</Text>
      <TextInput
        value={kycInput}
        onChangeText={setKycInput}
        placeholder="Enter KYC details"
        style={{ borderWidth: 1, padding: 8, marginBottom: 16 }}
      />

      <Text>OTP Input</Text>
      <TextInput
        value={otpInput}
        onChangeText={setOtpInput}
        placeholder="Enter OTP"
        style={{ borderWidth: 1, padding: 8, marginBottom: 16 }}
      />

      <Button title="Verify OTP" onPress={handleVerify} />

      <TouchableOpacity onPress={handleImageUpload} style={{ marginVertical: 16 }}>
        <Text>Upload KYC Image</Text>
        {kycImage && <Image source={{ uri: kycImage }} style={{ width: 100, height: 100, marginTop: 8 }} />}
      </TouchableOpacity>

      <Button title="Save and Continue" onPress={handleSaveAndContinue} />
    </View>
  );
}
