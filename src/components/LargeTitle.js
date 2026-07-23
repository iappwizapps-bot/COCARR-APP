import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import CustomText from './CustomText';

// iOS-style large page title. Left-aligned bold title with an optional
// subtitle, a back chevron when `showBack` is set, and room for a right action.
const LargeTitle = ({ title, subtitle, showBack = false, onBack, navigation, right = null }) => (
  <View style={{ paddingHorizontal: 20, paddingTop: 14, paddingBottom: 10, backgroundColor: '#000' }}>
    {showBack ? (
      <TouchableOpacity
        onPress={onBack || (() => navigation?.goBack())}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}
      >
        <Icon name="chevron-back" size={20} color="#a3a3a3" />
      </TouchableOpacity>
    ) : null}
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' }}>
      <View style={{ flex: 1 }}>
        <CustomText fontType="primary" weight="Bold" style={{ color: '#fff', fontSize: 28, letterSpacing: -0.5 }}>
          {title}
        </CustomText>
        {subtitle ? (
          <CustomText fontType="primary" weight="Regular" style={{ color: '#8a8a92', fontSize: 13, marginTop: 2 }}>
            {subtitle}
          </CustomText>
        ) : null}
      </View>
      {right}
    </View>
  </View>
);

export default LargeTitle;
