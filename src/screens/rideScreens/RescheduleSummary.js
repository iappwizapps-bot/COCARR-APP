import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Platform, FlatList, Image, TextInput, Alert, ActivityIndicator, ToastAndroid, ScrollView } from 'react-native';

import axios from 'axios';
import { API_URL, BRAND_COLOR } from '../../utils/constants';
import ActionSheet from 'react-native-actions-sheet';
import CustomText from '../../components/CustomText';
import { formatDate } from '../../utils/utils';
import { Calendar } from 'react-native-calendars';

export default function RescheduleSummary({id,setShow,show}) {
  const actionRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [booking, setBooking] = useState({});
  const [startDate, setStartDate] = useState(null);
  const [startTime,setStartTime] = useState(null);

  useEffect(() => {
    async function getRescheduleSummary() {
      try {
        const response = await axios.post(`${API_URL}/booking/${id}`);
        setBooking(response.data);
        setIsLoading(false);
      }
      catch(error) {
        setIsLoading(false);
        setShow(false);
        // ToastAndroid.show('Error', error.message);
      }
    }
    getRescheduleSummary();
  }, []);

  useEffect(() => {
    if(show) actionRef.current?.show();
  }, [show]);

  const onClose = () => {
    setShow(false);
    actionRef.current?.hide();
  }

  return (
    <ActionSheet ref={actionRef} onClose={onClose} containerStyle={{backgroundColor:'#2c2c2e'}} isModal={true}>
      {isLoading ? <ActivityIndicator size="large" color={BRAND_COLOR} /> : 
      <ScrollView> 

        <View style={{flexDirection:'row',gap:12,paddingHorizontal:16,backgroundColor:'#101012',borderRadius:10,paddingVertical:12,marginVertical:8,marginHorizontal:16}}>
            <View >
                <Text style={{...styles.vehicleName,fontSize:12}}>{booking.vehicle?.brand?.name} {booking.vehicle?.vehicleName}</Text>
                <Text style={{...styles.vehicleYear,fontSize:12}}>{booking.vehicle?.vehicleNumber}</Text>
                <Text style={styles.headerPrimaryText}>{formatDate(booking.startTime,'long')} - {formatDate(booking.endTime,'long')}</Text>
            </View>
        </View>
                 
                  {/* <Calendar
            style={styles.calendar}
            theme={{
              calendarBackground: '#1c1c1e',
              textSectionTitleColor: '#fff',
              dayTextColor: '#fff',
              textSectionTitleColor:' #fff',
              todayTextColor: '#EDBF31',
              selectedDayTextColor: '#000',
              monthTextColor: '#fff',
              textDayFontFamily: 'Inter-Medium',
              textMonthFontFamily: 'Inter-Medium',
              textDayHeaderFontFamily: 'Inter-SemiBold',
              textDayHeaderColor: '#a3a3a3',
              textDayHeaderFontSize: 12,
              textDayHeaderTextTransform: 'uppercase',
              textDayFontSize: 13,
              textMonthFontSize: 12,
              monthFontTextTransform: 'uppercase',
              textDisabledColor: '#444',
              arrowColor: '#EDBF31',
              selectedDayBackgroundColor: '#EDBF31'
            }}
            minDate={new Date().toISOString().split('T')[0]}
            markedDates={{
              [startDate]: {
                selected: true,
                selectedColor: '#EDBF31'
              }
            }}
            onDayPress={(day) => setStartDate(day.dateString)}
          /> */}
{/* 
        <View style={{flex: 1,flexDirection: 'column'}}>
          <View style={styles.timePickerContainer}>
            <CustomText fontType='primary' weight='ExtraBold' style={styles.timePickerLabel}>Start Time</CustomText>
            <View style={{overflow: 'hidden',backgroundColor: '#1c1c1e',borderRadius: 8,padding: 8,paddingHorizontal: 0}}>

              <FlatList
                horizontal
                data={startTimeSlots}
                keyExtractor={(item) => item.value.toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity onPress={() => setStartTime(item.value)} style={{backgroundColor: item.value === startTime ? '#EDBF311e' : '#1c1c1e',borderRadius: 24,marginHorizontal: 5}}>
                    <CustomText weight='Medium' style={[
                      styles.timeSlot,
                      item.value === startTime && styles.selectedTimeSlot
                    ]}>
                      {item.label}
                    </CustomText>
                  </TouchableOpacity>
                )}
                decelerationRate="fast"
                showsHorizontalScrollIndicator={false}
              />
            </View>
          </View>
        </View> */}
     
      </ScrollView>}
    </ActionSheet>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    paddingTop:24,
    paddingHorizontal:24,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal:24,
    paddingVertical:24
  },
  modalContent: {
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
  calendar: {
    marginBottom: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#000',
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  timeSection: {
    marginHorizontal: 5,
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
    backgroundColor: '#D43535',
    padding: 12,
    borderRadius: 6,
    flex:1,
    color:'#fff'
  },
  backButton: {
    backgroundColor: '#1f1f1f',
    padding: 12,
    borderRadius: 6,
    flex:1,
    color:'#fff'
  },
  confirmButtonDisabled: {
    backgroundColor: '#4C4C4E',
    color:'#a3a3a3'
  },
  confirmButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
