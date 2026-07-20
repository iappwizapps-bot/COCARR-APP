import { useNavigation } from '@react-navigation/native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, StatusBar, TouchableOpacity, Image, ScrollView, FlatList, TouchableHighlight, Dimensions, ToastAndroid, RefreshControl } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { API_URL, BRAND_COLOR } from '../../utils/constants';
import axios from 'axios';
import { useDispatch, useSelector } from 'react-redux';
import { convertToUnixTimestamp, formatDate, getCurrentLocation } from '../../utils/utils';
import CustomText from '../../components/CustomText';
import { setSelectedCity, setShowCityLocation, setShowCityPicker } from '../../store/bookingSlice';
import LocationChangeNotificationScreen from './LocationChangeNotificationScreen';
import LocationInvalidScreen from './LocationInvalidScreen';
import Carousel from 'react-native-reanimated-carousel';
// import Logo from '../../images/logo.png';
// import { BottomSheet, BottomSheetView } from '@gorhom/bottom-sheet';
export default function HomeScreen() {
  const navigator = useNavigation()
  const { startDateTime, endDateTime,selectedCity,selectedLocation } = useSelector((state) => state.booking);
  const dispatch = useDispatch();
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [showLocationSearch, setShowLocationSearch] = useState(false);
  const [showLocationValid, setShowLocationValid] = useState(false);
  const [showCityChange, setShowCityChange] = useState(null);
  const [cars, setCars] = useState([])
  const [refreshing, setRefreshing] = useState(false);


  

  // const bottomSheetRef = useRef(null);

  // callbacks
  const handleSheetChanges = useCallback((index) => {
    // console.log('handleSheetChanges', index);
  }, []);

  // useEffect(()=>{
  //   console.log('selectedLocation', selectedLocation)
  //   console.log('selectedCity', selectedCity)
  // },[])



  const getCars = async () => {
    try {
      let startTime = new Date(startDateTime);
      let endTime = new Date(endDateTime);
      console.log('startTime',startTime)
      console.log('endTime',endTime)
      if (!startTime || !endTime) {
        startTime = new Date(Date.now() + (6 * 60 * 60 * 1000)); // 6 hours from now
        endTime = new Date(startTime.getTime() + (12 * 60 * 60 * 1000)); // 12 hours from startTime
      }

      const response = await axios.get(`${API_URL}/vehicle?startTime=${convertToUnixTimestamp(startTime)}&endTime=${convertToUnixTimestamp(endTime)}&offset=${0}&limit=${10}&city=${selectedCity.id}&sortBy=rating`)
      setCars(response.data.vehicles)
    } catch (error) {
      console.log('error',error)
      console.log('error',error.response.data)
      ToastAndroid.show('Error fetching top cars', ToastAndroid.SHORT)
    }
  }

  
  // Detects the device location, resolves it to a serviced city + a readable
  // address, and stores both. Works even before a city is picked (seeds the
  // validation with the first available city). Updates silently so it can be
  // used both on first open and when the locate icon is pressed.
  const detectUserLocation = async() => {
    try {
      setDetectingLocation(true)
      const location = await getCurrentLocation();
      let cityId = selectedCity?.id;
      if (!cityId) {
        const citiesRes = await axios.get(`${API_URL}/city`);
        cityId = citiesRes.data?.[0]?.id;
      }
      const response = await axios.post(`${API_URL}/utility/validate-geo?lat=${location.latitude}&lng=${location.longitude}&cityId=${cityId}`)
      const { info, city, isPlaceValid } = response.data;
      const detectedLocation = {
        name: info.formatted_address,
        place_id: info.place_id,
        latitude: info.geometry.location.lat,
        longitude: info.geometry.location.lng,
      };
      dispatch(setShowCityLocation({
        selectedCity: isPlaceValid ? city : undefined,
        selectedLocation: detectedLocation,
      }));
      dispatch(setShowCityPicker(false));
    } catch (error) {
      console.log('detecting location error',error)
      ToastAndroid.show('Failed to detect location', ToastAndroid.SHORT);
    } finally {
      setDetectingLocation(false)
    }
  }

  // Auto-pick the location the first time the home screen opens (only when
  // nothing has been selected yet, so a saved selection is preserved).
  const didAutoDetect = useRef(false);
  useEffect(() => {
    if (didAutoDetect.current) return;
    didAutoDetect.current = true;
    if (!selectedLocation) {
      detectUserLocation();
    }
  }, []);

  useEffect(()=>{
    if (selectedCity) getCars()
  },[selectedCity])
  
  const onRefresh = async () => {
    try {
      setRefreshing(true);
      await getCars()
      setRefreshing(false);
    } catch (error) {
      console.log(error)
      ToastAndroid.show('Failed to fetch cars', ToastAndroid.SHORT);
      setRefreshing(false);
    }
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor:'#000'}} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      {/* <HomeIcon width={22} height={22} currentColor={color} /> */}
      <View style={{flexDirection:'row', justifyContent:'space-between', alignItems:'center',marginBottom:24,paddingHorizontal:16}}>
              <View style={{paddingHorizontal:0,paddingVertical:18}}>
              <Image source={require('../../images/logo.png')} style={{width:72, height:38}}/>
            </View>
        <TouchableOpacity style={{flexDirection:'row', alignItems:'center', gap:4,backgroundColor:'#1c1c1e',borderRadius:5,paddingVertical:8,paddingHorizontal:12,shadowOpacity:0.5,shadowRadius:1,shadowColor:'#454545',justifyContent:'center'}} onPress={()=>dispatch(setShowCityPicker(true))}>
          <View>
            <CustomText fontType='primary' weight='Bold' style={{color:'#959595', fontSize:10, fontWeight:'500',textAlign:'left',marginBottom:0,textTransform:'uppercase'}}>
              {selectedCity ? selectedCity.name : 'Selected City'}
            </CustomText>
          </View>
          <Icon name="location-outline" size={16} color="#a3a3a3" style={{borderRadius:50}}/>
        </TouchableOpacity>

      </View>

      <PremiumMemberships/>
        <View style={{paddingHorizontal:16}}>

          <View style={{flexDirection:'column', borderRadius:12,borderCurve:'continuous',backgroundColor:'#1C1C1E',overflow:'hidden'}}>
            <TouchableHighlight underlayColor='#2C2C2E' onPress={()=>navigator.navigate('DatePicker',{from:'home'})} style={{flexDirection:'row',alignItems:'center', justifyContent:'flex-start',backgroundColor:'#1C1C1E',borderBottomWidth:1,borderBottomColor:'#25252A',paddingHorizontal:16,paddingVertical:12}}>

              <View style={{flexDirection:'row',justifyContent:'space-between',width:'100%',alignItems:'center'}}>

                <View style={{flexDirection:'row',alignItems:'center', justifyContent:'flex-start',flex:1,marginRight:24}}>
                    <Icon name="navigate-circle-outline" size={24} color="#EDBF31"/>
                    <View style={{marginLeft:12,justifyContent:'center'}}>
                      <CustomText fontType='primary' weight='Bold' style={{color:'#959595', fontSize:10, fontWeight:'500',textAlign:'left',marginBottom:0,textTransform:'uppercase'}}>Selected Location</CustomText>
                      <CustomText numberOfLines={2} ellipsizeMode='tail' fontType='primary' weight='Medium' style={{color:'#fff', fontSize:12, fontWeight:'500'}}>{detectingLocation ? 'Detecting Location...' : selectedLocation ? selectedLocation.name : selectedCity ? selectedCity.name : 'Selected Location'}</CustomText>
                    </View>
                </View>
                <View>

              <TouchableHighlight onPress={()=>detectUserLocation()} underlayColor='#2f2f2f' style={{flexDirection:'row',alignItems:'center', justifyContent:'flex-start',backgroundColor:'#2d2d2d',borderRadius:8,padding:2,shadowOpacity:0.5,shadowRadius:1,shadowColor:'#454545',height:40,width:40,justifyContent:'center'}}>
                <Icon name="locate-outline" size={20} color={BRAND_COLOR}/>
              </TouchableHighlight>
                </View>
              </View>
            </TouchableHighlight> 


            <View style={{flexDirection:'row',alignItems:'center', justifyContent:'flex-start',backgroundColor:'#1C1C1E',borderBottomWidth:1,borderBottomColor:'#25252A',paddingHorizontal:0,paddingVertical:0}}>

            <TouchableHighlight underlayColor='#2C2C2E' onPress={()=>navigator.navigate('DatePicker',{from:'home'})} style={{flexDirection:'row',alignItems:'center', justifyContent:'flex-start',backgroundColor:'#1C1C1E',borderRightWidth:1,borderRightColor:'#2C2C2E',paddingLeft:16,paddingVertical:16,width:'50%'}}>
              <View style={{flexDirection:'row',alignItems:'center', justifyContent:'flex-start'}}>
            <Icon name="calendar-outline" size={20} color="#EDBF31"/>
              <View style={{marginLeft:12}}>
                <CustomText fontType='primary' weight='Bold' style={{color:'#959595', fontSize:10, fontWeight:'500',textAlign:'left',marginBottom:0,textTransform:'uppercase'}}>Start Time</CustomText>
                <CustomText fontType='primary' weight='Medium' style={{color:'#fff', fontSize:12, fontWeight:'500'}}>{formatDate(startDateTime,'short')}</CustomText>
              </View>
              </View>
            </TouchableHighlight>  

            <TouchableHighlight underlayColor='#2C2C2E' onPress={()=>navigator.navigate('DatePicker',{from:'home'})} style={{flexDirection:'row',alignItems:'center',justifyContent:'flex-start',backgroundColor:'#1C1C1E',borderBottomColor:'#a3a3a3',paddingLeft:16,paddingVertical:16,width:'50%'}}>
              <View style={{flexDirection:'row',alignItems:'center', justifyContent:'flex-start'}}>
                  <Icon name="calendar-outline" size={20} color="#EDBF31"/>
                    <View style={{marginLeft:12}}>
                      <CustomText fontType='primary' weight='Medium' style={{color:'#959595', fontSize:10, fontWeight:'500',textAlign:'left',marginBottom:0,textTransform:'uppercase',letterSpacing:.15,fontFamily:'Inter-Bold'}}>End Time</CustomText>
                      <CustomText fontType='primary' weight='Medium' style={{color:'#fff', fontSize:12, fontWeight:'500'}}>{formatDate(endDateTime,'short')}</CustomText>
                    </View>
              </View>
            </TouchableHighlight>  

            </View>


            <TouchableHighlight underlayColor={'#af8a1a'} onPress={()=>navigator.navigate('CarsListing')} style={{backgroundColor:BRAND_COLOR,paddingHorizontal:0,paddingVertical:20}}>
                <CustomText fontType='primary' weight='Bold' style={{color:'#000', fontSize:12, fontWeight:'600',textAlign:'center',textTransform:'uppercase'}}>Search Cars</CustomText>
            </TouchableHighlight> 
        </View>
        </View>
        
        {/* <FeatureCars cars={cars} navigation={navigator}/> */}
        
        {/* <OfferBannerBlock/> */}
            
          <WhyChooseCocarr/>

          <OfferSlider/>

          <FaqBlock/>

          {showCityChange && <LocationChangeNotificationScreen show={showCityChange} setShow={setShowCityChange} onPress={(data,city)=>{
          console.log('on click data',data)
          console.log('on click city',city)
          dispatch(setShowCityLocation({
            selectedCity: city,
            selectedLocation: {name:data.formatted_address,place_id:data.place_id}
          }))
          setShowCityChange(false)
        }}/>}
        {showLocationValid && <LocationInvalidScreen show={showLocationValid} setShow={setShowLocationValid} onPress={()=>{
          setShowLocationValid(false)
        }}/>}
    </ScrollView>
  );
}


const PremiumMemberships = () => {
  const navigator = useNavigation()
  return (
    <TouchableHighlight underlayColor='#2C2C2E' onPress={()=>navigator.navigate('PremiumMembership')} style={{backgroundColor:'#1c1c1e',paddingHorizontal:0,paddingVertical:12,marginHorizontal:16,borderRadius:12,marginBottom:24}}>

    <View style={{flexDirection:'column', justifyContent:'space-between', alignItems:'center', paddingVertical:0,paddingHorizontal:12,alignContent:"center",width:'100%'}} >

      <View style={{flexDirection:'row', alignItems:'center', justifyContent:'flex-start',paddingHorizontal:4,paddingVertical:2,width:'100%'}}>

        <View style={{backgroundColor:'#2c2c2e',borderRadius:8,height:32,width:32,justifyContent:'center',alignItems:'center'}}>
          <Icon name="star-outline" size={16} color={BRAND_COLOR}/> 
        </View>
        <View style={{flex:1}}>
        <CustomText fontType='primary' weight='Medium' style={{color:BRAND_COLOR, fontSize:12,letterSpacing:-0.05,marginLeft:12,lineHeight:16}}>Buy Premium Memberships and get 10% off on your all bookings</CustomText>
        </View>
        <View style={{marginLeft:'auto',paddingLeft:12}}>
          <Icon name="chevron-forward-outline" size={16} color={BRAND_COLOR}/>
        </View>
      </View>

    </View>
    </TouchableHighlight>
  )
}

const WhyChooseCocarr = () => {

  const feaures = [{icon:'time-outline',title:'24/7',description:'Customer Support'},{icon:'home-outline',title:'Delivery',description:'Anywhere, Anytime'},{icon:'pricetags-outline',title:'Offers',description:'Exclusive Deals'}]
  return (
    <View style={{flexDirection:'column', justifyContent:'space-between', alignItems:'center', paddingVertical:40,alignContent:"center"}}>
          <CustomText fontType='primary' weight='Bold' style={{color:'#e3e3e3', fontSize:13, fontWeight:'600',textAlign:'center',textTransform:'uppercase',letterSpacing:.15}}>Why Choose Cocarr?</CustomText>
    <View style={{flexDirection:'row', justifyContent:'space-between', alignItems:'center', paddingHorizontal:24,paddingVertical:20,alignContent:"center"}}>
      {
        feaures.map((item,index) => (
          <View key={index} style={{flexDirection:'column', justifyContent:'center', alignItems:'center', paddingHorizontal:4,alignContent:"center",flex:1,paddingVertical:12}}>
          <View style={{flexDirection:'column', justifyContent:'center', alignItems:'center', paddingHorizontal:4,alignContent:"center",flex:1,backgroundColor:'#1C1C1E',borderRadius:40,paddingHorizontal:16,paddingVertical:16,marginBottom:4}}>
            <Icon name={item.icon} size={20} color="#EDBF31"/>
          </View>
          <CustomText fontType='primary' weight='SemiBold' style={{color:'#fff', fontSize:11, fontWeight:'600',textAlign:'center',letterSpacing:.15}}>{item.title}</CustomText>
          <CustomText fontType='primary' weight='Regular' style={{color:'#a3a3a3', fontSize:10, fontWeight:'400',textAlign:'center',letterSpacing:.15}}>{item.description}</CustomText>
        </View>
        ))
      }
    </View>
    </View>
  )
}


const OfferSlider = ({navigation}) => {

  const [offers, setOffers] = useState([])

  const getOffers = async () => {
    const response = await axios.get(`${API_URL}/offers?limit=6`)
    setOffers(response.data)
  }

  useEffect(() => {
    getOffers()
  }, [])

  return (
    <View style={{flexDirection:'column', justifyContent:'space-between', alignItems:'center', backgroundColor:'#000'}}>
      <View style={{flexDirection:'column', justifyContent:'space-between', alignItems:'center', paddingLeft:20,marginBottom:32}}> 
          <Text style={{color:'#e3e3e3', fontSize:16, fontWeight:'500',marginBottom:1}}>
            Offers
          </Text>
          <Text style={{color:'#a3a3a3', fontSize:12, fontWeight:'400'}}>
          Get exciting discounts and deals on your rides
          </Text>

      </View>
          <ScrollView alwaysBounceHorizontal={true} horizontal showsHorizontalScrollIndicator={false} style={{flexDirection:'row'}}>
            {offers.length === 0 ? (
              <>
                {[1,2,3].map((item) => (
                  <View key={item} style={{marginRight: 16}}>
                    <View style={{
                      width: 180,
                      height: 120,
                      borderRadius: 10,
                      backgroundColor: '#1C1C1E',
                      opacity: 0.7
                    }}>
                      <View style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: '#1C1C1E',
                        opacity: 0.3,
                        transform: [{translateX: -100}],
                        animation: 'shimmer 1s infinite'
                      }} />
                    </View>
                    <View style={{marginTop: 8}}>
                      <View style={{
                        width: 80,
                        height: 16,
                        borderRadius: 4,
                        backgroundColor: '#1C1C1E',
                        marginBottom: 4,
                        opacity: 0.7
                      }} />
                      <View style={{
                        width: 60,
                        height: 16,
                        borderRadius: 4,
                        backgroundColor: '#1C1C1E',
                        opacity: 0.7
                      }} />
                    </View>
                  </View>
                ))}
              </>
            ) : (
              offers.map((car,index) => (
                <TouchableOpacity key={index} style={{marginRight: 16,marginLeft:index === 0 ? 24 : 0, backgroundColor:'#1C1C1E',borderRadius:10,borderWidth:1,borderColor:'#252525',paddingVertical:12,paddingHorizontal:16}} >
                  {/* {car.images && car.images.length > 0 && <Image source={{uri:car.images[0].url}} style={{width:180, height:120, borderRadius:10,borderBottomLeftRadius:0,borderBottomRightRadius:0,backgroundColor:'#757575'}}/>} */}
                  <View style={{flexDirection:'column', justifyContent:'space-between', alignItems:'flex-start',paddingVertical:8,paddingHorizontal:12}}>
                    <CustomText fontType='primary' weight='Regular' style={{color:'#fff', fontSize:13,marginBottom:4, fontWeight:'400'}}>{car.description}</CustomText>
                    <CustomText fontType='primary' weight='Medium' style={{color:'#EDBF31', fontSize:11, fontWeight:'500',marginTop:2}}>CODE: {car.code}</CustomText>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
         
        </View>
  )
}


const FeatureCars = ({navigation,cars}) => {


  return (
    <View style={{flexDirection:'column', justifyContent:'space-between', alignItems:'center', paddingVertical:40}}>
      <View style={{flexDirection:'column', justifyContent:'space-between', alignItems:'center', paddingLeft:20,marginBottom:32}}> 
          <CustomText fontType='primary' weight='Bold' style={{color:'#efefef', fontSize:14,textTransform:'uppercase',letterSpacing:.15,marginBottom:1}}>
            Top Cars
          </CustomText>
          <CustomText fontType='primary' weight='Medium' style={{color:'#a3a3a3', fontSize:12}}>
            Cars Rated 4.5+ by customers
          </CustomText>

      </View>
          <ScrollView alwaysBounceHorizontal={true} horizontal showsHorizontalScrollIndicator={false} style={{flexDirection:'row'}}>
            {cars.length === 0 ? (
              <View style={{flexDirection:'row', justifyContent:'space-between', alignItems:'center',paddingHorizontal:24,alignContent:"center"}}>
                {[1,2,3].map((item) => (
                  <View key={item} style={{marginRight: 16}}>
                    <View style={{
                      width: 180,
                      height: 120,
                      borderRadius: 10,
                      backgroundColor: '#1C1C1E',
                      opacity: 0.7
                    }}>
                      <View style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: '#1C1C1E',
                        opacity: 0.3,
                        animation: 'shimmer 1s infinite'
                      }} />
                    </View>
                    <View style={{marginTop: 8}}>
                      <View style={{
                        width: 80,
                        height: 16,
                        borderRadius: 4,
                        backgroundColor: '#1C1C1E',
                        marginBottom: 4,
                        opacity: 0.7
                      }} />
                      <View style={{
                        width: 60,
                        height: 16,
                        borderRadius: 4,
                        backgroundColor: '#1C1C1E',
                        opacity: 0.7
                      }} />
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              cars.map((car,index) => (
                <TouchableOpacity key={index} style={{marginRight: 16,marginLeft:index === 0 ? 24 : 0, backgroundColor:'#1c1c1e',borderRadius:10}} onPress={()=>navigation.navigate('CarInfo', {vehicleId:car.vehicleId})}>
                  {car.images && car.images.length > 0 && <Image source={{uri:car.images[0].url}} style={{width:180, height:120, borderRadius:10,borderBottomLeftRadius:0,borderBottomRightRadius:0,backgroundColor:'#2c2c2e'}}/>}
                  <View style={{flexDirection:'column', justifyContent:'space-between', alignItems:'flex-start',paddingVertical:10,paddingHorizontal:12}}>
                    <CustomText fontType='primary' weight='Regular' style={{color:'#e3e3e3', fontSize:12}}>{car.brand.name} {car.vehicleName}</CustomText>
                    <CustomText fontType='primary' weight='SemiBold' style={{color:'#959595', fontSize:10,textTransform:'uppercase',letterSpacing:.15 }}>{car.vehicleFuelType} · {car.vehicleSeats} Seater · {car.vehicleYear}</CustomText>
                    <View style={{flexDirection:'row', alignItems:'flex-end', justifyContent:'flex-end',marginTop:4}}>
                      <FontAwesome name="rupee" size={13} color="#fff" style={{marginBottom:3}} />
                      <CustomText fontType='primary' weight='Medium' style={{color:'#fff', fontSize:14,marginLeft:2}}>{car.vehiclePlan[0].perHourFee}</CustomText>
                      <CustomText fontType='primary' weight='Medium' style={{color:'#efefef', fontSize:12,marginLeft:2,marginBottom:1}}>/ Hr</CustomText>
                    </View>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
         
        </View>
  )
}


const OfferBannerBlock = () => {
  const width = Dimensions.get('window').width;
  const images = [{image:'https://cocarr.s3.ap-south-1.amazonaws.com/183ff1c2-1f85-43f8-9684-81401e41d86c'},{image:'https://cocarr.s3.ap-south-1.amazonaws.com/183ff1c2-1f85-43f8-9684-81401e41d86c'},{image:'https://cocarr.s3.ap-south-1.amazonaws.com/183ff1c2-1f85-43f8-9684-81401e41d86c'}]
  return (
    <View style={{flexDirection:'column', justifyContent:'space-between', alignItems:'center', paddingVertical:40,paddingHorizontal:24}}>
      <CustomText fontType='primary' weight='Bold' style={{color:'#fff', fontSize:14,textTransform:'uppercase',letterSpacing:.15,marginBottom:12}}>Offers</CustomText>
      {/* {images.length > 0 ? ( */}
        <Carousel style={{width:width,height:320}} 
        loop
        width={280}
        height={320}
        autoPlay={true}
        data={images}
        scrollAnimationDuration={3000}
        // pagingEnabled={true}
        // mode='horizontal-stack'
        // snapEnabled={true}
        // dragEnabled={true}
        autoPlayInterval={4000}
        // key={index}
        
        renderItem={({ item:it ,index}) => {
          console.log('it',it)
          return (
            <View
            style={{
              flex: 1,
              borderWidth: 1,
              justifyContent: 'center',
              backgroundColor:'#1C1C1E',
              borderRadius:10,
              marginRight:12,
              // transform: [{translateX:in -100}],
              // animation: 'shimmer 1s infinite'
              overflow:'hidden'
            }}
            >
                <Image source={{ uri: it.image }} key={index} style={{width:'100%',height:320,borderRadius:10}}/>
            </View> 
            )
          }}
          />
        {/* ) : null} */}
      </View>
  )
}


const FaqBlock = () => {

  const [activeQuestion, setActiveQuestion] = useState(0)
  const faqData = [
    {question:'What is Cocarr?', answer:'Cocarr is a car rental service that allows you to rent cars for short periods of time.'},
    {question:'How does Cocarr work?', answer:'Cocarr works by allowing you to rent cars for short periods of time.'},
    {question:'What are the benefits of using Cocarr?', answer:'The benefits of using Cocarr are that you can rent cars for short periods of time.'},
  ]

  const renderItem = ({item}) => {
    return (
      <View style={{paddingVertical:12,borderBottomWidth:1,borderBottomColor:'#2c2c2e'}}>
        <CustomText fontType='primary' weight='Bold' style={{color:'#757575', fontSize:11, fontWeight:'500',marginBottom:4,textTransform:'uppercase',letterSpacing:.15,fontFamily:'Inter-Bold',marginBottom:2}}>{item.question}</CustomText>
        <CustomText fontType='primary' weight='Regular' style={{color:'#e3e3e3', fontSize:12, fontWeight:'400',lineHeight:18}}>{item.answer}</CustomText>
      </View>
    )
  }
  return (
    <View style={{flexDirection:'column', justifyContent:'space-between', alignItems:'center', paddingVertical:40,paddingHorizontal:24}}>
      <View style={{flexDirection:'column', justifyContent:'space-between', alignItems:'center', paddingLeft:20,marginBottom:32}}> 
          <CustomText fontType='primary' weight='Medium' style={{color:'#e3e3e3', fontSize:16, fontWeight:'500',marginBottom:1}}>
            FAQ
          </CustomText>
      </View>
      <View>
        {faqData.map((item,index) => (
          <View key={index} style={{paddingVertical:12,borderBottomWidth:1,borderBottomColor:'#2c2c2e'}}>
            <CustomText fontType='primary' weight='Bold' style={{color:'#757575', fontSize:11, fontWeight:'500',marginBottom:4,textTransform:'uppercase',letterSpacing:.15,fontFamily:'Inter-Bold',marginBottom:2}}>{item.question}</CustomText>
            <CustomText fontType='primary' weight='Regular' style={{color:'#e3e3e3', fontSize:12, fontWeight:'400',lineHeight:18}}>{item.answer}</CustomText>
          </View>
        ))}
      </View>
    </View>
  )
}