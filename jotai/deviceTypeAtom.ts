// import * as Device from 'expo-device'
import { atom } from 'jotai'
import DeviceInfo from 'react-native-device-info';

export const deviceTypeAtom = atom(DeviceInfo.getDeviceType() === 'Tablet' ? 2 : 1)
