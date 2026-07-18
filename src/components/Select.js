import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity,TouchableHighlight } from 'react-native';
import ActionSheet, { ScrollView } from 'react-native-actions-sheet';
import CustomText from './CustomText';
import Icons from 'react-native-vector-icons/Ionicons';

const Select = ({ options, selected, onSelect ,label='name',placeholder='Select an option',containerStyle}) => {
  const [selectedOption, setSelectedOption] = useState(selected);
  const actionSheetRef = useRef(null);

  useEffect(() => {
    setSelectedOption(selected);
  }, [selected]);

  const handleSelect = (option) => {
    setSelectedOption(option);
    onSelect(option);
    actionSheetRef.current?.hide();
  };

  return (
    <View style={{flexDirection:'row', alignItems:'center', justifyContent:'space-between', backgroundColor:'#1c1c1e',borderRadius:5,shadowOpacity:0.5,shadowRadius:1,shadowColor:'#454545',width:'100%',...containerStyle}}>
      <TouchableOpacity onPress={() => actionSheetRef.current?.show()} style={{flex:1,paddingVertical:12,paddingHorizontal:12,justifyContent:'space-between',flexDirection:'row',alignItems:'center'}}>
        <Text>{selectedOption ? selectedOption[label] : placeholder}</Text>
        <Icons name="chevron-down" size={13} color="#959595" style={{marginBottom:3,marginLeft:4}} />
      </TouchableOpacity>
      <ActionSheet ref={actionSheetRef} containerStyle={{backgroundColor:'#1c1c1e',height:'50%'}} height={'50%'} safeAreaInsets={{bottom:0}}>
        <ScrollView style={{paddingHorizontal:16,paddingVertical:24}}>

        {options.map((option, index) => (
          <TouchableHighlight underlayColor='#090909' style={{borderRadius:8}} key={index} onPress={() => handleSelect(option)}>
            <CustomText fontType='primary' weight='SemiBold' style={{color:'#efefef', fontSize:13,textTransform:'uppercase',letterSpacing:-.15,paddingVertical:12,paddingHorizontal:12,borderBottomWidth:1,borderBottomColor:'#1d1d1d'}}>{option[label]}</CustomText>
          </TouchableHighlight>
        ))}
        </ScrollView>
      </ActionSheet>
    </View>
  );  
};

export default Select;
