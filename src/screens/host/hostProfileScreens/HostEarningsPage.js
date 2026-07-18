import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Image, StatusBar, TouchableHighlight, ActivityIndicator, ToastAndroid, ScrollView, RefreshControl } from 'react-native';
import axios from 'axios';
import { API_URL, BRAND_COLOR } from '../../../utils/constants';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import CustomText from '../../../components/CustomText';

export default function HostEarningsPage() {
  const [profile, setProfile] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation();

  const getMyProfile = async () => {
    try {
      const response = await axios.get(`${API_URL}/wallet/my-wallet`);
    console.log('profile',response.data);
      setProfile(response.data);
      setLoading(false);
    } catch (error) {
        console.log(error);
        setError(true);
        setLoading(false);
    }
};

const getTransactions = async () => {
    try {
        const response = await axios.get(`${API_URL}/wallet/my-transaction`);
        console.log('trasa',response.data);
      setTransactions(response.data);
      setLoading(false);
      setRefreshing(false);
    } catch (error) {
      setError(true);
      ToastAndroid.show('Something went wrong. Please try again later.');
      setLoading(false);
      setRefreshing(false);
    }
  };



  useEffect(() => {
    getMyProfile();
    getTransactions();
  }, []);

  const onPress = async () => {
    if(!profile.isPremium || profile.membership.isRenewable){
      await initiateBooking();
    }else{
      navigation.navigate('Home');
    }
  }

  if(loading){
    return <View style={{flex:1,justifyContent:'center',alignItems:'center',backgroundColor:'#000'}}>
      <ActivityIndicator size="large" color={BRAND_COLOR} />
    </View>
  }

  if(error){
    return <View style={{flex:1,justifyContent:'center',alignItems:'center',backgroundColor:'#000'}}>
      <CustomText fontType='primary' weight='Medium' style={{color:'#e3e3e3',fontSize:14,textAlign:'center',maxWidth:'75%',marginHorizontal:'auto',letterSpacing:0.05}}>Something went wrong. Please try again later.</CustomText>
    </View>
  }



  return (
    <View style={styles.container}>
        {/* <StatusBar barStyle={'light-content'} backgroundColor={'#1c1c1e'}/> */}
      <View style={styles.headerContainer}>
      <TouchableHighlight style={styles.backButton} onPress={() => navigation.goBack()}>
          <Icon name="chevron-back" size={20} color="#e3e3e3" />
        </TouchableHighlight>
    </View>

        <FlatList
        
        refreshControl={<RefreshControl titleColor={'#e3e3e3'} progressBackgroundColor={BRAND_COLOR} refreshing={refreshing} onRefresh={getTransactions} />}
        data={transactions}
        renderItem={({item}) => <View style={{borderBottomWidth:1,borderBottomColor:'#1c1c1e',paddingVertical:20,paddingHorizontal:16,flexDirection:'row',justifyContent:'space-between',alignItems:'center'}}>
            <View style={{flexDirection:'row',alignItems:'center',justifyContent:'flex-start',flex:1}}>
                <View style={{backgroundColor:'#2c2c2e',borderRadius:32,padding:4,height:32,width:32,justifyContent:'center',alignItems:'center',marginRight:12}}>
                    <FontAwesome name={'rupee'} size={16} color={'#29C08B'}  />
                </View>
                <View>

                <CustomText fontType='primary' weight='Medium' style={{color:'#e3e3e3',fontSize:13,fontWeight:'500',letterSpacing:-0.05}}>Weekly Payout</CustomText>
                <CustomText fontType='primary' weight='Medium' style={{color:'#a3a3a3',fontSize:11,fontWeight:'500',letterSpacing:-0.05}}>24 Feb 2025</CustomText>
                </View>
            </View>
                
          <CustomText fontType='primary' weight='Medium' style={{color:'#e3e3e3',fontSize:14,fontWeight:'500',textAlign:'center',maxWidth:'75%',marginHorizontal:'auto',letterSpacing:-0.05}}>Rs.{item.points}</CustomText>
        </View>}
      />
    </View>
  );
}




const styles = StyleSheet.create({
    headerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start',
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: '#000'
    },
    headerLeft: {
        flex:1,
        alignItems:'flex-start'
    },
    headerRight: {
        flex:1,
        alignItems:'flex-end',
        justifyContent:'center'
    },
    headerCenter: {
        flex:1,
        alignItems:'center',
        justifyContent:'center'
    },  
    headerTitle: {
        flex:1,
        alignItems:'center'
    },
  container: {
    flex: 1,
    backgroundColor: '#000'
  },
  listContainer: {
    padding: 16,
  },
  vehicleItem: {
    flexDirection: 'column',
    marginBottom: 16,
    backgroundColor: '#1C1C1E',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 8,
    overflow: 'hidden',
  },
  vehicleImage: {
    borderRadius: 12,
    width: '100%',
    height: 180,
  },
  vehicleInfo: {
    flex: 1,
    padding: 12,
    justifyContent: 'center',
  },
  vehicleName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  vehicleYear: {
    fontSize: 16,
    color: '#EDBF31',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
  },
});
