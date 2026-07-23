import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Image, Switch, ToastAndroid, TouchableHighlight, ActivityIndicator, ScrollView, Platform, Alert, Modal, } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import { API_URL, BRAND_COLOR } from '../../../utils/constants';
import CustomText from '../../../components/CustomText';
import Select from '../../../components/Select';
import axios from 'axios';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import MapView, { Circle, Marker } from 'react-native-maps';
import { getCurrentLocation, photoUrl, UnauthAxios } from '../../../utils/utils';
import LocationInvalidScreen from '../../homeScreens/LocationInvalidScreen';

// The whole listing journey is now "vehicle onboarding": scan the RC card,
// confirm the details, add photos, set location, preferences and pricing, then
// review and publish. Nothing is written to the DB until the final publish.

// ToastAndroid is Android-only — calling it on iOS throws.
const notify = (message) => {
  if (!message) return;
  if (Platform.OS === 'android') ToastAndroid.show(message, ToastAndroid.SHORT);
  else Alert.alert('', message);
};

// The list endpoints normally return a bare array, but tolerate wrapped shapes.
const asList = (payload, ...keys) => {
  if (Array.isArray(payload)) return payload;
  for (const key of [...keys, 'data', 'rows']) {
    if (Array.isArray(payload?.[key])) return payload[key];
  }
  return [];
};

const apiError = (error, fallback) =>
  error?.response?.data?.error || error?.response?.data?.message || error?.message || fallback;

// Must match the filter values in CarsListingScreen — a mismatch means the car
// never shows up under "By Vehicle Type" / "By Fuel Type".
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

// Labeled photo slots — `type` matches the Image model's enum.
const IMAGE_SLOTS = [
  { type: 'front', label: 'Front' },
  { type: 'back', label: 'Rear' },
  { type: 'driverSide', label: 'Driver Side' },
  { type: 'passengerSide', label: 'Passenger Side' },
  { type: 'other', label: 'Interior' },
];

const LOCATION_RADIUS_M = 30000; // 30km booking radius around the pickup point.

const TOTAL_STEPS = 7;
const STEP_LABELS = {
  1: 'Step 1: Vehicle RC',
  2: 'Step 2: Vehicle Details',
  3: 'Step 3: Photos',
  4: 'Step 4: Location',
  5: 'Step 5: Preferences',
  6: 'Step 6: Pricing',
  7: 'Step 7: Review & Host',
};

// Which detail fields are locked (pre-filled from the RC and not editable).
const lockedFromRc = (payload) => {
  const specs = payload?.specs || {};
  const locked = {};
  const mark = (key, value) => { if (value !== null && value !== undefined && value !== '') locked[key] = true; };
  mark('vehicleNumber', payload?.vehicleNumber);
  mark('ownerName', payload?.ownerName);
  mark('model', payload?.model);
  mark('vehicleYear', specs.vehicleYear);
  mark('vehicleType', specs.vehicleType);
  mark('vehicleCc', specs.vehicleCc);
  mark('vehicleFuelType', specs.vehicleFuelType);
  mark('vehicleTransmission', specs.vehicleTransmission);
  mark('vehicleSeats', specs.vehicleSeats);
  mark('engineNumber', payload?.engineNumber);
  mark('chassisNumber', payload?.chassisNumber);
  return locked;
};

// Self-contained dropdown built on RN's Modal (the shared ActionSheet Select
// left this screen unresponsive when two were on one step). Searchable.
const OptionPicker = ({ options, selectedId, onSelect, placeholder, searchable = true, disabled = false }) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const selected = options.find((o) => o.id === selectedId);
  const filtered = query
    ? options.filter((o) => String(o.name || '').toLowerCase().includes(query.toLowerCase()))
    : options;

  const close = () => { setOpen(false); setQuery(''); };

  return (
    <View>
      <TouchableOpacity
        onPress={() => !disabled && options.length && setOpen(true)}
        activeOpacity={disabled ? 1 : 0.7}
        style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',backgroundColor: disabled ? '#101010' : '#1c1c1e',borderRadius:5,paddingVertical:12,paddingHorizontal:12}}
      >
        <CustomText fontType='primary' weight='Regular' style={{color: selected ? (disabled ? '#c9c9c9' : '#efefef') : '#959595', fontSize:14,flex:1}} numberOfLines={1}>
          {selected ? selected.name : placeholder}
        </CustomText>
        {!disabled ? <Icon name='chevron-down' size={14} color='#959595' /> : <Icon name='lock-closed' size={12} color='#757575' />}
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

// A labelled field that is read-only when the value came from the RC, and an
// editable text input otherwise.
const DetailField = ({ label, value, locked, onChange, placeholder, keyboardType }) => (
  <View style={{marginTop:18}}>
    <View style={{flexDirection:'row',alignItems:'center',gap:5,marginBottom:4}}>
      <CustomText fontType='primary' weight='SemiBold' style={{color:'#757575', fontSize:11,textTransform:'uppercase',letterSpacing:.15}}>{label}</CustomText>
      {locked ? <Icon name='lock-closed' size={10} color='#757575' /> : null}
    </View>
    {locked ? (
      <View style={{backgroundColor:'#101010',borderRadius:5,paddingVertical:11,paddingHorizontal:12}}>
        <CustomText fontType='primary' weight='Medium' style={{color:'#c9c9c9',fontSize:14}} numberOfLines={1}>{value || '—'}</CustomText>
      </View>
    ) : (
      <TextInput
        placeholder={placeholder}
        placeholderTextColor='#757575'
        keyboardType={keyboardType}
        value={value}
        onChangeText={onChange}
        style={{backgroundColor:'#1c1c1e',borderRadius:5,paddingVertical:9,paddingHorizontal:12,color:'#fff',fontSize:14}}
      />
    )}
  </View>
);

// Thin progress bar under the header.
const StepProgress = ({ step }) => (
  <View style={{flexDirection:'row',gap:4,paddingHorizontal:16,paddingBottom:10,backgroundColor:'#000'}}>
    {Array.from({ length: TOTAL_STEPS }, (_, i) => (
      <View key={i} style={{flex:1,height:3,borderRadius:2,backgroundColor: i < step ? BRAND_COLOR : '#2c2e2a'}} />
    ))}
  </View>
);

const AddCar = ({ route }) => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const vehicleId = route.params?.vehicleId;
  const [step, setStep] = useState(1);
  const [data, setData] = useState({
    cityId: '',
    cityName: '',
    brandId: '',
    brandName: '',
    vehicleId: vehicleId ? vehicleId : '',
    vehicleName: '',
    model: '',
    vehicleNumber: '',
    ownerName: '',
    vehicleYear: '',
    vehicleType: '',
    vehicleCc: '',
    vehicleFuelType: '',
    vehicleTransmission: 'manual',
    vehicleSeats: '4',
    engineNumber: '',
    chassisNumber: '',
    rcImageUrl: null,
    locked: {},
    images: [],
    pickupPoint: '',
    preferences: {},
    kmAlloted: '',
    perHourFee: '',
    weekdayPricing: '',
    weekendPricing: '',
  });

  const handleNext = () => setStep((s) => Math.min(TOTAL_STEPS, s + 1));
  const handleBack = () => {
    if (step === 1) navigation.goBack();
    else setStep((s) => s - 1);
  };

  // Functional update — two calls in one tick must not clobber each other.
  const handleChange = (name, value) => setData((prev) => ({ ...prev, [name]: value }));

  // Applies the RC OCR / lookup payload to the wizard state.
  const applyRcPayload = (payload) => {
    const specs = payload.specs || {};
    setData((prev) => ({
      ...prev,
      vehicleNumber: payload.vehicleNumber || prev.vehicleNumber,
      ownerName: payload.ownerName || prev.ownerName,
      model: payload.model || prev.model,
      vehicleName: prev.vehicleName || payload.model || '',
      vehicleYear: specs.vehicleYear ? String(specs.vehicleYear) : prev.vehicleYear,
      vehicleType: specs.vehicleType || prev.vehicleType,
      vehicleCc: specs.vehicleCc ? String(specs.vehicleCc) : prev.vehicleCc,
      vehicleFuelType: specs.vehicleFuelType || prev.vehicleFuelType,
      vehicleTransmission: specs.vehicleTransmission || prev.vehicleTransmission || 'manual',
      vehicleSeats: specs.vehicleSeats ? String(specs.vehicleSeats) : (prev.vehicleSeats || '4'),
      engineNumber: payload.engineNumber || prev.engineNumber,
      chassisNumber: payload.chassisNumber || prev.chassisNumber,
      rcImageUrl: payload.rcImageUrl || prev.rcImageUrl,
      locked: lockedFromRc(payload),
      _maker: payload.maker || null,
    }));
  };

  const getCarInfo = async () => {
    try {
      if (vehicleId) {
        const response = await axios.get(`${API_URL}/host/vehicles/${vehicleId}`);
        // An older draft restarts onboarding with its saved values prefilled.
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
      }
      setLoading(false);
    } catch (error) {
      setLoading(false);
      console.error('Error fetching car details:', error.message);
      notify(apiError(error, 'Error fetching car details'));
    }
  };
  useEffect(() => { getCarInfo(); }, []);

  const renderStep = () => {
    switch (step) {
      case 1: return <StepRc carDetails={data} applyRcPayload={applyRcPayload} handleNext={handleNext} />;
      case 2: return <StepDetails carDetails={data} handleChange={handleChange} handleNext={handleNext} />;
      case 3: return <StepImages carDetails={data} handleChange={handleChange} handleNext={handleNext} />;
      case 4: return <StepLocation carDetails={data} handleChange={handleChange} handleNext={handleNext} />;
      case 5: return <StepPreferences carDetails={data} handleChange={handleChange} handleNext={handleNext} />;
      case 6: return <StepPricing carDetails={data} handleChange={handleChange} handleNext={handleNext} />;
      case 7: return <StepReview carDetails={data} navigation={navigation} />;
      default: return null;
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      {!loading ? (
        <View style={{ flex: 1 }}>
          <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center',paddingHorizontal:16,paddingVertical:12,backgroundColor:'#000',borderBottomWidth:1,borderBottomColor:'#101010'}}>
            <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'flex-start',width:'100%'}}>
              <TouchableOpacity onPress={handleBack} style={{ padding:8,borderRadius:100,backgroundColor:'#2c2e2a',width:32,height:32,justifyContent:'center',alignItems:'center'}}>
                <Icon name={step === 1 ? 'close' : 'arrow-back'} size={16} color='#a3a3a3' />
              </TouchableOpacity>
              <View style={{flexDirection:'column',justifyContent:'center',alignItems:'center'}}>
                <CustomText fontType='primary' weight='SemiBold' style={{color:'#a3a3a3', fontSize:12,textTransform:'uppercase',letterSpacing:.15}}>Vehicle Onboarding</CustomText>
                <CustomText fontType='primary' weight='Regular' style={{color:'#a3a3a3', fontSize:11,letterSpacing:.15}}>{STEP_LABELS[step]}</CustomText>
              </View>
              <View style={{width:32}} />
            </View>
          </View>
          <StepProgress step={step} />
          <View style={{ flex: 1 }}>{renderStep()}</View>
        </View>
      ) : (
        <View style={{flex:1,justifyContent:'center',alignItems:'center',gap:12}}>
          <ActivityIndicator size='small' color={BRAND_COLOR} />
          <CustomText fontType='primary' weight='SemiBold' style={{color:'#757575', fontSize:11,textTransform:'uppercase',letterSpacing:.15}}>Loading...</CustomText>
        </View>
      )}
    </View>
  );
};

// ── Step 1: Upload the RC card ────────────────────────────────────────────────
const StepRc = ({ carDetails, applyRcPayload, handleNext }) => {
  const [image, setImage] = useState(null); // { uri, type, fileName }
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const pick = (launcher) => {
    launcher({ mediaType: 'photo', selectionLimit: 1, quality: 0.6 }, (response) => {
      if (response.didCancel || response.errorCode) return;
      const asset = (response.assets || [])[0];
      if (asset) { setImage(asset); setError(''); }
    });
  };

  const chooseSource = () => {
    Alert.alert('Upload RC', 'Add a photo of the vehicle RC card', [
      { text: 'Take Photo', onPress: () => pick(launchCamera) },
      { text: 'Choose from Gallery', onPress: () => pick(launchImageLibrary) },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const submit = async () => {
    if (!image) return;
    try {
      setBusy(true);
      setError('');
      const form = new FormData();
      form.append('rc', { uri: image.uri, type: image.type || 'image/jpeg', name: image.fileName || 'rc.jpg' });
      const res = await axios.post(`${API_URL}/host/vehicles/rc-ocr`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      applyRcPayload(res.data);
      handleNext();
    } catch (e) {
      setError(apiError(e, "Couldn't read that RC image. Please try a clearer photo."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={{ flex: 1, paddingHorizontal: 16, paddingTop: 20, justifyContent: 'space-between' }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 16 }}>
        <CustomText fontType='primary' weight='Bold' style={{color:'#e3e3e3',fontSize:18,letterSpacing:-.3}}>Upload your Vehicle RC</CustomText>
        <CustomText fontType='primary' weight='Regular' style={{color:'#757575',fontSize:12,marginTop:4}}>
          Take a photo of the RC card like the sample below. We'll read the details for you.
        </CustomText>

        {/* Sample RC card */}
        <View style={{marginTop:18,backgroundColor:'#141416',borderRadius:12,borderWidth:1,borderColor:'#26262a',padding:14}}>
          <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between'}}>
            <CustomText fontType='primary' weight='Bold' style={{color:'#9a9a9a',fontSize:9,letterSpacing:.5}}>SAMPLE · REGISTRATION CERTIFICATE</CustomText>
            <View style={{width:26,height:20,borderRadius:3,backgroundColor:'#c9a94a'}} />
          </View>
          <View style={{flexDirection:'row',marginTop:12,gap:12}}>
            <View style={{width:52,height:64,borderRadius:6,backgroundColor:'#232327',justifyContent:'center',alignItems:'center'}}>
              <Icon name='person' size={22} color='#3a3a40' />
            </View>
            <View style={{flex:1,justifyContent:'center',gap:7}}>
              {['70%','90%','60%','80%'].map((w, i) => (
                <View key={i} style={{height:7,width:w,borderRadius:4,backgroundColor:'#26262b'}} />
              ))}
            </View>
          </View>
          <View style={{marginTop:12,alignSelf:'flex-start',backgroundColor:'#1e1e22',borderRadius:4,paddingVertical:4,paddingHorizontal:8}}>
            <CustomText fontType='primary' weight='Bold' style={{color:'#c9a94a',fontSize:12,letterSpacing:1}}>UP12 KD 1234</CustomText>
          </View>
        </View>

        {/* Upload / preview */}
        <TouchableOpacity onPress={chooseSource} activeOpacity={0.8} style={{marginTop:18,borderRadius:12,borderWidth:1,borderColor: image ? BRAND_COLOR : '#33333a',borderStyle: image ? 'solid' : 'dashed',backgroundColor:'#101012',overflow:'hidden'}}>
          {image ? (
            <Image source={{ uri: image.uri }} style={{ width: '100%', height: 200 }} resizeMode='cover' />
          ) : (
            <View style={{height:160,justifyContent:'center',alignItems:'center',gap:8}}>
              <Icon name='cloud-upload-outline' size={30} color='#5a5a62' />
              <CustomText fontType='primary' weight='SemiBold' style={{color:'#8a8a92',fontSize:12}}>Tap to capture or upload the RC</CustomText>
            </View>
          )}
        </TouchableOpacity>

        {image ? (
          <TouchableOpacity onPress={chooseSource} style={{marginTop:10,alignSelf:'center'}}>
            <CustomText fontType='primary' weight='SemiBold' style={{color:BRAND_COLOR,fontSize:12}}>Retake / choose another</CustomText>
          </TouchableOpacity>
        ) : null}

        {error ? (
          <View style={{marginTop:16,backgroundColor:'#2a1416',borderRadius:8,borderWidth:1,borderColor:'#5c2a2e',padding:12}}>
            <CustomText fontType='primary' weight='Medium' style={{color:'#ff8f8f',fontSize:12}}>{error}</CustomText>
          </View>
        ) : null}
      </ScrollView>

      <TouchableOpacity disabled={!image || busy} onPress={submit} style={{backgroundColor: (!image || busy) ? '#959595' : BRAND_COLOR,borderRadius:8,paddingVertical:15,marginVertical:16}}>
        {busy ? <ActivityIndicator size='small' color='#000' /> : (
          <CustomText fontType='primary' weight='Bold' style={{color:'#000',fontSize:12,textTransform:'uppercase',letterSpacing:-.15,textAlign:'center'}}>Scan & Continue</CustomText>
        )}
      </TouchableOpacity>
    </View>
  );
};

// ── Step 2: Vehicle details (RC fields locked, missing fields editable) ────────
const StepDetails = ({ carDetails, handleChange, handleNext }) => {
  const [brands, setBrands] = useState([]);
  const [cities, setCities] = useState([]);
  const [listError, setListError] = useState('');
  const locked = carDetails.locked || {};

  const loadOptions = async () => {
    setListError('');
    const client = UnauthAxios();
    const [brandRes, cityRes] = await Promise.allSettled([
      client.get(`${API_URL}/brand`),
      client.get(`${API_URL}/city`),
    ]);
    const failures = [];
    if (brandRes.status === 'fulfilled') {
      const list = asList(brandRes.value.data, 'brands');
      setBrands(list);
      // Pre-select the brand by the RC manufacturer name, if we can match it.
      if (!carDetails.brandId && carDetails._maker) {
        const maker = String(carDetails._maker).toLowerCase();
        const match = list.find((b) => maker.includes(String(b.name).toLowerCase().split(' ')[0]));
        if (match) { handleChange('brandId', match.id); handleChange('brandName', match.name); }
      }
    } else failures.push('brands');
    if (cityRes.status === 'fulfilled') setCities(asList(cityRes.value.data, 'cities'));
    else failures.push('cities');
    if (failures.length) setListError(`Couldn't load ${failures.join(' and ')}. Check your connection and retry.`);
  };
  useEffect(() => { loadOptions(); }, []);

  const canContinue = !!carDetails.brandId && !!carDetails.cityId && !!carDetails.vehicleName &&
    !!carDetails.vehicleNumber && !!carDetails.vehicleYear && !!carDetails.vehicleCc &&
    !!carDetails.vehicleType && !!carDetails.vehicleFuelType;

  return (
    <KeyboardAvoidingView style={{ flex: 1, paddingHorizontal: 16, paddingTop: 20 }}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 16 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps='handled'>
        <CustomText fontType='primary' weight='Bold' style={{color:'#e3e3e3',fontSize:18,letterSpacing:-.3}}>Confirm the details</CustomText>
        <CustomText fontType='primary' weight='Regular' style={{color:'#757575',fontSize:12,marginTop:4}}>
          Locked fields came from your RC. Fill anything that's missing.
        </CustomText>

        {listError ? (
          <View style={{marginTop:16,backgroundColor:'#2a1416',borderRadius:8,borderWidth:1,borderColor:'#5c2a2e',padding:12,flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:12}}>
            <CustomText fontType='primary' weight='Medium' style={{color:'#ff8f8f',fontSize:12,flex:1}}>{listError}</CustomText>
            <TouchableOpacity onPress={loadOptions} style={{backgroundColor:'#5c2a2e',borderRadius:5,paddingVertical:6,paddingHorizontal:12}}>
              <CustomText fontType='primary' weight='Bold' style={{color:'#ffd9d9',fontSize:11,textTransform:'uppercase'}}>Retry</CustomText>
            </TouchableOpacity>
          </View>
        ) : null}

        {carDetails.ownerName ? (
          <DetailField label='Owner' value={carDetails.ownerName} locked />
        ) : null}

        <DetailField label='Registration Number' value={carDetails.vehicleNumber} locked={!!locked.vehicleNumber}
          onChange={(t) => handleChange('vehicleNumber', t.toUpperCase())} placeholder='e.g. TS09AB1234' />

        <View style={{marginTop:18}}>
          <CustomText fontType='primary' weight='SemiBold' style={{color:'#757575', fontSize:11,textTransform:'uppercase',letterSpacing:.15,marginBottom:4}}>Vehicle Brand</CustomText>
          <OptionPicker placeholder={brands.length ? 'Select Brand' : 'Loading brands…'} options={brands} selectedId={carDetails.brandId} onSelect={(o) => { handleChange('brandId', o.id); handleChange('brandName', o.name); }} />
        </View>

        <View style={{marginTop:18}}>
          <CustomText fontType='primary' weight='SemiBold' style={{color:'#757575', fontSize:11,textTransform:'uppercase',letterSpacing:.15,marginBottom:4}}>City</CustomText>
          <OptionPicker placeholder={cities.length ? 'Select City' : 'Loading cities…'} options={cities} selectedId={carDetails.cityId} onSelect={(o) => { handleChange('cityId', o.id); handleChange('cityName', o.name); }} />
        </View>

        <DetailField label='Vehicle Name' value={carDetails.vehicleName} onChange={(t) => handleChange('vehicleName', t)} placeholder='e.g. Creta SX' />
        <DetailField label='Model' value={carDetails.model} locked={!!locked.model} onChange={(t) => handleChange('model', t)} placeholder='e.g. Creta' />

        <View style={{flexDirection:'row',gap:12}}>
          <View style={{flex:1}}>
            <DetailField label='Year' value={carDetails.vehicleYear} locked={!!locked.vehicleYear} keyboardType='number-pad' onChange={(t) => handleChange('vehicleYear', t.replace(/[^0-9]/g, ''))} placeholder='2021' />
          </View>
          <View style={{flex:1}}>
            <DetailField label='Engine (CC)' value={carDetails.vehicleCc} locked={!!locked.vehicleCc} keyboardType='number-pad' onChange={(t) => handleChange('vehicleCc', t.replace(/[^0-9]/g, ''))} placeholder='1200' />
          </View>
        </View>

        <View style={{marginTop:18}}>
          <CustomText fontType='primary' weight='SemiBold' style={{color:'#757575', fontSize:11,textTransform:'uppercase',letterSpacing:.15,marginBottom:4}}>Vehicle Type</CustomText>
          <OptionPicker placeholder='Select Type' options={VEHICLE_TYPES} selectedId={carDetails.vehicleType} onSelect={(o) => handleChange('vehicleType', o.id)} searchable={false} disabled={!!locked.vehicleType} />
        </View>

        <View style={{marginTop:18}}>
          <CustomText fontType='primary' weight='SemiBold' style={{color:'#757575', fontSize:11,textTransform:'uppercase',letterSpacing:.15,marginBottom:4}}>Fuel Type</CustomText>
          <OptionPicker placeholder='Select Fuel' options={FUEL_TYPES} selectedId={carDetails.vehicleFuelType} onSelect={(o) => handleChange('vehicleFuelType', o.id)} searchable={false} disabled={!!locked.vehicleFuelType} />
        </View>

        <View style={{flexDirection:'row',gap:12,marginTop:18}}>
          <View style={{flex:1}}>
            <CustomText fontType='primary' weight='SemiBold' style={{color:'#757575', fontSize:11,textTransform:'uppercase',letterSpacing:.15,marginBottom:4}}>Transmission</CustomText>
            <OptionPicker placeholder='Select' options={TRANSMISSIONS} selectedId={carDetails.vehicleTransmission} onSelect={(o) => handleChange('vehicleTransmission', o.id)} searchable={false} disabled={!!locked.vehicleTransmission} />
          </View>
          <View style={{flex:1}}>
            <CustomText fontType='primary' weight='SemiBold' style={{color:'#757575', fontSize:11,textTransform:'uppercase',letterSpacing:.15,marginBottom:4}}>Seats</CustomText>
            <OptionPicker placeholder='Select' options={SEAT_OPTIONS} selectedId={carDetails.vehicleSeats} onSelect={(o) => handleChange('vehicleSeats', o.id)} searchable={false} disabled={!!locked.vehicleSeats} />
          </View>
        </View>

        {carDetails.engineNumber || carDetails.chassisNumber ? (
          <View style={{flexDirection:'row',gap:12}}>
            <View style={{flex:1}}>
              <DetailField label='Engine No.' value={carDetails.engineNumber} locked={!!locked.engineNumber} onChange={(t) => handleChange('engineNumber', t)} placeholder='Engine number' />
            </View>
            <View style={{flex:1}}>
              <DetailField label='Chassis No.' value={carDetails.chassisNumber} locked={!!locked.chassisNumber} onChange={(t) => handleChange('chassisNumber', t)} placeholder='Chassis number' />
            </View>
          </View>
        ) : null}
      </ScrollView>

      <TouchableOpacity disabled={!canContinue} onPress={handleNext} style={{backgroundColor: canContinue ? BRAND_COLOR : '#959595',borderRadius:8,paddingVertical:15,marginVertical:16}}>
        <CustomText fontType='primary' weight='Bold' style={{color:'#000',fontSize:12,textTransform:'uppercase',letterSpacing:-.15,textAlign:'center'}}>Continue</CustomText>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
};

// ── Step 3: Photos into labelled slots ────────────────────────────────────────
const StepImages = ({ carDetails, handleChange, handleNext }) => {
  // slot type -> asset
  const [slots, setSlots] = useState(() => {
    const initial = {};
    (carDetails.images || []).forEach((img) => { if (img.type) initial[img.type] = img; });
    return initial;
  });
  const [busy, setBusy] = useState(false);

  const pickFor = (type) => {
    const launch = (launcher) => launcher({ mediaType: 'photo', selectionLimit: 1, quality: 0.6 }, (response) => {
      if (response.didCancel || response.errorCode) return;
      const asset = (response.assets || [])[0];
      if (asset) setSlots((prev) => ({ ...prev, [type]: asset }));
    });
    Alert.alert('Add photo', 'Choose a source', [
      { text: 'Take Photo', onPress: () => launch(launchCamera) },
      { text: 'Choose from Gallery', onPress: () => launch(launchImageLibrary) },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const removeSlot = (type) => setSlots((prev) => { const n = { ...prev }; delete n[type]; return n; });

  const filled = IMAGE_SLOTS.filter((s) => slots[s.type]);

  const uploadOne = async (asset) => {
    // Already uploaded (resumed draft) — keep as-is.
    if (asset.url && !asset.uri) return asset.url;
    const urlRes = await axios.get(`${API_URL}/image/url`, { params: { fileName: asset.fileName, fileType: asset.type } });
    const formData = new FormData();
    Object.entries(urlRes.data.fields).forEach(([field, value]) => formData.append(field, value));
    formData.append('acl', 'public-read');
    formData.append('file', { uri: asset.uri, type: asset.type, name: asset.fileName || 'photo.jpg' });
    await UnauthAxios().post(urlRes.data.url, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
    return urlRes.data.url + urlRes.data.fields.key;
  };

  const submit = async () => {
    if (filled.length === 0) { notify('Add at least the front photo'); return; }
    try {
      setBusy(true);
      const uploaded = [];
      for (const slot of filled) {
        const asset = slots[slot.type];
        const url = await uploadOne(asset);
        // The front photo is the cover; fall back to the first filled slot.
        const isCover = slot.type === 'front' || (!slots.front && slot === filled[0]);
        uploaded.push({ url, isCover, type: slot.type });
      }
      handleChange('images', uploaded);
      handleNext();
    } catch (e) {
      console.error('Error uploading images:', e.response ? e.response.data : e.message);
      notify(apiError(e, 'Error uploading images'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={{ flex: 1, paddingHorizontal: 16, paddingTop: 20, justifyContent: 'space-between' }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 16 }}>
        <CustomText fontType='primary' weight='Bold' style={{color:'#e3e3e3',fontSize:18,letterSpacing:-.3}}>Add photos</CustomText>
        <CustomText fontType='primary' weight='Regular' style={{color:'#757575',fontSize:12,marginTop:4}}>
          Add a clear photo for each angle. The front photo is used as the cover.
        </CustomText>

        <View style={{flexDirection:'row',flexWrap:'wrap',justifyContent:'space-between',marginTop:16}}>
          {IMAGE_SLOTS.map((slot) => {
            const asset = slots[slot.type];
            const uri = asset ? (asset.uri || photoUrl(asset.url)) : null;
            return (
              <View key={slot.type} style={{ width: '48%', marginBottom: 14 }}>
                <TouchableOpacity onPress={() => pickFor(slot.type)} activeOpacity={0.8} style={{height:110,borderRadius:8,borderWidth:1,borderColor: uri ? BRAND_COLOR : '#33333a',borderStyle: uri ? 'solid' : 'dashed',backgroundColor:'#101012',justifyContent:'center',alignItems:'center',overflow:'hidden'}}>
                  {uri ? (
                    <>
                      <Image source={{ uri }} style={{ width: '100%', height: '100%' }} />
                      <TouchableOpacity onPress={() => removeSlot(slot.type)} style={{position:'absolute',top:4,right:4,backgroundColor:'#000000bb',borderRadius:100,padding:5}}>
                        <Icon name='trash-outline' size={15} color='#fff' />
                      </TouchableOpacity>
                    </>
                  ) : (
                    <>
                      <Icon name='add-circle-outline' size={22} color='#5a5a62' />
                      {slot.type === 'front' ? (
                        <View style={{marginTop:4,backgroundColor:'#26261e',borderRadius:3,paddingHorizontal:6,paddingVertical:2}}>
                          <CustomText fontType='primary' weight='Bold' style={{color:BRAND_COLOR,fontSize:8,textTransform:'uppercase'}}>Cover</CustomText>
                        </View>
                      ) : null}
                    </>
                  )}
                </TouchableOpacity>
                <CustomText fontType='primary' weight='SemiBold' style={{color:'#8a8a92',fontSize:11,marginTop:5,textAlign:'center'}}>{slot.label}</CustomText>
              </View>
            );
          })}
        </View>
      </ScrollView>

      <TouchableOpacity disabled={busy || filled.length === 0} onPress={submit} style={{backgroundColor: (busy || filled.length === 0) ? '#959595' : BRAND_COLOR,borderRadius:8,paddingVertical:15,marginVertical:16}}>
        {busy ? <ActivityIndicator size='small' color='#000' /> : (
          <CustomText fontType='primary' weight='Bold' style={{color:'#000',fontSize:12,textTransform:'uppercase',letterSpacing:-.15,textAlign:'center'}}>Upload & Continue</CustomText>
        )}
      </TouchableOpacity>
    </View>
  );
};

// ── Step 4: Location (city + current + search, 30km radius, no lat/long shown) ─
const StepLocation = ({ carDetails, handleChange, handleNext }) => {
  const [region, setRegion] = useState({ latitude: 17.385, longitude: 78.4867, latitudeDelta: 0.0922, longitudeDelta: 0.0421 });
  const [marker, setMarker] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [selectedCity, setSelectedCity] = useState(null);
  const [cities, setCities] = useState([]);
  const [detecting, setDetecting] = useState(false);
  const [showInvalid, setShowInvalid] = useState(false);
  const [search, setSearch] = useState('');
  const [results, setResults] = useState([]);
  const [placeLabel, setPlaceLabel] = useState('');

  const validateLocation = async (lat, lng, city = selectedCity) => {
    try {
      const response = await axios.post(`${API_URL}/utility/validate-geo?lat=${lat}&lng=${lng}&cityId=${city.id}`);
      const { city: newCity, isCityChanged, isPlaceValid } = response.data;
      if (isCityChanged) { setSelectedCity(newCity); handleChange('cityId', newCity.id); handleChange('cityName', newCity.name); }
      else if (!isPlaceValid) {
        setShowInvalid(true);
        setMarker({ latitude: parseFloat(city.lat), longitude: parseFloat(city.lng) });
        return false;
      }
      return true;
    } catch (error) {
      notify(apiError(error, 'Error validating location'));
      return false;
    }
  };

  const setPoint = async (lat, lng) => {
    setMarker({ latitude: lat, longitude: lng });
    setRegion((r) => ({ ...r, latitude: lat, longitude: lng }));
    await validateLocation(lat, lng);
  };

  const handleMapPress = (e) => setPoint(e.nativeEvent.coordinate.latitude, e.nativeEvent.coordinate.longitude);
  const handleMarkerDrag = (e) => setPoint(e.nativeEvent.coordinate.latitude, e.nativeEvent.coordinate.longitude);

  const detect = async () => {
    try {
      setDetecting(true);
      const location = await getCurrentLocation(true);
      setPlaceLabel('Current location');
      await setPoint(location.latitude, location.longitude);
    } catch (error) {
      notify('Failed to detect location');
    } finally {
      setDetecting(false);
    }
  };

  const runSearch = async (text) => {
    setSearch(text);
    if (!text || text.length < 3 || !selectedCity) { setResults([]); return; }
    try {
      const res = await axios.get(`${API_URL}/utility/autocomplete`, { params: { search: text, cityId: selectedCity.id } });
      setResults(asList(res.data).slice(0, 5));
    } catch (error) { setResults([]); }
  };

  const choosePlace = async (place) => {
    setResults([]);
    setSearch('');
    setPlaceLabel(place.description || '');
    try {
      const res = await axios.post(`${API_URL}/utility/validate-place`, { placeId: place.place_id, cityId: selectedCity.id });
      const loc = res.data?.info?.geometry?.location;
      if (!loc) return;
      if (res.data.isCityChanged && res.data.city) { setSelectedCity(res.data.city); handleChange('cityId', res.data.city.id); handleChange('cityName', res.data.city.name); }
      else if (!res.data.isPlaceValid) { setShowInvalid(true); return; }
      setMarker({ latitude: loc.lat, longitude: loc.lng });
      setRegion((r) => ({ ...r, latitude: loc.lat, longitude: loc.lng }));
    } catch (error) {
      notify(apiError(error, 'Could not select that place'));
    }
  };

  const getCity = async () => {
    try {
      setLoading(true);
      const response = await UnauthAxios().get(`${API_URL}/city`);
      const list = asList(response.data, 'cities');
      setCities(list);
      const city = list.find((c) => c.id === carDetails.cityId) || list[0];
      if (!city) { setLoading(false); notify("Couldn't load cities."); return; }
      setSelectedCity(city);
      const lat = parseFloat(city.lat), lng = parseFloat(city.lng);
      setRegion({ latitude: lat, longitude: lng, latitudeDelta: 0.0922, longitudeDelta: 0.0421 });
      setMarker({ latitude: lat, longitude: lng });
      setLoading(false);
    } catch (error) {
      setLoading(false);
      notify(apiError(error, 'Error fetching cities'));
    }
  };
  useEffect(() => { getCity(); }, []);

  const changeCity = (option) => {
    setSelectedCity(option);
    handleChange('cityId', option.id);
    handleChange('cityName', option.name);
    setPlaceLabel('');
    const lat = parseFloat(option.lat), lng = parseFloat(option.lng);
    setRegion({ latitude: lat, longitude: lng, latitudeDelta: 0.0922, longitudeDelta: 0.0421 });
    setMarker({ latitude: lat, longitude: lng });
  };

  const submit = () => {
    if (!marker || !selectedCity) return;
    setSubmitLoading(true);
    handleChange('pickupPoint', {
      cityId: selectedCity.id,
      cityName: selectedCity.name,
      address: placeLabel || selectedCity.name,
      lat: marker.latitude,
      long: marker.longitude,
    });
    handleNext();
    setSubmitLoading(false);
  };

  if (loading) {
    return (
      <View style={{flex:1,justifyContent:'center',alignItems:'center',gap:12}}>
        <ActivityIndicator size='small' color={BRAND_COLOR} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <View style={{ flex: 1 }}>
        <MapView style={{ flex: 1 }} region={region} showsCompass showsScale onPress={handleMapPress}>
          {marker && <Marker coordinate={marker} draggable onDragEnd={handleMarkerDrag} pinColor={BRAND_COLOR} />}
          <Circle center={marker || region} radius={LOCATION_RADIUS_M} fillColor='#E3BF3122' strokeColor={BRAND_COLOR} strokeWidth={1} />
        </MapView>
      </View>

      {/* City + search overlay */}
      <View style={{position:'absolute',top:10,left:12,right:12,gap:8}}>
        <View style={{backgroundColor:'#141416',borderRadius:10,paddingHorizontal:10}}>
          <Select placeholder='Select City' options={cities} selected={selectedCity} label='name' onSelect={changeCity} containerStyle={{backgroundColor:'transparent'}} />
        </View>
        <View style={{backgroundColor:'#141416',borderRadius:10,flexDirection:'row',alignItems:'center',paddingHorizontal:12}}>
          <Icon name='search' size={16} color='#8a8a92' />
          <TextInput
            placeholder='Search for a location'
            placeholderTextColor='#757575'
            value={search}
            onChangeText={runSearch}
            style={{flex:1,color:'#fff',fontSize:14,paddingVertical:11,paddingHorizontal:8}}
          />
        </View>
        {results.length > 0 ? (
          <View style={{backgroundColor:'#141416',borderRadius:10,overflow:'hidden'}}>
            {results.map((place) => (
              <TouchableOpacity key={place.place_id} onPress={() => choosePlace(place)} style={{paddingHorizontal:14,paddingVertical:12,borderBottomWidth:1,borderBottomColor:'#1f1f22'}}>
                <CustomText fontType='primary' weight='Regular' style={{color:'#e3e3e3',fontSize:13}} numberOfLines={1}>{place.description}</CustomText>
              </TouchableOpacity>
            ))}
          </View>
        ) : null}
      </View>

      <View style={{position:'absolute',top:results.length ? 260 : 122,right:12}}>
        <TouchableHighlight disabled={detecting} underlayColor='#2f2f2f' onPress={detect} style={{justifyContent:'center',alignItems:'center',backgroundColor:'#2d2d2d',borderRadius:12,height:46,width:46}}>
          <Icon name='locate-outline' size={20} color={BRAND_COLOR} />
        </TouchableHighlight>
      </View>

      {placeLabel ? (
        <View style={{position:'absolute',bottom:78,left:12,right:12,backgroundColor:'#141416cc',borderRadius:8,padding:10}}>
          <CustomText fontType='primary' weight='SemiBold' style={{color:'#c9c9c9',fontSize:12}} numberOfLines={1}>📍 {placeLabel}</CustomText>
        </View>
      ) : null}

      <TouchableOpacity disabled={submitLoading || !selectedCity} onPress={submit} style={{backgroundColor: (submitLoading || !selectedCity) ? '#959595' : BRAND_COLOR,borderRadius:8,paddingVertical:15,position:'absolute',bottom:14,left:12,right:12}}>
        <CustomText fontType='primary' weight='Bold' style={{color:'#000',fontSize:12,textTransform:'uppercase',letterSpacing:-.15,textAlign:'center'}}>Continue</CustomText>
      </TouchableOpacity>

      {showInvalid && <LocationInvalidScreen show={showInvalid} setShow={setShowInvalid} onPress={() => setShowInvalid(false)} />}
    </View>
  );
};

// ── Step 5: Preferences ───────────────────────────────────────────────────────
const StepPreferences = ({ carDetails, handleChange, handleNext }) => {
  const preferences = [
    { value: 'midnightBooking', name: 'Allow Midnight Booking', description: 'Allow booking from 12am to 6am for this car' },
    { value: 'selfPickup', name: 'Allow Self Pickup', description: 'Allow self pickup by the customer from the pickup point' },
    { value: 'deliverAvailable', name: 'Delivery Available', description: 'Allow delivery of the car to the customer' },
  ];
  const [selected, setSelected] = useState(carDetails.preferences || {});

  const toggle = (id) => setSelected((prev) => ({ ...prev, [id]: !prev[id] }));

  const submit = () => { handleChange('preferences', selected); handleNext(); };

  return (
    <View style={{ padding: 16, flex: 1, justifyContent: 'space-between' }}>
      <View>
        {preferences.map((preference) => (
          <View key={preference.value} style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center',paddingVertical:16,borderBottomWidth:1,borderBottomColor:'#1c1c1e'}}>
            <View style={{flex:1}}>
              <CustomText fontType='primary' weight='Medium' style={{color:'#e3e3e3',fontSize:14,marginBottom:2}}>{preference.name}</CustomText>
              <CustomText fontType='primary' weight='Regular' style={{color:'#757575',fontSize:12}}>{preference.description}</CustomText>
            </View>
            <Switch
              value={!!selected[preference.value]}
              thumbColor={!!selected[preference.value] ? BRAND_COLOR : '#fff'}
              trackColor={{ true: '#EDBF3155', false: '#454545' }}
              onValueChange={() => toggle(preference.value)}
            />
          </View>
        ))}
      </View>
      <TouchableOpacity onPress={submit} style={{ backgroundColor: BRAND_COLOR, borderRadius: 8, paddingVertical: 15, marginTop: 20 }}>
        <CustomText fontType='primary' weight='Bold' style={{ color: '#000', fontSize: 12, textTransform: 'uppercase', letterSpacing: -0.15, textAlign: 'center' }}>Continue</CustomText>
      </TouchableOpacity>
    </View>
  );
};

// ── Step 6: Pricing ───────────────────────────────────────────────────────────
const StepPricing = ({ carDetails, handleChange, handleNext }) => {
  const Field = ({ label, field, placeholder }) => (
    <>
      <CustomText fontType='primary' weight='Bold' style={{ color: '#959595', fontSize: 11, letterSpacing: .15, marginBottom: 4, textTransform: 'uppercase' }}>{label}</CustomText>
      <TextInput
        style={{ backgroundColor: '#1c1c1e', color: '#e3e3e3', padding: 12, borderRadius: 8, marginBottom: 16 }}
        placeholder={placeholder}
        placeholderTextColor='#757575'
        keyboardType='numeric'
        value={carDetails[field]}
        onChangeText={(value) => handleChange(field, value.replace(/[^0-9]/g, ''))}
      />
    </>
  );

  const canContinue = carDetails.kmAlloted && carDetails.perHourFee && carDetails.weekdayPricing && carDetails.weekendPricing;

  return (
    <View style={{ padding: 16, flex: 1, justifyContent: 'space-between' }}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Field label='Alloted KMs' field='kmAlloted' placeholder='Enter alloted km' />
        <Field label='Extra KM Pricing' field='perHourFee' placeholder='Enter extra km pricing' />
        <Field label='Weekday Pricing (per hour)' field='weekdayPricing' placeholder='Enter weekday pricing' />
        <Field label='Weekend Pricing (per hour)' field='weekendPricing' placeholder='Enter weekend pricing' />
      </ScrollView>
      <TouchableOpacity disabled={!canContinue} onPress={handleNext} style={{ backgroundColor: canContinue ? BRAND_COLOR : '#959595', borderRadius: 8, paddingVertical: 15, marginTop: 20 }}>
        <CustomText fontType='primary' weight='Bold' style={{ color: '#000', fontSize: 12, textTransform: 'uppercase', letterSpacing: -0.15, textAlign: 'center' }}>Review Listing</CustomText>
      </TouchableOpacity>
    </View>
  );
};

// ── Step 7: Review & publish ──────────────────────────────────────────────────
const StepReview = ({ carDetails, navigation }) => {
  const [busy, setBusy] = useState(false);
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

  const publish = async () => {
    try {
      setBusy(true);
      // The one and only write: the whole listing in a single transaction.
      const response = await axios.post(`${API_URL}/host/vehicles/listing`, {
        vehicleId: carDetails.vehicleId || undefined,
        vehicleNumber: carDetails.vehicleNumber,
        brandId: carDetails.brandId,
        cityId: carDetails.cityId,
        vehicleName: carDetails.vehicleName,
        model: carDetails.model,
        ownerName: carDetails.ownerName,
        vehicleYear: carDetails.vehicleYear,
        vehicleType: carDetails.vehicleType,
        vehicleCc: carDetails.vehicleCc,
        vehicleFuelType: carDetails.vehicleFuelType,
        vehicleTransmission: carDetails.vehicleTransmission,
        vehicleSeats: carDetails.vehicleSeats,
        engineNumber: carDetails.engineNumber,
        chassisNumber: carDetails.chassisNumber,
        rcImageUrl: carDetails.rcImageUrl,
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
      setBusy(false);
      notify('Your car is listed');
      // Onboarding complete → back to the host dashboard.
      navigation.navigate('HostCarInfo', { vehicleId: response.data.id });
    } catch (error) {
      setBusy(false);
      console.error('Error publishing listing:', error.message);
      notify(apiError(error, 'Could not publish this listing'));
    }
  };

  return (
    <View style={{ flex: 1, paddingHorizontal: 16, paddingTop: 16, justifyContent: 'space-between' }}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 16 }} showsVerticalScrollIndicator={false}>
        <CustomText fontType='primary' weight='Bold' style={{color:'#e3e3e3',fontSize:18,letterSpacing:-.3}}>Review your listing</CustomText>
        <CustomText fontType='primary' weight='Regular' style={{color:'#757575',fontSize:12,marginTop:4,marginBottom:16}}>Go back to any step to change something.</CustomText>

        {carDetails.images?.length ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginBottom:12}}>
            {carDetails.images.map((image, index) => (
              <Image key={index} source={{ uri: photoUrl(image.url) }} style={{ width: 140, height: 96, borderRadius: 8, marginRight: 8 }} />
            ))}
          </ScrollView>
        ) : null}

        <Card title='Car'>
          <Row label='Brand' value={carDetails.brandName} />
          <Row label='Name' value={carDetails.vehicleName} />
          <Row label='Model' value={carDetails.model} />
          <Row label='Registration' value={carDetails.vehicleNumber} />
          <Row label='Owner' value={carDetails.ownerName} />
          <Row label='Year' value={carDetails.vehicleYear} />
          <Row label='Type' value={VEHICLE_TYPES.find((t) => t.id === carDetails.vehicleType)?.name} />
          <Row label='Engine' value={carDetails.vehicleCc ? `${carDetails.vehicleCc} cc` : null} />
          <Row label='Fuel' value={FUEL_TYPES.find((f) => f.id === carDetails.vehicleFuelType)?.name} />
          <Row label='Transmission' value={TRANSMISSIONS.find((t) => t.id === carDetails.vehicleTransmission)?.name} />
          <Row label='Seats' value={SEAT_OPTIONS.find((o) => o.id === String(carDetails.vehicleSeats))?.name} />
        </Card>

        <Card title='Pickup'>
          <Row label='City' value={carDetails.pickupPoint?.cityName || carDetails.cityName} />
          <Row label='Location' value={carDetails.pickupPoint?.address} />
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

      <TouchableOpacity disabled={busy} onPress={publish} style={{backgroundColor: busy ? '#959595' : BRAND_COLOR,borderRadius:8,paddingVertical:15,marginVertical:16}}>
        {busy ? <ActivityIndicator size='small' color='#000' /> : (
          <CustomText fontType='primary' weight='Bold' style={{color:'#000',fontSize:12,textTransform:'uppercase',letterSpacing:-.15,textAlign:'center'}}>Host My Car</CustomText>
        )}
      </TouchableOpacity>
    </View>
  );
};

export default AddCar;
