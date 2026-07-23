import React, { useEffect, useState } from 'react';
import { View, Text, Button, TextInput, TouchableOpacity, StatusBar, KeyboardAvoidingView, Image, Switch, ToastAndroid, TouchableHighlight, ActivityIndicator, ScrollView, Platform, Alert, Modal, } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import { API_URL, BRAND_COLOR, SHOULD_VERIFY_VEHICLE } from '../../../utils/constants';
import CustomText from '../../../components/CustomText';
import Select from '../../../components/Select';
import axios from 'axios';
import { launchImageLibrary } from 'react-native-image-picker';
import MapView, { Circle, Marker } from 'react-native-maps';
import { getCurrentLocation, photoUrl, UnauthAxios } from '../../../utils/utils';
import LocationInvalidScreen from '../../homeScreens/LocationInvalidScreen';


// ToastAndroid is Android-only — calling it on iOS throws, which was killing
// every error path in this flow (including the brand/city fetch failures).
const notify = (message) => {
  if (!message) return;
  if (Platform.OS === 'android') ToastAndroid.show(message, ToastAndroid.SHORT);
  else Alert.alert('', message);
};

// The list endpoints normally return a bare array, but tolerate the wrapped
// shapes too so a picker never silently ends up empty.
const asList = (payload, ...keys) => {
  if (Array.isArray(payload)) return payload;
  for (const key of [...keys, 'data', 'rows']) {
    if (Array.isArray(payload?.[key])) return payload[key];
  }
  return [];
};

const apiError = (error, fallback) =>
  error?.response?.data?.error || error?.response?.data?.message || error?.message || fallback;

// Must match the filter values in CarsListingScreen — a mismatch means the
// car never shows up under "By Vehicle Type" / "By Fuel Type".
const VEHICLE_TYPES = [
  { id: 'hatchback', name: 'Hatchback' },
  { id: 'sedan', name: 'Sedan' },
  { id: 'compact-suv', name: 'Compact SUV' },
  { id: 'suv', name: 'SUV' },
  { id: 'luxury', name: 'Luxury' },
];
const FUEL_TYPES = [
  { id: 'petrol', name: 'Petrol' },
  { id: 'diesel', name: 'Diesel' },
  { id: 'electric', name: 'Electric' },
];
const TRANSMISSIONS = [
  { id: 'manual', name: 'Manual' },
  { id: 'automatic', name: 'Automatic' },
];
const SEAT_OPTIONS = [
  { id: '4', name: '4/5 Seater' },
  { id: '7', name: '7 Seater' },
  { id: '8', name: '8 Seater' },
];

const TOTAL_STEPS = 6;
const STEP_LABELS = {
  1: 'Step 1: Car Details',
  2: 'Step 2: Car Images',
  3: 'Step 3: Pickup Point',
  4: 'Step 4: Preferences',
  5: 'Step 5: Pricing',
  6: 'Step 6: Review & Host',
};

// Self-contained dropdown built on RN's Modal. The shared ActionSheet-based
// Select left this screen unresponsive once two of them were on one step, so
// step 1 uses this instead. Searchable — the brand list is 40+ entries.
const OptionPicker = ({ options, selectedId, onSelect, placeholder, searchable = true }) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const selected = options.find((o) => o.id === selectedId);
  const filtered = query
    ? options.filter((o) => String(o.name || '').toLowerCase().includes(query.toLowerCase()))
    : options;

  const close = () => {
    setOpen(false);
    setQuery('');
  };

  return (
    <View>
      <TouchableOpacity
        onPress={() => options.length && setOpen(true)}
        activeOpacity={0.7}
        style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',backgroundColor:'#1c1c1e',borderRadius:5,paddingVertical:12,paddingHorizontal:12}}
      >
        <CustomText fontType='primary' weight='Regular' style={{color: selected ? '#efefef' : '#959595', fontSize:14,flex:1}} numberOfLines={1}>
          {selected ? selected.name : placeholder}
        </CustomText>
        <Icon name='chevron-down' size={14} color='#959595' />
      </TouchableOpacity>

      <Modal visible={open} transparent animationType='slide' onRequestClose={close}>
        <TouchableOpacity activeOpacity={1} onPress={close} style={{flex:1,backgroundColor:'#000000aa',justifyContent:'flex-end'}}>
          <TouchableOpacity activeOpacity={1} onPress={() => {}} style={{backgroundColor:'#141416',borderTopLeftRadius:16,borderTopRightRadius:16,maxHeight:'70%',paddingBottom:24}}>
            <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingHorizontal:16,paddingVertical:14,borderBottomWidth:1,borderBottomColor:'#232326'}}>
              <CustomText fontType='primary' weight='Bold' style={{color:'#e3e3e3',fontSize:13,textTransform:'uppercase',letterSpacing:.5}}>{placeholder}</CustomText>
              <TouchableOpacity onPress={close} hitSlop={{top:10,bottom:10,left:10,right:10}}>
                <Icon name='close' size={20} color='#959595' />
              </TouchableOpacity>
            </View>

            {searchable && options.length > 8 ? (
              <TextInput
                placeholder='Search'
                placeholderTextColor='#757575'
                value={query}
                onChangeText={setQuery}
                autoCorrect={false}
                style={{backgroundColor:'#1c1c1e',color:'#fff',borderRadius:8,marginHorizontal:16,marginTop:12,paddingHorizontal:12,paddingVertical:9,fontSize:14}}
              />
            ) : null}

            <ScrollView style={{marginTop:8}} keyboardShouldPersistTaps='handled'>
              {filtered.length === 0 ? (
                <CustomText fontType='primary' weight='Regular' style={{color:'#757575',fontSize:13,padding:16,textAlign:'center'}}>No matches</CustomText>
              ) : (
                filtered.map((option) => (
                  <TouchableOpacity
                    key={option.id}
                    onPress={() => { onSelect(option); close(); }}
                    style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingHorizontal:16,paddingVertical:14,borderBottomWidth:1,borderBottomColor:'#1d1d1f'}}
                  >
                    <CustomText fontType='primary' weight={option.id === selectedId ? 'Bold' : 'Regular'} style={{color: option.id === selectedId ? BRAND_COLOR : '#e3e3e3',fontSize:14,flex:1}}>
                      {option.name}
                    </CustomText>
                    {option.id === selectedId ? <Icon name='checkmark' size={16} color={BRAND_COLOR} /> : null}
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

// Thin progress bar under the header so the host can see how far along they are.
const StepProgress = ({ step }) => (
  <View style={{flexDirection:'row',gap:4,paddingHorizontal:16,paddingBottom:10,backgroundColor:'#000'}}>
    {Array.from({ length: TOTAL_STEPS }, (_, i) => (
      <View key={i} style={{flex:1,height:3,borderRadius:2,backgroundColor: i < step ? BRAND_COLOR : '#2c2e2a'}} />
    ))}
  </View>
);

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
    vehicleYear: '',
    vehicleType: '',
    vehicleCc: '',
    vehicleFuelType: '',
    vehicleTransmission: 'manual',
    vehicleSeats: '4',
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

  // Functional update — the previous spread closed over a stale `data`, so two
  // handleChange calls in the same tick (e.g. city id + city name) lost one.
  const handleChange = (name, value) => {
    setData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const getCarInfo = async () => {
    try {
      console.log('vehicleId',vehicleId)
      if(vehicleId){
        const response = await axios.get(`${API_URL}/host/vehicles/${vehicleId}`)
        setCarInfo(response.data)
        // Prefill so going back to an earlier step shows the saved values.
        setData((prev) => ({
          ...prev,
          vehicleId,
          vehicleName: response.data.vehicleName || prev.vehicleName,
          model: response.data.model || prev.model,
          vehicleNumber: response.data.vehicleNumber || prev.vehicleNumber,
          brandId: response.data.vehicleBrand || prev.brandId,
          brandName: response.data.brand?.name || prev.brandName,
          vehicleYear: response.data.vehicleYear ? String(response.data.vehicleYear) : prev.vehicleYear,
          vehicleType: response.data.vehicleType || prev.vehicleType,
          vehicleCc: response.data.vehicleCc ? String(response.data.vehicleCc) : prev.vehicleCc,
          vehicleFuelType: response.data.vehicleFuelType || prev.vehicleFuelType,
          vehicleTransmission: response.data.vehicleTransmission || prev.vehicleTransmission,
          vehicleSeats: response.data.vehicleSeats ? String(response.data.vehicleSeats) : prev.vehicleSeats,
        }));
        // The wizard no longer writes per step, so there's no partial state to
        // jump into — an older draft restarts at step 1 with its saved values
        // prefilled and is completed by the single publish call.
      } 
      setLoading(false);
    } catch (error) {
      setLoading(false);
      console.error('Error fetching car details:', error.message)
      notify(apiError(error, 'Error fetching car details'));
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
      case 5:
        return <Step5 carDetails={data} handleChange={handleChange} handleNext={handleNext} />;
      case 6:
        return <Step6 carDetails={data} navigation={navigation} />;
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
                <CustomText fontType='primary' weight='Regular' style={{color:'#a3a3a3', fontSize:11,letterSpacing:.15}}>{STEP_LABELS[step]}</CustomText>
            </View>
            <View style={{flexDirection:'row',justifyContent:'flex-end',alignItems:'flex-end'}}>
              <TouchableOpacity onPress={handleBack} style={{ height:32,width:32,justifyContent:'center',alignItems:'center'}}>
                  {/* <Icon name={step === 1 ? 'close' : 'arrow-back'} size={16} color='#a3a3a3'/> */}
              </TouchableOpacity>
            </View>
          </View>
        </View>
        <StepProgress step={step} />
        <View style={{flex:1,paddingHorizontal:0,paddingVertical:0}}>
        {renderStep()}
        </View>
        </View> : <View style={{flex:1,justifyContent:'center',alignItems:'center',gap:12}}>
          <ActivityIndicator size='small' color={BRAND_COLOR} />
          <CustomText fontType='primary' weight='SemiBold' style={{color:'#757575', fontSize:11,textTransform:'uppercase',letterSpacing:.15}}>Loading...</CustomText>
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
    const [listError, setListError] = useState('');

    // Checks the registration number against the RC records (Cashfree).
    // SHOULD_VERIFY_VEHICLE is off for now, so Verify skips the API entirely
    // and just moves to the next step. When on, a failure still must not
    // dead-end the listing: we surface the reason and let the host continue.
    const handleVerify = async () => {
      if (!SHOULD_VERIFY_VEHICLE) {
        await handleSubmit();
        return;
      }
      try {
        setVerifying(true);
        setVerifyError('');
        setVerification(null);
        const response = await axios.post(`${API_URL}/host/vehicles/verify`, {
          vehicleNumber: carDetails.vehicleNumber,
        });
        setVerification(response.data);
      } catch (error) {
        const message = apiError(error, 'Could not verify this vehicle number');
        // A duplicate registration is a genuine stop — everything else is
        // treated as "verification unavailable" and skipped.
        if (/already exists/i.test(message)) {
          setVerifyError(message);
        } else {
          setVerification({ bypassed: true, verified: false, message });
        }
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

    // Brands and cities are public endpoints — fetched without the Authorization
    // header so a stale token can't take the pickers down, and with the error
    // surfaced (plus Retry) instead of only logged to the console.
    const loadOptions = async () => {
        setListError('');
        const client = UnauthAxios();
        const [brandRes, cityRes] = await Promise.allSettled([
            client.get(`${API_URL}/brand`),
            client.get(`${API_URL}/city`),
        ]);

        const failures = [];
        if (brandRes.status === 'fulfilled') {
            setBrands(asList(brandRes.value.data, 'brands'));
        } else {
            console.error('Error fetching brands:', apiError(brandRes.reason, ''));
            failures.push('brands');
        }
        if (cityRes.status === 'fulfilled') {
            setCities(asList(cityRes.value.data, 'cities'));
        } else {
            console.error('Error fetching cities:', apiError(cityRes.reason, ''));
            failures.push('cities');
        }
        if (failures.length) {
            setListError(`Couldn't load ${failures.join(' and ')}. Check your connection and retry.`);
        }
    };

    useEffect(() => {
        loadOptions();
    }, []);

    // Nothing is written until the review step — this just advances.
    const handleSubmit = async () => {
      handleNext();
    }
            
  return (<KeyboardAvoidingView style={{flex:1,flexDirection:'column',justifyContent:'space-between',paddingHorizontal:16,paddingVertical:24}}>
    <ScrollView style={{flex:1}} contentContainerStyle={{paddingBottom:16}} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps='handled'>

      <CustomText fontType='primary' weight='Bold' style={{color:'#e3e3e3', fontSize:18,letterSpacing:-.3}}>Tell us about your car</CustomText>
      <CustomText fontType='primary' weight='Regular' style={{color:'#757575', fontSize:12,marginTop:4}}>We'll check the registration before you continue.</CustomText>

      {listError ? (
        <View style={{marginTop:16,backgroundColor:'#2a1416',borderRadius:8,borderWidth:1,borderColor:'#5c2a2e',padding:12,flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:12}}>
          <CustomText fontType='primary' weight='Medium' style={{color:'#ff8f8f',fontSize:12,flex:1}}>{listError}</CustomText>
          <TouchableOpacity onPress={loadOptions} style={{backgroundColor:'#5c2a2e',borderRadius:5,paddingVertical:6,paddingHorizontal:12}}>
            <CustomText fontType='primary' weight='Bold' style={{color:'#ffd9d9',fontSize:11,textTransform:'uppercase'}}>Retry</CustomText>
          </TouchableOpacity>
        </View>
      ) : null}

      <View style={{marginTop:20}}>
        <CustomText fontType='primary' weight='SemiBold' style={{color:'#757575', fontSize:11,textTransform:'uppercase',letterSpacing:.15,marginBottom:4}}>Vehicle Brand</CustomText>
        <OptionPicker placeholder={brands.length ? 'Select Brand' : 'Loading brands…'} options={brands} selectedId={carDetails.brandId} onSelect={(option) => { handleChange('brandId', option.id); handleChange('brandName', option.name); }} />
      </View>

      <View style={{marginTop:20}}>
        <CustomText fontType='primary' weight='SemiBold' style={{color:'#757575', fontSize:11,textTransform:'uppercase',letterSpacing:.15,marginBottom:4}}>City</CustomText>
        <OptionPicker placeholder={cities.length ? 'Select City' : 'Loading cities…'} options={cities} selectedId={carDetails.cityId} onSelect={(option) => { handleChange('cityId', option.id); handleChange('cityName', option.name); }} />
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

      <View style={{flexDirection:'row',gap:12,marginTop:20}}>
        <View style={{flex:1}}>
          <CustomText fontType='primary' weight='SemiBold' style={{color:'#757575', fontSize:11,textTransform:'uppercase',letterSpacing:.15,marginBottom:4}}>Year</CustomText>
          <TextInput placeholder='e.g. 2021' keyboardType='number-pad' maxLength={4} style={{backgroundColor:'#1c1c1e',borderRadius:5,paddingVertical:9,paddingHorizontal:12,color:'#fff',fontSize:14}} value={carDetails.vehicleYear} onChangeText={(t) => handleChange('vehicleYear', t.replace(/[^0-9]/g, ''))} />
        </View>
        <View style={{flex:1}}>
          <CustomText fontType='primary' weight='SemiBold' style={{color:'#757575', fontSize:11,textTransform:'uppercase',letterSpacing:.15,marginBottom:4}}>Engine (CC)</CustomText>
          <TextInput placeholder='e.g. 1200' keyboardType='number-pad' maxLength={5} style={{backgroundColor:'#1c1c1e',borderRadius:5,paddingVertical:9,paddingHorizontal:12,color:'#fff',fontSize:14}} value={carDetails.vehicleCc} onChangeText={(t) => handleChange('vehicleCc', t.replace(/[^0-9]/g, ''))} />
        </View>
      </View>

      <View style={{marginTop:20}}>
        <CustomText fontType='primary' weight='SemiBold' style={{color:'#757575', fontSize:11,textTransform:'uppercase',letterSpacing:.15,marginBottom:4}}>Vehicle Type</CustomText>
        <OptionPicker placeholder='Select Type' options={VEHICLE_TYPES} selectedId={carDetails.vehicleType} onSelect={(o) => handleChange('vehicleType', o.id)} searchable={false} />
      </View>

      <View style={{marginTop:20}}>
        <CustomText fontType='primary' weight='SemiBold' style={{color:'#757575', fontSize:11,textTransform:'uppercase',letterSpacing:.15,marginBottom:4}}>Fuel Type</CustomText>
        <OptionPicker placeholder='Select Fuel' options={FUEL_TYPES} selectedId={carDetails.vehicleFuelType} onSelect={(o) => handleChange('vehicleFuelType', o.id)} searchable={false} />
      </View>

      <View style={{flexDirection:'row',gap:12,marginTop:20}}>
        <View style={{flex:1}}>
          <CustomText fontType='primary' weight='SemiBold' style={{color:'#757575', fontSize:11,textTransform:'uppercase',letterSpacing:.15,marginBottom:4}}>Transmission</CustomText>
          <OptionPicker placeholder='Select' options={TRANSMISSIONS} selectedId={carDetails.vehicleTransmission} onSelect={(o) => handleChange('vehicleTransmission', o.id)} searchable={false} />
        </View>
        <View style={{flex:1}}>
          <CustomText fontType='primary' weight='SemiBold' style={{color:'#757575', fontSize:11,textTransform:'uppercase',letterSpacing:.15,marginBottom:4}}>Seats</CustomText>
          <OptionPicker placeholder='Select' options={SEAT_OPTIONS} selectedId={carDetails.vehicleSeats} onSelect={(o) => handleChange('vehicleSeats', o.id)} searchable={false} />
        </View>
      </View>

      {verifyError ? (
        <View style={{marginTop:16,backgroundColor:'#2a1416',borderRadius:8,borderWidth:1,borderColor:'#5c2a2e',padding:12}}>
          <CustomText fontType='primary' weight='Medium' style={{color:'#ff8f8f',fontSize:12}}>{verifyError}</CustomText>
        </View>
      ) : null}

      {verification ? (
        <View style={{marginTop:16,backgroundColor:'#1c1c1e',borderRadius:8,borderWidth:1,borderColor:BRAND_COLOR,padding:14}}>
          <View style={{flexDirection:'row',alignItems:'center',gap:6,marginBottom:8}}>
            <Icon name={verification.bypassed ? 'information-circle' : 'checkmark-circle'} size={16} color={BRAND_COLOR} />
            <CustomText fontType='primary' weight='Bold' style={{color:BRAND_COLOR,fontSize:12,textTransform:'uppercase',letterSpacing:.15}}>
              {verification.bypassed ? 'Verification skipped' : 'Vehicle verified'}
            </CustomText>
          </View>

          {verification.bypassed ? (
            <CustomText fontType='primary' weight='Regular' style={{color:'#a3a3a3',fontSize:12,lineHeight:18}}>
              {verification.message || "RC verification isn't enabled yet, so these details weren't checked."} You can continue with your listing.
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
    </ScrollView>

    <View style={{flexDirection:'column',justifyContent:'space-between',width:'100%',marginTop:20}}>
      {!verification && !carDetails.vehicleId ? (
        (() => {
          const canVerify = !verifying && !submitLoading && !!carDetails.brandId && !!carDetails.cityId && !!carDetails.vehicleName && !!carDetails.vehicleNumber && !!carDetails.vehicleYear && !!carDetails.vehicleCc && !!carDetails.vehicleType && !!carDetails.vehicleFuelType;
          return (
            <TouchableOpacity disabled={!canVerify} onPress={handleVerify} style={{backgroundColor: canVerify ? BRAND_COLOR : '#959595',borderRadius:5,paddingVertical:12,paddingHorizontal:12}}>
              {verifying || submitLoading ? (
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
    // Photos go to object storage now so the review step can show them, but
    // they're only attached to a car when the listing is published.
    handleChange('images', uploadedImageUrls);
    handleNext();
    setSubmitLoading(false);
  } catch (error) {
    console.error('Error uploading images:', error.response ? error.response.data : error.message);
    notify(apiError(error, 'Error uploading images'));
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
      notify(apiError(error, 'Error validating location'));
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
      notify('Failed to detect location');
    }
  };

  const getCity = async () => {
    try {
      setLoading(true);
      const response = await UnauthAxios().get(`${API_URL}/city`);
      const list = asList(response.data, 'cities');
      setCities(list);
      // Default to the city picked in step 1 rather than always the first one.
      const city = list.find((c) => c.id === carDetails.cityId) || list[0];
      if (!city) {
        setLoading(false);
        notify("Couldn't load cities. Check your connection and try again.");
        return;
      }
      setSelectedCity(city);
      setRegion({
        latitude: parseFloat(city.lat),
        longitude: parseFloat(city.lng),
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      });
      setMarker({
        latitude: parseFloat(city.lat),
        longitude: parseFloat(city.lng),
      });
      setLoading(false);
    } catch (error) {
      setLoading(false);
      console.error('Error fetching city:', error);
      notify(apiError(error, 'Error fetching cities'));
    }
  }

  const handleSubmit = async () => {
    try {
      setSubmitLoading(true);
      // Held in state until the listing is published.
      handleChange('pickupPoint', {
        cityId: selectedCity.id,
        cityName: selectedCity.name,
        lat: marker.latitude,
        long: marker.longitude,
      });
      handleNext();
      setSubmitLoading(false);
    } catch (error) {
      setSubmitLoading(false);
      console.error('Error submitting pickup point:', error);
      notify(apiError(error, 'Error submitting pickup point'));
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
      handleChange('preferences', selectedPreferences);
      // Continue to pricing — skipping it left cars without a rate plan.
      handleNext();
      setSubmitLoading(false);
    } catch (error) {
      setSubmitLoading(false);
      console.error('Error submitting preferences:', error);
      notify(apiError(error, 'Error submitting preferences'));
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

const Step5 = ({ carDetails, handleChange, handleNext }) => {

  // Pricing is only collected here — it's saved from the review step, so the
  // host gets a last look before the car goes live.
  const handleSubmit = () => handleNext();
  const submitLoading = false;
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
        <CustomText fontType='primary' weight='Bold' style={{ color: '#000', fontSize: 12, textTransform: 'uppercase', letterSpacing: -0.15, textAlign: 'center' }}>Review Listing</CustomText>
      </TouchableOpacity>
    </View>
  </View>
};

// Final step: everything the host entered, in one place, then publish.
const Step6 = ({ carDetails, navigation }) => {
  const [submitLoading, setSubmitLoading] = useState(false);

  const prefs = carDetails.preferences || {};
  const enabledPrefs = [
    prefs.midnightBooking && 'Midnight booking',
    prefs.selfPickup && 'Self pickup',
    prefs.deliverAvailable && 'Delivery',
  ].filter(Boolean);

  const Row = ({ label, value }) => (
    <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'flex-start',paddingVertical:7,gap:16}}>
      <CustomText fontType='primary' weight='Regular' style={{color:'#757575',fontSize:12}}>{label}</CustomText>
      <CustomText fontType='primary' weight='Medium' style={{color:'#e3e3e3',fontSize:12,flexShrink:1,textAlign:'right'}}>{value || '—'}</CustomText>
    </View>
  );

  const Card = ({ title, children }) => (
    <View style={{backgroundColor:'#1c1c1e',borderRadius:10,padding:14,marginBottom:12}}>
      <CustomText fontType='primary' weight='Bold' style={{color:'#959595',fontSize:10,textTransform:'uppercase',letterSpacing:.5,marginBottom:6}}>{title}</CustomText>
      {children}
    </View>
  );

  const handlePublish = async () => {
    try {
      setSubmitLoading(true);
      // The one and only write: the whole listing in a single transaction.
      const response = await axios.post(`${API_URL}/host/vehicles/listing`, {
        vehicleId: carDetails.vehicleId || undefined,
        vehicleNumber: carDetails.vehicleNumber,
        brandId: carDetails.brandId,
        cityId: carDetails.cityId,
        vehicleName: carDetails.vehicleName,
        model: carDetails.model,
        vehicleYear: carDetails.vehicleYear,
        vehicleType: carDetails.vehicleType,
        vehicleCc: carDetails.vehicleCc,
        vehicleFuelType: carDetails.vehicleFuelType,
        vehicleTransmission: carDetails.vehicleTransmission,
        vehicleSeats: carDetails.vehicleSeats,
        images: carDetails.images,
        pickup: carDetails.pickupPoint,
        preferences: carDetails.preferences,
        vehiclePlan: {
          kmAlloted: carDetails.kmAlloted,
          extraKmFee: carDetails.perHourFee,
          weekdayFee: carDetails.weekdayPricing,
          weekendFee: carDetails.weekendPricing,
        },
      });
      setSubmitLoading(false);
      notify('Your car is listed');
      navigation.navigate('HostCarInfo', { vehicleId: response.data.id });
    } catch (error) {
      setSubmitLoading(false);
      console.error('Error publishing listing:', error.message);
      notify(apiError(error, 'Could not publish this listing'));
    }
  };

  return (
    <View style={{flex:1,justifyContent:'space-between',paddingHorizontal:16,paddingTop:16}}>
      <ScrollView style={{flex:1}} contentContainerStyle={{paddingBottom:16}} showsVerticalScrollIndicator={false}>
        <CustomText fontType='primary' weight='Bold' style={{color:'#e3e3e3',fontSize:18,letterSpacing:-.3}}>Review your listing</CustomText>
        <CustomText fontType='primary' weight='Regular' style={{color:'#757575',fontSize:12,marginTop:4,marginBottom:16}}>Go back to any step to change something.</CustomText>

        {carDetails.images?.length ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginBottom:12}}>
            {carDetails.images.map((image, index) => (
              <Image key={index} source={{uri: photoUrl(image.url)}} style={{width:140,height:96,borderRadius:8,marginRight:8}} />
            ))}
          </ScrollView>
        ) : null}

        <Card title='Car'>
          <Row label='Brand' value={carDetails.brandName} />
          <Row label='Name' value={carDetails.vehicleName} />
          <Row label='Model' value={carDetails.model} />
          <Row label='Registration' value={carDetails.vehicleNumber} />
          <Row label='Year' value={carDetails.vehicleYear} />
          <Row label='Type' value={VEHICLE_TYPES.find((t) => t.id === carDetails.vehicleType)?.name} />
          <Row label='Engine' value={carDetails.vehicleCc ? `${carDetails.vehicleCc} cc` : null} />
          <Row label='Fuel' value={FUEL_TYPES.find((f) => f.id === carDetails.vehicleFuelType)?.name} />
          <Row label='Transmission' value={TRANSMISSIONS.find((t) => t.id === carDetails.vehicleTransmission)?.name} />
          <Row label='Seats' value={SEAT_OPTIONS.find((o) => o.id === String(carDetails.vehicleSeats))?.name} />
        </Card>

        <Card title='Pickup'>
          <Row label='City' value={carDetails.pickupPoint?.cityName || carDetails.cityName} />
          <Row
            label='Location'
            value={carDetails.pickupPoint?.lat
              ? `${Number(carDetails.pickupPoint.lat).toFixed(5)}, ${Number(carDetails.pickupPoint.long).toFixed(5)}`
              : null}
          />
        </Card>

        <Card title='Preferences'>
          <Row label='Enabled' value={enabledPrefs.length ? enabledPrefs.join(', ') : 'None'} />
        </Card>

        <Card title='Pricing'>
          <Row label='Alloted KMs' value={carDetails.kmAlloted} />
          <Row label='Extra KM fee' value={carDetails.perHourFee ? `₹${carDetails.perHourFee}` : null} />
          <Row label='Weekday (per hour)' value={carDetails.weekdayPricing ? `₹${carDetails.weekdayPricing}` : null} />
          <Row label='Weekend (per hour)' value={carDetails.weekendPricing ? `₹${carDetails.weekendPricing}` : null} />
        </Card>
      </ScrollView>

      <TouchableOpacity disabled={submitLoading} onPress={handlePublish} style={{backgroundColor: submitLoading ? '#959595' : BRAND_COLOR,borderRadius:8,paddingVertical:16,paddingHorizontal:12,width:'100%',marginVertical:16}}>
        {submitLoading ? (
          <ActivityIndicator size='small' color='#000' />
        ) : (
          <CustomText fontType='primary' weight='Bold' style={{color:'#000',fontSize:12,textTransform:'uppercase',letterSpacing:-.15,textAlign:'center'}}>Host My Car</CustomText>
        )}
      </TouchableOpacity>
    </View>
  );
};



export default AddCar;
