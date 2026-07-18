import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Platform, FlatList } from 'react-native';
// import DateTimePicker from '@react-native-community/datetimepicker';
import Icon from 'react-native-vector-icons/Ionicons';
import { Calendar } from 'react-native-calendars';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { setSelectedCity  as setSelectedCityAction, setShowCityPicker} from '../../store/bookingSlice';
import axios from 'axios';
import { API_URL, BRAND_COLOR } from '../../utils/constants';
import ActionSheet, { ScrollView } from 'react-native-actions-sheet';
import CustomText from '../../components/CustomText';

export function CityPickerScreen() {
  // const [selectedCity, setSelectedCity] = useState(null);
  const [cities, setCities] = useState([]);
  const navigation = useNavigation();
  const bookingInfo = useSelector(state => state.booking);
  const dispatch = useDispatch();
  const actionSheetRef = useRef(null);
    useEffect(() => {

        // navigation.setOptions({
        //     headerShown: true,
        //     headerTitle: 'Select City',
        //     headerTitleAlign: 'center',
        //     headerTitleStyle: {
        //       color: '#e3e3e3',
        //       fontSize: 13,
        //       fontWeight: '500',
        //     },
        //     headerLeft: () => <TouchableOpacity onPress={() => navigation.goBack()}><Icon name="chevron-back" size={20} color="#a3a3a3" /></TouchableOpacity>,
        //     headerStyle: {
        //       backgroundColor: '#000',
        //     },
        //     headerTintColor: '#fff',
        //   })

        fetchCities();
    }, []);

    useEffect(() => {
        if (bookingInfo.showCityPicker) {
            actionSheetRef.current.show();
        }
        // else {
        //     actionSheetRef.current.hide();
        // }
    }, [bookingInfo.showCityPicker]);

    async function fetchCities() {
        try {
            const response = await axios.get(`${API_URL}/city`);
            setCities(response.data);
            console.log('response.data', response.data)
        } catch (error) {
            console.error('Error fetching cities:', error);
        }
    }

  const handleConfirm = (item) => 
    {
        try {
            dispatch(setSelectedCityAction({id:item.id,name:item.name,showCityPicker:false}));
            actionSheetRef.current.hide();
        } catch (error) {
            console.error('Error confirming city selection:', error);
        }
  };

  const onClose = () => {
    dispatch(setShowCityPicker(false));
    actionSheetRef.current.hide();
  }

  return (
    <ActionSheet
      CustomHeaderComponent={<CustomText fontType='primary' weight='Bold' style={{color:'#fff', fontSize:14, fontWeight:'500',textTransform:'uppercase',letterSpacing:.15,fontFamily:'Inter-Bold',marginBottom:2}}>Select City</CustomText>}
      ref={actionSheetRef}
      containerStyle={{backgroundColor:'#2c2c2e',minHeight:'75%'}}
      isModal={true}
      isVisible={true}
      onClose={onClose}
      defaultOverlayOpacity={0.75}
      // gestureEnabled={true}
    >
      <View style={styles.modalContainer}>
        {/* <View style={{flex:1,width:'100%',height:300}}> */}
          {/* <ScrollView style={{flex:1}} contentContainerStyle={{flexGrow:1}}> */}

        {/* <CustomText fontType='primary' weight='Bold' style={{color:'#a3a3a3', fontSize:14, fontWeight:'500',textTransform:'uppercase',letterSpacing:.15,fontFamily:'Inter-Bold',marginBottom:2}}>Select City</CustomText> */}
        <FlatList
            data={cities}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.cityItem} onPress={() => handleConfirm(item)}>
                <Icon name={bookingInfo.selectedCity?.id === item.id ? "checkmark-circle" : "checkmark-circle-outline"} size={20} color={bookingInfo.selectedCity?.id === item.id ? BRAND_COLOR : '#a3a3a3'} />
                    <CustomText fontType='primary' weight='Regular' style={{color:'#e3e3e3', fontSize:14,textTransform:'capitalize'}}>{item.name}</CustomText>
                </TouchableOpacity>
            )}
            />
            {/* </ScrollView> */}

          {/* <TouchableOpacity 
            style={[
              styles.confirmButton,
              (!selectedCity) && styles.confirmButtonDisabled
            ]} 
            onPress={handleConfirm}
            disabled={!selectedCity}
          >
            <CustomText fontType='primary' weight='Bold' style={{color:'#000', fontSize:14, fontWeight:'500'}}>Save Selected City</CustomText>
          </TouchableOpacity> */}
        </View>
      {/* </View> */}
    </ActionSheet>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    paddingTop:24
    // flex: 1,
    // paddingHorizontal:16,
    // paddingVertical:16,
    // backgroundColor: 'rgba(0,0,0,0.5)',
    // justifyContent: 'flex-end',
  },
  contentContainer: {
    flex: 1,
    // height:'100%',
    paddingHorizontal:24,
    paddingVertical:24
  },
  modalContent: {
    // backgroundColor: '#000',
    height: '100%',
    flex: 1,
    paddingHorizontal:24,
    paddingVertical:24
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  cityItem: {
    flexDirection:'row',
    alignItems:'center',
    gap:12,
    paddingHorizontal: 24,
    paddingVertical: 16,
    textAlign:'left',
    textTransform:'capitalize',
    borderBottomWidth: 1,
    borderBottomColor: '#2c2c2e',
  },
  confirmButton: {
    backgroundColor: '#EDBF31',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmButtonDisabled: {
    backgroundColor: '#4C4C4E',
  },
  confirmButtonText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '500',
  },
});

