import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Platform, FlatList, Image, TextInput, Alert, ActivityIndicator } from 'react-native';
// import DateTimePicker from '@react-native-community/datetimepicker';
import Icon from 'react-native-vector-icons/AntDesign';
import { useDispatch, useSelector } from 'react-redux';
import { setShowLastBooking} from '../../../store/bookingSlice';
import axios from 'axios';
import { API_URL, BRAND_COLOR } from '../../../utils/constants';
import ActionSheet, { ScrollView } from 'react-native-actions-sheet';
import CustomText from '../../../components/CustomText';
import { useNavigation } from '@react-navigation/native';

export function HostReviewScreen({bookingInfo,onClose,show}) {
  const [isLoading, setIsLoading] = useState(false);
  const navigation = useNavigation();
  const [review, setReview] = useState({
    totalRating: '',
    comment: ''
  });
  const dispatch = useDispatch();
  const actionSheetRef = useRef(null);

  useEffect(()=>{
    console.log('show',bookingInfo);
    if(show){
      actionSheetRef.current.show();
    }
    else{
      actionSheetRef.current.hide();
    }
  },[show]);

  const submitReview = async () => 
    {
        try {
          setIsLoading(true);
          const response = await axios.post(`${API_URL}/host/bookings/review/${bookingInfo.id}`, {
            totalRating: review.totalRating,
            comment: review.comment
          });
          onClose();
          navigation.goBack('HostBookingInfo',{bookingId:bookingInfo.id});
        } catch (error) {
            console.error('Error submitting review:', error.message);
            Alert.alert('Error', error.message);
        }
        setIsLoading(false);
  };


  return (
    <ActionSheet
      ref={actionSheetRef}
      containerStyle={{backgroundColor:'#2c2c2e'}}
      isModal={true}
      closeOnTouchOutside={false}
      closeOnPressBack={false}
      draggable={false}
      closeOnTouchBackdrop={false}
      isVisible={true}
      onClose={onClose}
      defaultOverlayOpacity={0.75}
      // gestureEnabled={true}
    >
        <ScrollView style={styles.modalContainer}>


        <View style={{paddingBottom:12,borderBottomWidth:1,borderBottomColor:'#3c3c3c',borderTopWidth:0,borderTopColor:'#3c3c3c'}}>
          <CustomText fontType='primary' weight='SemiBold' style={{color:'#e3e3e3', fontSize:11, fontWeight:'500',marginBottom:1,textAlign:'center',textTransform:'uppercase'}}>#{bookingInfo.bookingId}</CustomText>
          <CustomText fontType='primary' weight='Regular' style={{color:'#a3a3a3', fontSize:12,marginBottom:1,textAlign:'center'}}>{bookingInfo.vehicle.brand?.name} - {bookingInfo.vehicle.vehicleNumber}</CustomText>
        </View>

        <View style={{paddingVertical:24}}>
      <StarRating rating={review.totalRating} title='Rate the Guest' setRating={(value)=>setReview({...review,totalRating:value})} />
          <View style={{marginVertical:12,position:'relative'}}>
            <CustomText fontType='primary' weight='Regular' style={{color:'#959595', fontSize:11,letterSpacing:.05,position:'absolute',right:12,bottom:24,zIndex:9}}>{review.comment.length}/200</CustomText>
            <TextInput
             numberOfLines={4}
             
            style={{backgroundColor:'#1c1c1e',padding:12,borderRadius:8,marginVertical:12,textAlign:'left',verticalAlign:'top'}}
            placeholder='Write a review'
            value={review.comment}
            placeholderTextColor='#757575'
            maxLength={200}
            onChangeText={(value)=>setReview({...review,comment:value})}
            />
         </View>
        </View>
        <View style={{paddingBottom:24}}>

          <TouchableOpacity 
            style={[
              styles.confirmButton,
              (!review.totalRating || !review.comment || isLoading) && styles.confirmButtonDisabled
            ]} 
            onPress={submitReview}
            disabled={!review.totalRating || !review.comment || isLoading}
            >
            <CustomText fontType='primary' weight='Bold' style={{ fontSize:12, fontWeight:'500',textTransform:'uppercase'}}>{isLoading ? 'Submitting...' : 'Submit Review'}</CustomText>
          </TouchableOpacity>
            </View>
        </ScrollView> 
    </ActionSheet>
  );
}



const StarRating = ({ rating, setRating, title }) => {
  const handleStarPress = (index) => {
    setRating(index + 1);
  };

  return (
    <View style={{flexDirection:'row', justifyContent:'space-between',marginVertical:12, alignItems:'center',gap:10}}>
      <CustomText fontType='primary' weight='Bold' style={{color:'#a3a3a3', fontSize:12, marginBottom:1,textAlign:'center',letterSpacing:-.015,textTransform:'uppercase'}}>{title}</CustomText>
    <View style={{ flexDirection: 'row', justifyContent: 'center'}}>
      {[...Array(5)].map((_, index) => (
        <TouchableOpacity key={index} onPress={() => handleStarPress(index)}>
          <Icon
            name={index < rating ? 'star' : 'staro'}
            size={30}
            style={{marginLeft:2}}
            color={index < rating ? '#EDBF31' : '#808080'}
            />
        </TouchableOpacity>
      ))}
    </View>
      </View>
  );
};




const styles = StyleSheet.create({
  modalContainer: {
    paddingTop:24,
    paddingHorizontal:24,
    // minHeight:'45%',
    // flex:1,
    // alignItems:'space-between',
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
    color:'#fff'
  },
  confirmButtonDisabled: {
    backgroundColor: '#4C4C4E',
    color:'#a3a3a3'
  },
  confirmButtonText: {
    // color: '#000',
    fontSize: 14,
    fontWeight: '500',
  },
});

