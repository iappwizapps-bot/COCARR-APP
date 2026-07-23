import React, { useEffect, useState } from 'react';
import { View, Text, Button, TextInput, TouchableOpacity, StatusBar, KeyboardAvoidingView, Image, Switch, ToastAndroid, TouchableHighlight, ActivityIndicator, ScrollView, } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import { API_URL, BRAND_COLOR } from '../../../utils/constants';
import CustomText from '../../../components/CustomText';
import Select from '../../../components/Select';
import axios from 'axios';
import { launchImageLibrary } from 'react-native-image-picker';
import MapView, { Circle, Marker } from 'react-native-maps';
import { getCurrentLocation, UnauthAxios } from '../../../utils/utils';
import LocationInvalidScreen from '../../homeScreens/LocationInvalidScreen';


const AddCar = ({route}) => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const vehicleId = route.params?.vehicleId;
  const [step, setStep] = useState(1);
  const [data, setData] = useState({
    cityId: '',
    brandId: '',
    vehicleId: vehicleId ? vehicleId : '',
    vehicleName: '',
    model: '',
    vehicleNumber: '',
    images: [],
    pickupPoint: '',
    preferences: [],
    weekdayPricing: '',
    weekendPricing: '',
  });
  const [carInfo, setCarInfo] = useState({});

  const handleNext = () => {
    setStep(step + 1);
  };

  const handleBack = () => {
    if (step === 1) {
      navigation.goBack();
    } else {
      setStep(step - 1);
    }
  };

  const handleChange = (name, value) => {
    setData({
      ...data,
      [name]: value,
    });
  };

  const getCarInfo = async () => {
    try {
      console.log('vehicleId',vehicleId)
      if(vehicleId){
        const response = await axios.get(`${API_URL}/host/vehicles/${vehicleId}`)
        setCarInfo(response.data)
        console.log('res',response.data.isImagesUploaded)
        if(response.data.isImagesUploaded === undefined || response.data.isImagesUploaded === false){
          console.log('step 2')
          setStep(2)
        } else if(response.data.isPickupAdded === undefined || response.data.isPickupAdded === false){
          console.log('step 3')
          setStep(3)
        } else if(response.data.isPreferencesAdded === undefined || response.data.isPreferencesAdded === false){
          console.log('step 4')
          setStep(4)
        // } else if(response.data.isPricingAdded === undefined || response.data.isPricingAdded === false){
        //   console.log('step 5')
        //   setStep(5)
        }
      } 
      setLoading(false);
    } catch (error) {
      setLoading(false);
      console.error('Error fetching car details:', error.message)
      ToastAndroid.show('Error fetching car details', ToastAndroid.SHORT);
    }
  }
  useEffect(() => {
    getCarInfo()
  }, [])

  const renderStep = () => {
    switch (step) {
      case 1:
        return <Step1 carDetails={data} handleChange={handleChange} handleNext={handleNext} />;
      case 2:
        return <Step2 carDetails={data} handleChange={handleChange} handleNext={handleNext} />;
      case 3:
        return <Step3 carDetails={data} handleChange={handleChange} handleNext={handleNext} />;
      case 4:
        return <Step4 carDetails={data} handleChange={handleChange} handleNext={handleNext} navigation={navigation}/>;
      // case 5:
      //   return <Step5 carDetails={data} handleChange={handleChange} navigation={navigation} />;
      default:
        return null;
    }
  };
  


  return (
    <View style={{ flex: 1, backgroundColor:'#000' }}>
      {!loading ? <View style={{flex:1}}>
        <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center',paddingHorizontal:16,paddingVertical:12,backgroundColor:'#000',borderBottomWidth:1,borderBottomColor:'#101010'}}>
          <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'flex-start',width:'100%'}}>
            <TouchableOpacity onPress={handleBack} style={{ padding:8,borderRadius:100,backgroundColor:'#2c2e2a',width:32,height:32,justifyContent:'center',alignItems:'center'}}>
                <Icon name={step === 1 ? 'close' : 'arrow-back'} size={16} color='#a3a3a3'/>
            </TouchableOpacity>
            <View style={{flexDirection:'column',justifyContent:'center',alignItems:'center'}}>
                <CustomText fontType='primary' weight='SemiBold' style={{color:'#a3a3a3', fontSize:12,textTransform:'uppercase',letterSpacing:.15}}>Add Car</CustomText>
                <CustomText fontType='primary' weight='Regular' style={{color:'#a3a3a3', fontSize:11,letterSpacing:.15}}>{step === 1 ? 'Step 1: Enter Car Details' : step === 2 ? 'Step 2: Car Images' : step === 3 ? 'Step 3: Pickup Point' : step === 4 ? 'Step 4: Preferences' : 'Step 5: Pricing'}</CustomText>
            </View>
            <View style={{flexDirection:'row',justifyContent:'flex-end',alignItems:'flex-end'}}>
              <TouchableOpacity onPress={handleBack} style={{ height:32,width:32,justifyContent:'center',alignItems:'center'}}>
                  {/* <Icon name={step === 1 ? 'close' : 'arrow-back'} size={16} color='#a3a3a3'/> */}
              </TouchableOpacity>
            </View>
          </View>
        </View>
        <View style={{flex:1,paddingHorizontal:0,paddingVertical:0}}>
        {renderStep()}
        </View>
        </View> : <View>
          <CustomText fontType='primary' weight='SemiBold' style={{color:'#757575', fontSize:11,textTransform:'uppercase',letterSpacing:.15,marginBottom:4}}>Loading...</CustomText>
        </View>}
    </View>
  );
};



const Step1 = ({ carDetails, handleChange, handleNext }) => {
    const [brands, setBrands] = useState([]);
    const [cities, setCities] = useState([]);
    const [submitLoading, setSubmitLoading] = useState(false);
    const [verifying, setVerifying] = useState(false);
    const [verification, setVerification] = useState(null);
    const [verifyError, setVerifyError] = useState('');

    // Checks the registration number against the RC records (Cashfree) before
    // the car is created, so the host can confirm the owner/vehicle details
    // match what they typed. Continue stays disabled until this passes.
    const handleVerify = async () => {
      try {
        setVerifying(true);
        setVerifyError('');
        setVerification(null);
        const response = await axios.post(`${API_URL}/host/vehicles/verify`, {
          vehicleNumber: carDetails.vehicleNumber,
        });
        setVerification(response.data);
      } catch (error) {
        setVerifyError(error.response?.data?.error || 'Could not verify this vehicle number');
      } finally {
        setVerifying(false);
      }
    };

    const onNumberChange = (text) => {
      handleChange('vehicleNumber', text);
      // Any edit invalidates a previous verification.
      setVerification(null);
      setVerifyError('');
    };

    async function getBrands() {
        try {
            const response = await axios.get(API_URL+'/brand');
            setBrands(response.data);
        } catch (error) {
            console.error('Error fetching brands:', error);
            return [];
        }
    }
   
    async function getCities() {
        try {
            const response = await axios.get(API_URL+'/city');
            setCities(response.data);
        } catch (error) {
            console.error('Error fetching cities:', error);
            return [];
        }
    }

    useEffect(() => {
        getBrands();
        getCities();
    }, []);

    const handleSubmit = async () => {
      try
      {
        setSubmitLoading(true);
        if (carDetails.vehicleId) {
          // Came back to this step — update the existing car instead of
          // creating a second one (registration numbers are unique).
          await axios.put(`${API_URL}/host/vehicles/${carDetails.vehicleId}`, {
            type: 'info',
            vehicleName: carDetails.vehicleName,
            model: carDetails.model,
          });
        } else {
          const response = await axios.post(API_URL+'/host/vehicles', {step:1,vehicleNumber:carDetails.vehicleNumber,cityId:carDetails.cityId,brandId:carDetails.brandId,model:carDetails.model,vehicleName:carDetails.vehicleName});
          handleChange('vehicleId',response.data.id);
        }
        handleNext();
        setSubmitLoading(false);
      } catch (error) {
        setSubmitLoading(false);
        console.error('Error submitting car details:', error);
        ToastAndroid.show(error.response?.data?.error || 'Error submitting car details', ToastAndroid.SHORT);
      }
    }
            
  return (<KeyboardAvoidingView style={{flexDirection:'column',justifyContent:'space-between',height:'100%',paddingHorizontal:16,paddingVertical:24}}>
    <View>

      <View style={{marginTop:20}}>
        <CustomText fontType='primary' weight='SemiBold' style={{color:'#757575', fontSize:11,textTransform:'uppercase',letterSpacing:.15,marginBottom:4}}>Vehicle Brand</CustomText>
        <Select placeholder='Select Brand' options={brands} selected={brands.find((b) => b.id === carDetails.brandId)} onSelect={(option) => handleChange('brandId', option.id)} />
      </View>

      <View style={{flexDirection:'column',justifyContent:'space-between',width:'100%',marginTop:20}}>
        <CustomText fontType='primary' weight='SemiBold' style={{color:'#757575', fontSize:11,textTransform:'uppercase',letterSpacing:.15,marginBottom:4}}>Vehicle Name</CustomText>
        <TextInput placeholder='Enter model' style={{backgroundColor:'#1c1c1e',borderRadius:5,paddingVertical:9,paddingHorizontal:12,color:'#fff',fontSize:14}} value={carDetails.vehicleName} onChangeText={(text) => handleChange('vehicleName', text)} />
      </View>
      
      <View style={{flexDirection:'column',justifyContent:'space-between',width:'100%',marginTop:20}}>
        <CustomText fontType='primary' weight='SemiBold' style={{color:'#757575', fontSize:11,textTransform:'uppercase',letterSpacing:.15,marginBottom:4}}>Vehicle Number</CustomText>
        <TextInput placeholder='Enter vehicle number' autoCapitalize='characters' editable={!carDetails.vehicleId} style={{backgroundColor: carDetails.vehicleId ? '#101010' : '#1c1c1e',borderRadius:5,paddingVertical:9,paddingHorizontal:12,color: carDetails.vehicleId ? '#757575' : '#fff',fontSize:14}} value={carDetails.vehicleNumber} onChangeText={onNumberChange} />
        {carDetails.vehicleId ? (
          <CustomText fontType='primary' weight='Regular' style={{color:'#757575',fontSize:11,marginTop:4}}>
            Already verified — the registration number can't be changed now.
          </CustomText>
        ) : null}
      </View>

      {verifyError ? (
        <View style={{marginTop:16,backgroundColor:'#2a1416',borderRadius:8,borderWidth:1,borderColor:'#5c2a2e',padding:12}}>
          <CustomText fontType='primary' weight='Medium' style={{color:'#ff8f8f',fontSize:12}}>{verifyError}</CustomText>
        </View>
      ) : null}

      {verification ? (
        <View style={{marginTop:16,backgroundColor:'#1c1c1e',borderRadius:8,borderWidth:1,borderColor:BRAND_COLOR,padding:14}}>
          <View style={{flexDirection:'row',alignItems:'center',gap:6,marginBottom:8}}>
            <Icon name='checkmark-circle' size={16} color={BRAND_COLOR} />
            <CustomText fontType='primary' weight='Bold' style={{color:BRAND_COLOR,fontSize:12,textTransform:'uppercase',letterSpacing:.15}}>
              {verification.bypassed ? 'Verification skipped' : 'Vehicle verified'}
            </CustomText>
          </View>

          {verification.bypassed ? (
            <CustomText fontType='primary' weight='Regular' style={{color:'#a3a3a3',fontSize:12,lineHeight:18}}>
              RC verification isn't enabled yet, so these details weren't checked. You can continue.
            </CustomText>
          ) : (
            <View style={{gap:6}}>
              {[
                ['Owner', verification.ownerName],
                ['Registration', verification.vehicleNumber],
                ['Maker', verification.maker],
                ['Model', verification.model],
                ['Year', verification.manufacturingYear],
                ['Fuel', verification.fuelType],
                ['Seats', verification.seats],
                ['RC status', verification.rcStatus],
                ['Insurance upto', verification.insuranceUpto],
              ]
                .filter(([, value]) => value !== null && value !== undefined && value !== '')
                .map(([label, value]) => (
                  <View key={label} style={{flexDirection:'row',justifyContent:'space-between'}}>
                    <CustomText fontType='primary' weight='Regular' style={{color:'#757575',fontSize:12}}>{label}</CustomText>
                    <CustomText fontType='primary' weight='Medium' style={{color:'#e3e3e3',fontSize:12,flexShrink:1,textAlign:'right'}}>{String(value)}</CustomText>
                  </View>
                ))}
            </View>
          )}
        </View>
      ) : null}
    </View>

    <View style={{flexDirection:'column',justifyContent:'space-between',width:'100%',marginTop:20}}>
      {!verification && !carDetails.vehicleId ? (
        (() => {
          const canVerify = !verifying && !!carDetails.brandId && !!carDetails.vehicleName && !!carDetails.vehicleNumber;
          return (
            <TouchableOpacity disabled={!canVerify} onPress={handleVerify} style={{backgroundColor: canVerify ? BRAND_COLOR : '#959595',borderRadius:5,paddingVertical:12,paddingHorizontal:12}}>
              {verifying ? (
                <ActivityIndicator size='small' color='#000' />
              ) : (
                <CustomText fontType='primary' weight='Bold' style={{color:'#000', fontSize:12,textTransform:'uppercase',letterSpacing:-.15,textAlign:'center'}}>Verify</CustomText>
              )}
            </TouchableOpacity>
          );
        })()
      ) : (
        <TouchableOpacity disabled={submitLoading} onPress={handleSubmit} style={{backgroundColor: submitLoading ? '#959595' : BRAND_COLOR,borderRadius:5,paddingVertical:12,paddingHorizontal:12}}>
          {submitLoading ? (
            <ActivityIndicator size='small' color='#000' />
          ) : (
            <CustomText fontType='primary' weight='Bold' style={{color:'#000', fontSize:12,textTransform:'uppercase',letterSpacing:-.15,textAlign:'center'}}>Continue</CustomText>
          )}
        </TouchableOpacity>
      )}
    </View>
  </KeyboardAvoidingView>)
}



const Step2 = ({ carDetails, handleChange, handleNext }) => {
  const [images, setImages] = useState([]);
  const [submitLoading, setSubmitLoading] = useState(false);
  const MAX_IMAGES = 5;

  // Adds to the existing selection (previously this replaced it, so picking a
  // second time wiped the earlier photos) and respects the 5-photo limit.
  const selectImages = () => {
    const remaining = MAX_IMAGES - images.length;
    if (remaining <= 0) return;
    launchImageLibrary({ mediaType: 'photo', selectionLimit: remaining }, (response) => {
      if (response.didCancel) {
        console.log('User cancelled image picker');
      } else if (response.errorCode) {
        console.log('ImagePicker Error: ', response.errorMessage);
      } else {
        const picked = (response.assets || []).slice(0, remaining).map((asset) => ({
          ...asset,
          isCover: false,
        }));
        setImages((prev) => {
          const merged = [...prev, ...picked].slice(0, MAX_IMAGES);
          // Always keep exactly one cover.
          return merged.some((i) => i.isCover)
            ? merged
            : merged.map((im, i) => ({ ...im, isCover: i === 0 }));
        });
      }
    });
  };
const uploadImages = async () => {
  try {
    setSubmitLoading(true);
    const uploadPromises = images.map(async (image) => {
      let urlRes = await axios.get(`${API_URL}/image/url`, {
        params: { fileName: image.fileName, fileType: image.type }
      });

      const formData = new FormData();
      Object.entries(urlRes.data.fields).forEach(([field, value]) => {
        formData.append(field, value);
      });
      formData.append('acl', 'public-read');
      formData.append('file', {
        uri: image.uri,
        type: image.type,
        name: image.fileName,
      });

      let res = await UnauthAxios().post(urlRes.data.url, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      return {
        url: urlRes.data.url + urlRes.data.fields.key,
        isCover: image.isCover
      };
    });

    const uploadedImageUrls = await Promise.all(uploadPromises);
    handleChange('images', uploadedImageUrls);

    // Pass the array of URLs with isCover to the /host/vehicles endpoint
    await axios.post(`${API_URL}/host/vehicles`, {
      images: uploadedImageUrls,
      step: 2,
      vehicleId: carDetails.vehicleId
    });
    handleNext();
    setSubmitLoading(false);
  } catch (error) {
    console.error('Error uploading images:', error.response ? error.response.data : error.message);
    ToastAndroid.show('Error uploading images', ToastAndroid.SHORT);
    setSubmitLoading(false);
  }
};

  const handleRemoveImage = (index) => {
    const newImages = [...images];
    newImages.splice(index, 1);
    // If the cover was removed, promote the first remaining photo.
    setImages(
      newImages.some((i) => i.isCover)
        ? newImages
        : newImages.map((im, i) => ({ ...im, isCover: i === 0 }))
    );
  };

  const setImageAsCover = (index) => {
    const newImages = images.map((image, i) => ({
      ...image,
      isCover: i === index
    }));
    setImages(newImages);
  };

  return (
    <View style={{flexDirection:'column',justifyContent:'space-between',height:'100%',paddingHorizontal:16,paddingVertical:16}}>
      <View>
        <CustomText fontType='primary' weight='SemiBold' style={{color:'#757575', fontSize:11,textTransform:'uppercase',letterSpacing:.15,marginBottom:4}}>Car Images (Max 5)</CustomText>
        <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center',width:'100%',marginTop:12,flexWrap:'wrap',gap:12}}>
          {
            images.map((image,index) => (
              <TouchableOpacity key={index} style={{backgroundColor:'#1c1c1e',borderRadius:5,paddingVertical:0,paddingHorizontal:0,color:'#fff',fontSize:14,width:'48%',height:100,justifyContent:'center',alignItems:'center'}}>
                <TouchableOpacity onPress={() => handleRemoveImage(index)} style={{position:'absolute',top:4,right:4,backgroundColor:'#1c1c1e',borderRadius:100,padding:6,zIndex:100}}>
                  <Icon name='trash-outline' size={18} color='#fff'/>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setImageAsCover(index)} style={{position:'absolute',top:4,left:4,backgroundColor:BRAND_COLOR,borderRadius:4,padding:6,paddingHorizontal:12,zIndex:100}}>
                  <CustomText fontType='primary' weight='Bold' style={{color:'#000', fontSize:9,textTransform:'uppercase',letterSpacing:-.15,textAlign:'center'}}>{image.isCover ? 'Cover' : 'Set as Cover'}</CustomText>
                </TouchableOpacity>
                <Image source={{uri:image.uri}} style={{width:'100%',height:'100%',borderRadius:5}}/>
              </TouchableOpacity>
            ))
          }
          {images.length < 5 && <TouchableOpacity onPress={selectImages} style={{backgroundColor:'#1c1c1e',borderRadius:5,paddingVertical:12,paddingHorizontal:12,color:'#fff',fontSize:14,width:'48%',height:100,justifyContent:'center',alignItems:'center'}}>
            <Icon name='add-circle-outline' size={24} color='#959595'/>
            <CustomText fontType='primary' weight='SemiBold' style={{color:'#959595', fontSize:11,textTransform:'uppercase',letterSpacing:-.15,textAlign:'center'}}>Select Images</CustomText>
          </TouchableOpacity>}
        </View>
        
      </View>
      <TouchableOpacity disabled={submitLoading || images.length === 0} onPress={uploadImages} style={{backgroundColor: (submitLoading || images.length === 0) ? '#959595' : BRAND_COLOR,borderRadius:5,paddingVertical:12,paddingHorizontal:12,color:'#fff',fontSize:14,width:'100%',marginTop:20}}>
        <CustomText fontType='primary' weight='Bold' style={{color:'#000', fontSize:12,textTransform:'uppercase',letterSpacing:-.15,textAlign:'center'}}>Upload Images</CustomText>
      </TouchableOpacity>
    </View>
  );
};




const Step3 = ({ carDetails, handleChange, handleNext }) => {
  const [region, setRegion] = useState({
    latitude: 37.78825,
    longitude: -122.4324,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  const [submitLoading, setSubmitLoading] = useState(false);
  const [marker, setMarker] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedCity, setSelectedCity] = useState(null);
  const [cities, setCities] = useState([]);
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [showLocationValid, setShowLocationValid] = useState(false);

  const handleMapPress = async (e) => {
    const coordinate = e.nativeEvent.coordinate;
    setMarker(coordinate);
    await validateLocation(coordinate.latitude, coordinate.longitude);
  };

  const handleMarkerDrag = async (e) => {
    const coordinate = e.nativeEvent.coordinate;
    setMarker(coordinate);
    await validateLocation(coordinate.latitude, coordinate.longitude);
  };

  const validateLocation = async (lat, lng) => {
    try {
      const response = await axios.post(`${API_URL}/utility/validate-geo?lat=${lat}&lng=${lng}&cityId=${selectedCity.id}`);
      const { city, isCityChanged, isPlaceValid } = response.data;

      console.log('isCityChanged', isCityChanged)
      console.log('isPlaceValid', isPlaceValid)
      console.log('city', city)
      if (isCityChanged) {
        setSelectedCity(city);
        handleChange('cityId',city.id);
      } else if (!isPlaceValid) {
        setShowLocationValid(true);
        setMarker({
          latitude: parseFloat(selectedCity.lat),
          longitude: parseFloat(selectedCity.lng)
        });
      }
    } catch (error) {
      console.log('Error validating location:', error);
      ToastAndroid.show('Error validating location', ToastAndroid.SHORT);
    }
  };

  const detectUserLocation = async () => {
    try {
      setDetectingLocation(true);
      const location = await getCurrentLocation();
      
      setRegion({
        ...region,
        latitude: location.latitude,
        longitude: location.longitude
      });
      
      setMarker({
        latitude: location.latitude,
        longitude: location.longitude
      });

      await validateLocation(location.latitude, location.longitude);
      setDetectingLocation(false);
    } catch (error) {
      console.log(error);
      setDetectingLocation(false);
      ToastAndroid.show('Failed to detect location', ToastAndroid.SHORT);
    }
  };

  const getCity = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/city`);
      setCities(response.data);
      setSelectedCity(response.data[0]);
      setRegion({
        latitude: parseFloat(response.data[0].lat),
        longitude: parseFloat(response.data[0].lng),
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      });
      setMarker({
        latitude: parseFloat(response.data[0].lat),
        longitude: parseFloat(response.data[0].lng),
      });
      setLoading(false);
    } catch (error) {
      setLoading(false);
      console.error('Error fetching city:', error);
    }
  }

  const handleSubmit = async () => {
    try {
      setSubmitLoading(true);
      const response = await axios.post(`${API_URL}/host/vehicles`, {step:3,vehicleId:carDetails.vehicleId,cityId:selectedCity.id,lat:marker.latitude,long:marker.longitude});
      handleNext();
      setSubmitLoading(false);
    } catch (error) {
      setSubmitLoading(false);
      console.error('Error submitting pickup point:', error);
      ToastAndroid.show('Error submitting pickup point', ToastAndroid.SHORT);
    }
  }

  const handleCityChange = (option) => {
    handleChange('cityId',option.id);
    setSelectedCity(option);
    setRegion({
      latitude: parseFloat(option.lat),
      longitude: parseFloat(option.lng),
      latitudeDelta: 0.0922,
      longitudeDelta: 0.0421,
    });
    setMarker({
      latitude: parseFloat(option.lat),
      longitude: parseFloat(option.lng),
    });
  }

  useEffect(() => {
    getCity();
  }, []);

  useEffect(() => {
    console.log('selectedCity', selectedCity)
  }, [selectedCity])

  return (
    <View style={{ flex: 1 }}>
      {!loading ? <View style={{flex:1}}>
        <View style={{flex:1}}>
          <MapView
            style={{ flex: 1}}
            region={region}
            showsMyLocationButton={true}
            showsUserLocation={false}
            showsCompass={true}
            showsScale={true}
            onPress={handleMapPress}
          >
            {marker && (
              <Marker
                coordinate={marker}
                pinColor={carDetails.cityColor}
                draggable={true}
                onDragEnd={handleMarkerDrag}
              />
            )}
            <Circle
              center={region}
              radius={10000}
              fillColor="#E3BF3135"
              strokeColor="#E3BF31"
              strokeWidth={1}
            />
          </MapView>
        </View>

        <View style={{paddingVertical:0,paddingHorizontal:0,color:'#000',fontSize:14,flexDirection:'column',position:'absolute',top:0,left:'0%',right:'0%',borderRadius:0,opacity:0.98,overflow:'hidden'}}>
          <View style={{flexDirection:'row',alignItems:'center',gap:8,}}>
            <View style={{flex:1}}>
              <Select placeholder='Select City' options={cities} selected={selectedCity} label='name' onSelect={(option) => handleCityChange(option)} containerStyle={{paddingVertical:6,paddingHorizontal:0,borderRadius:0}} />
            </View>
          </View>
        </View>

        <View style={{position:'absolute',top:68,right:'4%',shadowColor:'#000',shadowOffset:{width:0,height:0},shadowOpacity:0.25,shadowRadius:4,elevation:6}}>
          <TouchableHighlight disabled={detectingLocation} underlayColor='#2f2f2f' onPress={detectUserLocation} style={{flexDirection:'row',alignItems:'center',justifyContent:'center',backgroundColor:'#2d2d2d',borderRadius:12,padding:2,shadowOpacity:0.5,shadowRadius:1,shadowColor:'#454545',height:48,width:48}}>
              <Icon name="locate-outline" size={20} color={BRAND_COLOR} />
            </TouchableHighlight>
        </View>

        <TouchableOpacity disabled={submitLoading || !selectedCity} onPress={handleSubmit} style={{backgroundColor: (submitLoading || !selectedCity) ? '#959595' : '#151515',borderRadius:8,paddingVertical:16,paddingHorizontal:16,color:'#fff',fontSize:14,width:'96%',marginTop:20,position:'absolute',bottom:12,left:'2%',shadowColor:'#000',shadowOffset:{width:0,height:0},shadowOpacity:0.25,shadowRadius:4,elevation:6}}>
          <CustomText fontType='primary' weight='Bold' style={{color:BRAND_COLOR, fontSize:12,textTransform:'uppercase',letterSpacing:-.15,textAlign:'center'}}>Continue</CustomText>
        </TouchableOpacity>

      </View> : <View>
        <CustomText fontType='primary' weight='SemiBold' style={{color:'#757575', fontSize:11,textTransform:'uppercase',letterSpacing:.15,marginBottom:4}}>Loading...</CustomText>
      </View>}

      {showLocationValid && <LocationInvalidScreen show={showLocationValid} setShow={setShowLocationValid} onPress={()=>{
        setShowLocationValid(false)
      }}/>}
    </View>
  );
};

const Step4 = ({ carDetails, handleChange, handleNext,navigation }) => {
  const preferences = [
    { value: 'midnightBooking', name: 'Allow Midnight Booking',description:'Allow booking from 12am to 6am for this car to allow pickup at night' },
    { value: 'selfPickup', name: 'Allow Self Pickup',description:'Allow self pickup by the customer from the pickup point' },
    { value: 'deliverAvailable', name: 'Delivery Available',description:'Allow delivery of the car to the customer' },
  ];

  const [selectedPreferences, setSelectedPreferences] = useState({});
  const [submitLoading, setSubmitLoading] = useState(false);

  const togglePreference = (id) => {
    setSelectedPreferences((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleSubmit = async () => {
    try {
      setSubmitLoading(true);
      const response = await axios.post(`${API_URL}/host/vehicles`, {step:4,vehicleId:carDetails.vehicleId,preferences:selectedPreferences});
      navigation.navigate('HostCarInfo', {vehicleId:carDetails.vehicleId});
      setSubmitLoading(false);
    } catch (error) {
      setSubmitLoading(false);
      console.error('Error submitting preferences:', error);
      ToastAndroid.show('Error submitting preferences', ToastAndroid.SHORT);
    }
  }

  return (
    <View style={{ padding: 16,flex:1,justifyContent:'space-between' }}>
      <View>

      {preferences.map((preference) => (
        <View key={preference.id} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical:16 ,borderBottomWidth:1,borderBottomColor:'#1c1c1e',width:'100%'}}>
          <View style={{flexDirection:'column',justifyContent:'center',alignItems:'flex-start',flex:1}}>
            <CustomText fontType='primary' weight='Medium' style={{color:'#e3e3e3', fontSize:14,letterSpacing:.15,marginBottom:2}}>{preference.name}</CustomText>
            <CustomText fontType='primary' weight='Regular' style={{color:'#757575', fontSize:12,letterSpacing:.15}}>{preference.description}</CustomText>
          </View>
          <View style={{flexDirection:'column',justifyContent:'center',alignItems:'flex-end',paddingLeft:16}}>
            <Switch
              key={preference.value}
              value={!!selectedPreferences[preference.value]}
              style={{height:40}}
              shouldRasterizeIOS={true}
              thumbColor={!!selectedPreferences[preference.value] ? BRAND_COLOR : '#fff'}
              trackColor={{ true: '#EDBF3155', false: '#454545' }}
              onValueChange={() => togglePreference(preference.value)}
              />
          </View>
        </View>
      ))}
      </View>
      <TouchableOpacity disabled={submitLoading} onPress={handleSubmit} style={{ backgroundColor: (submitLoading) ? '#959595' : BRAND_COLOR, borderRadius: 8, paddingVertical: 16, paddingHorizontal: 12, color: '#fff', fontSize: 14, width: '100%', marginTop: 20 }}>
        <CustomText fontType='primary' weight='Bold' style={{ color: '#000', fontSize: 12, textTransform: 'uppercase', letterSpacing: -0.15, textAlign: 'center' }}>Continue</CustomText>
      </TouchableOpacity>
    </View>
  );
};

const Step5 = ({ carDetails, handleChange,navigation }) => {

  const [submitLoading, setSubmitLoading] = useState(false);
  const handleSubmit = async () => {
    try {
      setSubmitLoading(true);
      const response = await axios.post(`${API_URL}/host/vehicles`, {step:5,vehicleId:carDetails.vehicleId,vehiclePlan:  {weekdayPricing:carDetails.weekdayPricing,weekendPricing:carDetails.weekendPricing,kmAlloted:carDetails.kmAlloted,perHourFee:carDetails.perHourFee}});
      navigation.navigate('HostCarInfo', {vehicleId:carDetails.vehicleId});
      setSubmitLoading(false);
    } catch (error) {
      setSubmitLoading(false);
      console.error('Error submitting pricing:', error.message);
      ToastAndroid.show('Error submitting pricing', ToastAndroid.SHORT);
    }
  }
  return <View style={{ padding: 16, flex: 1, justifyContent: 'space-between' }}>
    <View style={{flex:1,justifyContent:'space-between'}}>
    <View>
      <CustomText fontType='primary' weight='Bold' style={{ color: '#959595', fontSize: 11, letterSpacing: .15, marginBottom: 4,textTransform:'uppercase'}}>Alloted KMs</CustomText>
      <TextInput
        style={{ backgroundColor: '#1c1c1e', color: '#e3e3e3', padding: 10, borderRadius: 8, marginBottom: 16 }}
        placeholder="Enter alloted km"
        placeholderTextColor="#757575"
        keyboardType="numeric"
        value={carDetails.kmAlloted}
        onChangeText={(value) => {
          const numericValue = value.replace(/[^0-9]/g, '');
          handleChange('kmAlloted', numericValue);
        }}
      />
      <CustomText fontType='primary' weight='Bold' style={{ color: '#959595', fontSize: 11, letterSpacing: .15, marginBottom: 4,textTransform:'uppercase'}}>Extra KM Pricing</CustomText>
      <TextInput
        style={{ backgroundColor: '#1c1c1e', color: '#e3e3e3', padding: 10, borderRadius: 8, marginBottom: 16 }}
        placeholder="Enter extra km pricing"
        placeholderTextColor="#757575"
        keyboardType="numeric"
        value={carDetails.perHourFee}
        onChangeText={(value) => {
          const numericValue = value.replace(/[^0-9]/g, '');
          handleChange('perHourFee', numericValue);
        }}
      />
      <CustomText fontType='primary' weight='Bold' style={{ color: '#959595', fontSize: 11, letterSpacing: .15, marginBottom: 4,textTransform:'uppercase'}}>Weekday Pricing (per hour)</CustomText>
      <TextInput
        style={{ backgroundColor: '#1c1c1e', color: '#e3e3e3', padding: 10, borderRadius: 8, marginBottom: 16 }}
        placeholder="Enter weekday pricing"
        placeholderTextColor="#757575"
        keyboardType="numeric"
        value={carDetails.weekdayPricing}
        onChangeText={(value) => {
          const numericValue = value.replace(/[^0-9]/g, '');
          handleChange('weekdayPricing', numericValue);
        }}
      />
      <CustomText fontType='primary' weight='Bold' style={{ color: '#959595', fontSize: 11, letterSpacing: .15, marginBottom: 4,textTransform:'uppercase'}}>Weekend Pricing (per hour)</CustomText>
      <TextInput
        style={{ backgroundColor: '#1c1c1e', color: '#e3e3e3', padding: 10, borderRadius: 8, marginBottom: 16 }}
        placeholder="Enter weekend pricing"
        placeholderTextColor="#757575"
        keyboardType="numeric"
        value={carDetails.weekendPricing}
        onChangeText={(value) => {
          const numericValue = value.replace(/[^0-9]/g, '');
          handleChange('weekendPricing', numericValue);
        }}
      />
      </View>
      <TouchableOpacity disabled={submitLoading || !carDetails.kmAlloted || !carDetails.perHourFee || !carDetails.weekdayPricing || !carDetails.weekendPricing} onPress={handleSubmit} style={{ backgroundColor: (submitLoading || !carDetails.kmAlloted || !carDetails.perHourFee || !carDetails.weekdayPricing || !carDetails.weekendPricing) ? '#959595' : BRAND_COLOR, borderRadius: 8, paddingVertical: 16, paddingHorizontal: 12, color: '#fff', fontSize: 14, width: '100%', marginTop: 20 }}>
        <CustomText fontType='primary' weight='Bold' style={{ color: '#000', fontSize: 12, textTransform: 'uppercase', letterSpacing: -0.15, textAlign: 'center' }}>Add Vehicle Now</CustomText>
      </TouchableOpacity>
    </View>
  </View>
};



export default AddCar;
