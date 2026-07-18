import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ImageBackground, Dimensions } from 'react-native';

// const {  } = Dimensions.get('window');

export function OpenScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <ImageBackground
        source={require('../../images/cocarr-app-banner.jpg')}
        style={styles.backgroundImage}
        resizeMode="cover"
      />
      <View style={styles.contentContainer}>
        <Text style={styles.title}>Enjoy luxury with our self-drive car</Text>
        <TouchableOpacity 
          style={styles.button} 
          onPress={() => navigation.navigate('MobileInput')}
        >
          <Text style={styles.buttonText}>Let's Start Riding</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent:'space-between'
  },
  backgroundImage: {
    height: '100%',
    width: '100%',
  },
  contentContainer: {
    flex: 1,
    position:'absolute',
    left:0,
    bottom:0,
    width:'94%',
    marginBottom:24,
    borderRadius:24,
    marginHorizontal:12,
    backgroundColor:'rgba(0,0,0,0.85)',
    
    justifyContent: 'center',
    alignItems: 'flex-start',
    paddingHorizontal: 28,
    borderCurve:'continuous',
    paddingVertical:40,
  },
  title: {
    fontSize: 20,
    lineHeight:32,
    fontFamily:'Inter-Medium',
    letterSpacing:-.1,
    fontWeight: '600',
    maxWidth:'70%',
    color: '#fff',
    marginBottom: 32,
    textAlign: 'left',
  },
  button: {
    backgroundColor: '#EDBF31',
    paddingHorizontal: 18,
    paddingVertical: 16,
    width:'100%',
    borderRadius: 8,
  },
  buttonText: {
    color: '#000',
    fontSize: 14,
    textAlign:'center',
    textTransform:'uppercase',
    letterSpacing:-0.35,
    fontWeight: '700',
  },
});
