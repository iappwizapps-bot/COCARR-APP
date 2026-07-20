import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Platform, FlatList } from 'react-native';
// import DateTimePicker from '@react-native-community/datetimepicker';
import Icon from 'react-native-vector-icons/Ionicons';
import { Calendar } from 'react-native-calendars';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { setSelectedCity  as setSelectedCityAction, setShowCityPicker, setShowCityLocation} from '../../store/bookingSlice';
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
        } catch (error) {
            console.error('Error fetching cities:', error);
        }
    }

  // Selecting a city also fills the location field with that city's
  // coordinates, resolved to a readable address when possible.
  const handleConfirm = async (item) => {
        try {
            const detectedLocation = {
                name: item.name,
                latitude: item.lat,
                longitude: item.lng,
            };
            try {
                const res = await axios.get(`${API_URL}/utility/get-place?lat=${item.lat}&long=${item.lng}`);
                if (res.data) detectedLocation.name = res.data;
            } catch (e) {
                // fall back to the city name
            }
            dispatch(setShowCityLocation({
                selectedCity: { id: item.id, name: item.name },
                selectedLocation: detectedLocation,
            }));
            dispatch(setShowCityPicker(false));
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
      CustomHeaderComponent={
        <View style={styles.sheetHeader}>
          <CustomText fontType='primary' weight='Bold' style={{color:'#fff', fontSize:14, fontWeight:'500',textTransform:'uppercase',letterSpacing:.15,fontFamily:'Inter-Bold'}}>Select City</CustomText>
          <TouchableOpacity onPress={onClose} hitSlop={{top:12,bottom:12,left:12,right:12}} style={styles.closeButton}>
            <Icon name="close" size={20} color="#e3e3e3" />
          </TouchableOpacity>
        </View>
      }
      ref={actionSheetRef}
      containerStyle={{backgroundColor:'#1c1c1e',minHeight:'70%'}}
      isModal={true}
      isVisible={true}
      onClose={onClose}
      defaultOverlayOpacity={0.75}
    >
      <View style={styles.modalContainer}>
        <FlatList
          data={cities}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const selected = bookingInfo.selectedCity?.id === item.id;
            return (
              <TouchableOpacity style={[styles.cityItem, selected && styles.cityItemSelected]} onPress={() => handleConfirm(item)}>
                <Icon name="location-outline" size={18} color={selected ? BRAND_COLOR : '#8a8a8a'} />
                <CustomText fontType='primary' weight={selected ? 'Medium' : 'Regular'} style={{flex:1, color: selected ? '#fff' : '#e3e3e3', fontSize:15, textTransform:'capitalize'}}>{item.name}</CustomText>
                {selected && <Icon name="checkmark-circle" size={20} color={BRAND_COLOR} />}
              </TouchableOpacity>
            );
          }}
        />
      </View>
    </ActionSheet>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    paddingTop: 8,
    paddingBottom: 24,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 4,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2c2c2e',
  },
  closeButton: {
    height: 32,
    width: 32,
    borderRadius: 16,
    backgroundColor: '#2c2c2e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cityItemSelected: {
    backgroundColor: '#232326',
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
    gap:14,
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#252528',
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

