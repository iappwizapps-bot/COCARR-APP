const ErrorModal = ({title}) => {
    return(
        <View style={{flex:1,justifyContent:'center',alignItems:'center',backgroundColor:'rgba(0,0,0,0.5)'}}>
            <View style={{backgroundColor:'#fff',padding:16,borderRadius:12}}>
                <CustomText fontType='primary' weight='SemiBold' style={{color:'#000', fontSize:16,marginBottom:0}}>{title}</CustomText>
            </View>
        </View>
    )

}