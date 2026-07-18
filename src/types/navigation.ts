import { NativeStackScreenProps } from '@react-navigation/native-stack';

export type HomeStackParamList = {
  HomeIndex: undefined;
  CarsListing: undefined;
  CarInfo: { carId: string };
  DatePicker: {
    visible: boolean;
    onClose: () => void;
    onSelect: (date: Date) => void;
  };
  CityPicker: {
    visible: boolean;
    onClose: () => void;
    onSelect: (city: { id: string; name: string }) => void;
  };
};

export type HomeStackScreenProps<T extends keyof HomeStackParamList> = 
  NativeStackScreenProps<HomeStackParamList, T>; 