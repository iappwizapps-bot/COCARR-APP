import React from 'react';
import { Text, StyleSheet } from 'react-native';

const CustomText = ({ children, fontType = 'primary', weight = 'Regular', style, numberOfLines=1, ...props }) => {
  // Define a mapping for font weights to custom font files for both primary and secondary fonts
  const fontMapping = {
    primary: {
      ExtraBold: 'Inter-ExtraBold',
      Bold: 'Inter-Bold',
      Light: 'Inter-Light',
      Medium: 'Inter-Medium',
      Regular: 'Inter-Regular',
      SemiBold: 'Inter-SemiBold',
    },
    secondary: {
      Bold: 'Geist-Bold',
      Light: 'Geist-Light',
      Medium: 'Geist-Medium',
      Regular: 'Geist-Regular',
      SemiBold: 'Geist-SemiBold',
    }
  };

  // Get the font family based on the fontType and weight parameters
  const fontFamily = (fontMapping[fontType] && fontMapping[fontType][weight]) || fontMapping.primary.Regular;

  return (
    <Text style={[styles.text, { fontFamily }, style]} numberOfLines={numberOfLines} {...props}>
      {children}
    </Text>
  );
};

const styles = StyleSheet.create({
  text: {
    fontSize: 16,
    marginBottom:0,
    letterSpacing: 0.2,
    color: '#000',
  },
});

export default CustomText;
