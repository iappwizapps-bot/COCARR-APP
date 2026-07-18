import { StyleSheet, View,TouchableOpacity,Text } from "react-native";
import Icon from 'react-native-vector-icons/Ionicons';
import CustomText from "./CustomText";

const Header = ({navigation,title,showBackButton=true,customSecondaryText=false,position='relative',rightComponent=null}) => {
  return (
    <View style={{...styles.headerContainer,justifyContent:showBackButton ? 'space-between' : 'center'}}>
      {showBackButton && <View style={styles.headerLeft}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Icon name="chevron-back" size={20} color="#a3a3a3" />
        </TouchableOpacity>
      </View>}
      <View style={{flex:1,alignItems:'center',marginLeft:rightComponent ? 0 : showBackButton ? -24 : 0}}>
          <CustomText fontType='primary' weight='SemiBold' style={styles.titleText}>{title}</CustomText>
          {customSecondaryText && <CustomText fontType='primary' weight='SemiBold' style={styles.secondaryText}>{customSecondaryText}</CustomText>}
        </View>
      {rightComponent && <View>{rightComponent}</View>}
    </View>
  );
}


const styles = StyleSheet.create({
    headerContainer: {
        flexDirection:'row',
        justifyContent:'space-between',
        alignItems:'center',
        paddingHorizontal:24,
        paddingVertical:20,
        paddingBottom:0
    },
    headerLeft: {
        flexDirection:'row',
        alignItems:'center',
    },
    backButton: {
      width:24,
        padding:4,
        paddingLeft:0
    },
    datePickerButton: {
        padding:4,
    },
    shareButton: {
        padding:4,
    },
    titleText: {
        color:'#fff',
        fontSize:12,
        textAlign:'center',
    },
    secondaryText: {
        color:'#a3a3a3',
        fontSize:11,
        fontWeight:'400',
        textTransform:'uppercase',
        letterSpacing:.15,
        marginTop:0,
        textAlign:'center'
    }

})

export default Header;