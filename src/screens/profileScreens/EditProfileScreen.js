import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, ToastAndroid, Platform, ScrollView } from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import Header from '../../components/CenterHeader';
import { useNavigation } from '@react-navigation/native';
import CustomText from '../../components/CustomText';
import axios from 'axios';
import { API_URL } from '../../utils/constants';
import { useDispatch } from 'react-redux';
import { updateProfile } from '../../store/authSlice';
import { UnauthAxios } from '../../utils/utils';
export const EditProfileScreen = () => {

  const [info,setInfo] = useState({name:'',email:'',profilePhoto:''})
  const [profileImage, setProfileImage] = useState(null);
  const [isProfileChanged, setIsProfileChanged] = useState(false);
  const dispatch = useDispatch()
  const navigation = useNavigation()

  const pickImage = () => {
    launchImageLibrary({ mediaType: 'photo', selectionLimit: 1 }, (response) => {
      if (response.didCancel) {
        console.log('User cancelled image picker');
      } else if (response.errorCode) {
        console.log('ImagePicker Error: ', response.errorMessage);
      } else {
        const image = response.assets[0];
        setProfileImage({
          uri: image.uri,
          fileName: image.fileName,
          type: image.type
        });
        setIsProfileChanged(true);
      }
    });
  };

  useEffect(()=>{
    async function getProfile(){
      try{
        const response = await axios.get(`${API_URL}/user/profile?populate=true`)
        setInfo(response.data)
        if (response.data.profilePhoto) {
          setProfileImage({
            uri: response.data.profilePhoto
          });
        }
    }catch(error){
        if (Platform.OS === 'android') {
          ToastAndroid.show('Error fetching user', ToastAndroid.SHORT);
        } else {
          Alert.alert('Error', 'Error fetching user');
        }
      }
    }
    getProfile()
  },[])

  const handleSave = async () => {
    try {
      let profilePhotoUrl = profileImage?.uri;
      
      if (isProfileChanged && profileImage) {
        try {
          let urlRes = await axios.get(`${API_URL}/image/url`, {
            params: { fileName: profileImage.fileName, fileType: profileImage.type }
          });
  
          const formData = new FormData();
          Object.entries(urlRes.data.fields).forEach(([field, value]) => {
            formData.append(field, value);
          });
          formData.append('acl', 'public-read');
          formData.append('file', {
            uri: profileImage.uri,
            type: profileImage.type,
            name: profileImage.fileName,
          });
  
          let res = await UnauthAxios().post(urlRes.data.url, formData, {
            headers: { 
              'Content-Type': 'multipart/form-data'
            },
            timeout: 10000 // 10 second timeout
          });
  
          profilePhotoUrl = urlRes.data.url + urlRes.data.fields.key;
        } catch (uploadError) {
          console.error('Error uploading to S3:', uploadError);
          if (uploadError.code === 'ECONNABORTED') {
            ToastAndroid.show('Upload timed out. Please try again.', ToastAndroid.SHORT);
          } else {
            ToastAndroid.show('Error uploading image. Please try again.', ToastAndroid.SHORT);
          }
          return;
        }
      }

      let res = await axios.put(`${API_URL}/user/update-profile`, { 
        name: info.name, 
        email: info.email, 
        profilePhoto: profilePhotoUrl 
      });

      setIsProfileChanged(false);
      ToastAndroid.show('Profile updated', ToastAndroid.SHORT);
      dispatch(updateProfile({
        userName: info.name,
        email: info.email,
        profilePhoto: profilePhotoUrl
      }));
      navigation.goBack();

    } catch (error) {
      console.error('Error updating profile:', error.response);
      ToastAndroid.show(error.response?.data?.message || 'Error updating profile', ToastAndroid.SHORT);
    }
  };

  return (
    <View style={styles.container}>
      <Header title='Edit Profile' navigation={navigation} />
      <ScrollView contentContainerStyle={{flexDirection:'column',marginTop:40}}>

     
      <View style={{flexDirection:'column', alignItems:'center', gap:12, marginBottom:24, paddingHorizontal:24,}}>
          <TouchableOpacity onPress={pickImage} style={{ width: 140,height: 140,borderRadius: 120,marginBottom: 20,backgroundColor:'#1c1c1e'}}>
              {profileImage?.uri && <Image source={{uri: profileImage.uri}} style={styles.profileImage} />}
          </TouchableOpacity>

            <View style={{flexDirection:'column', gap:4, width:'100%'}}>
                <CustomText fontType='primary' weight='Bold' style={{color:'#959595', fontSize:11,letterSpacing:-0.05,textTransform:'uppercase'}}>Name</CustomText>
                <TextInput
                  style={styles.input}
                  placeholder="Name"
                  placeholderTextColor="#808080"
                  value={info.name}
                  onChangeText={(text)=>setInfo({...info,name:text})}
                  />
            </View>

          <View style={{flexDirection:'column', gap:4, width:'100%'}}>
              <CustomText fontType='primary' weight='Bold' style={{color:'#454545', fontSize:11,letterSpacing:-0.05,textTransform:'uppercase'}}>Contact Number</CustomText>
              <TextInput
                style={{...styles.input, backgroundColor:'#101010',color:'#454545'}}
                placeholder="Contact Number"
                placeholderTextColor="#808080"
                editable={false}
                value={info.contactNumber}
                onChangeText={(text)=>setInfo({...info,contactNumber:text})}
                keyboardType="number-pad"
                />
          </View>

          <View style={{flexDirection:'column', gap:4, width:'100%'}}>
              <CustomText fontType='primary' weight='Bold' style={{color:'#959595', fontSize:11,letterSpacing:-0.05,textTransform:'uppercase'}}>Email</CustomText>
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#808080"
              value={info.email}
              onChangeText={(text)=>setInfo({...info,email:text})}
              keyboardType="email-address"
              />
              </View>
          </View>

          <View style={{paddingHorizontal:24,paddingVertical:24}}>
            <TouchableOpacity style={styles.button} onPress={handleSave}>
                <CustomText fontType='primary' weight='Bold' style={styles.buttonText}>Save Profile</CustomText>
            </TouchableOpacity>
          </View>
          </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    // alignItems: 'center',
    // justifyContent: 'space-between',
    // padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
  },
  profileImage: {
    width: 140,
    height: 140,
    borderRadius: 120,
    marginBottom: 20,
  },
  profileImagePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#808080',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  profileImagePlaceholderText: {
    color: '#fff',
  },
  input: {
    width: '100%',
    backgroundColor: '#1A1A1A',
    color: '#fff',
    padding: 12,
    borderRadius: 6,
    marginBottom: 12,
  },
  button: {
    backgroundColor: '#EDBF31',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    width: '100%',
  },
  buttonText: {
    color: '#000',
    fontSize: 12,
    textTransform:'uppercase',
    letterSpacing:0.05
  },
});
