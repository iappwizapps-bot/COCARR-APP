import React, { useState } from 'react';
import { View, TouchableOpacity, Modal, Pressable } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import CustomText from './CustomText';
import { updateUserRole } from '../store/authSlice';
import { BRAND_COLOR } from '../utils/constants';

// The single affordance for moving between the renting shell and the hosting
// shell. It sits in the same place on both home screens so the action is
// symmetric — previously "become a host" was a tab and "go back to customer"
// was a buried row in the host profile, which is what made the two directions
// feel unrelated.
//
// Switching only writes `userRole` to the store. MainNavigator renders one
// shell or the other from that value, so there is no imperative navigation
// here and no race with a navigation effect.

const MODES = [
  { key: 'customer', title: 'Rent a car', subtitle: 'Browse and book cars', icon: 'car-outline' },
  { key: 'host', title: 'Host a car', subtitle: 'Manage your cars and bookings', icon: 'key-outline' },
];

export default function ModeSwitcher({ style }) {
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const { userRole, isHost } = useSelector((state) => state.auth);
  const [open, setOpen] = useState(false);

  const current = userRole === 'host' ? 'host' : 'customer';

  const choose = (key) => {
    setOpen(false);
    if (key === current) return;
    // Only a registered host may enter the host shell. Everyone else is sent to
    // the sign-up screen, which is a pushed route rather than a shell of its own.
    if (key === 'host' && !isHost) {
      navigation.navigate('BecomeHost');
      return;
    }
    dispatch(updateUserRole({ userRole: key }));
  };

  return (
    <>
      <TouchableOpacity
        onPress={() => setOpen(true)}
        style={[{
          flexDirection: 'row', alignItems: 'center', gap: 6,
          backgroundColor: '#1c1c1e', borderRadius: 20,
          paddingVertical: 7, paddingHorizontal: 12,
        }, style]}
      >
        <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: BRAND_COLOR }} />
        <CustomText fontType='primary' weight='Bold' style={{ color: '#e3e3e3', fontSize: 10, textTransform: 'uppercase', letterSpacing: .3 }}>
          {current === 'host' ? 'Hosting' : 'Renting'}
        </CustomText>
        <Icon name="swap-horizontal-outline" size={14} color="#959595" />
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable onPress={() => setOpen(false)} style={{ flex: 1, backgroundColor: '#000000aa', justifyContent: 'flex-end' }}>
          {/* Stop taps inside the sheet from closing it. */}
          <Pressable onPress={() => {}} style={{ backgroundColor: '#151517', borderTopLeftRadius: 18, borderTopRightRadius: 18, padding: 16, paddingBottom: 28 }}>
            <View style={{ alignSelf: 'center', width: 36, height: 4, borderRadius: 2, backgroundColor: '#3a3a3e', marginBottom: 16 }} />
            <CustomText fontType='primary' weight='Bold' style={{ color: '#959595', fontSize: 10, textTransform: 'uppercase', letterSpacing: .5, marginBottom: 10 }}>
              Switch mode
            </CustomText>

            {MODES.map((m) => {
              const active = m.key === current;
              return (
                <TouchableOpacity
                  key={m.key}
                  onPress={() => choose(m.key)}
                  style={{
                    flexDirection: 'row', alignItems: 'center', gap: 12,
                    backgroundColor: active ? '#EDBF3118' : '#1c1c1e',
                    borderWidth: 1, borderColor: active ? BRAND_COLOR : '#26262a',
                    borderRadius: 12, padding: 14, marginBottom: 10,
                  }}
                >
                  <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: '#232327', justifyContent: 'center', alignItems: 'center' }}>
                    <Icon name={m.icon} size={18} color={active ? BRAND_COLOR : '#a3a3a3'} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <CustomText fontType='primary' weight='Bold' style={{ color: '#e3e3e3', fontSize: 14 }}>{m.title}</CustomText>
                    <CustomText fontType='primary' weight='Regular' style={{ color: '#757575', fontSize: 11, marginTop: 2 }}>
                      {m.key === 'host' && !isHost ? 'Set up hosting to get started' : m.subtitle}
                    </CustomText>
                  </View>
                  {active
                    ? <Icon name="checkmark-circle" size={20} color={BRAND_COLOR} />
                    : <Icon name="chevron-forward" size={16} color="#5a5a62" />}
                </TouchableOpacity>
              );
            })}
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}
