import React from 'react';
import { View } from 'react-native';
import { WebView } from 'react-native-webview';

const TermsAndConditionsScreen = () => {
  return (
    <View style={{flex: 1, backgroundColor: '#151515'}}>
      <WebView
        source={{uri: 'https://cocarr.com/terms-and-conditions'}}
        style={{flex: 1}}
        startInLoadingState={true}
        scalesPageToFit={true}
      />
    </View>
  );
};

export default TermsAndConditionsScreen;
